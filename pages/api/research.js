import { getSupabaseServer } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { ticker, company_name } = req.body
  if (!ticker || !company_name) return res.status(400).json({ error: 'Missing ticker or company_name' })

  const supabase = getSupabaseServer()

  try {
    // Check cache
    const { data: cached } = await supabase
      .from('ai_research_cache')
      .select('*')
      .eq('ticker', ticker)
      .single()

    if (cached) {
      const ageMs = Date.now() - new Date(cached.generated_at).getTime()
      const ageDays = ageMs / (1000 * 60 * 60 * 24)
      if (ageDays < 14) {
        return res.status(200).json({ research: cached.research_json, generated_at: cached.generated_at, cached: true })
      }
    }

    // Call Claude API without web_search to avoid complex multi-block responses
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: 'You are a concise financial research assistant. You must respond with ONLY a valid JSON object, no other text, no markdown, no code fences.',
        messages: [
          {
            role: 'user',
            content: `Provide a brief investment research summary for ${company_name} (${ticker}).
Return ONLY a JSON object with exactly these keys: overview, whats_compelling, risks, catalysts.
Each value is a string of 2-4 sentences. Keep total output under 300 words.
Use plain language suitable for a retail investor.
IMPORTANT: Return only the raw JSON object, nothing else.`,
          },
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Claude API error' })
    }

    // Extract text from all content blocks
    const textContent = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    if (!textContent) {
      return res.status(500).json({ error: 'No response from Claude' })
    }

    // Parse JSON — strip any markdown fences just in case
    let researchJson = null
    const clean = textContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    try {
      researchJson = JSON.parse(clean)
    } catch {
      // Try to find JSON object within the text
      const match = clean.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          researchJson = JSON.parse(match[0])
        } catch {
          return res.status(500).json({ error: 'Failed to parse research from Claude', raw: clean.substring(0, 200) })
        }
      } else {
        return res.status(500).json({ error: 'Failed to parse research from Claude', raw: clean.substring(0, 200) })
      }
    }

    const generated_at = new Date().toISOString()

    await supabase.from('ai_research_cache').upsert(
      { ticker, research_json: researchJson, generated_at },
      { onConflict: 'ticker' }
    )

    return res.status(200).json({ research: researchJson, generated_at, cached: false })
  } catch (err) {
    console.error('AI research error:', err)
    return res.status(500).json({ error: err.message })
  }
}
