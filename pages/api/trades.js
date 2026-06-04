import { getSupabaseServer } from '../../lib/supabase'
import { calcPositions } from '../../lib/utils'

async function rebuildPositions(supabase) {
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .order('date', { ascending: true })

  const positions = calcPositions(trades || [])

  await supabase.from('positions').delete().neq('id', 0)

  if (positions.length > 0) {
    const rows = positions.map(p => ({
      ticker: p.ticker,
      company_name: p.company_name,
      sector: p.sector,
      shares_held: p.shares_held,
      avg_cost_basis: p.avg_cost_basis,
      is_open: p.is_open,
      open_date: p.open_date || null,
      exit_price: p.exit_price || null,
      exit_date: p.exit_date || null,
      shares_at_close: p.shares_at_close || null,
    }))
    await supabase.from('positions').insert(rows)
  }
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const trade = req.body
    const { data, error } = await supabase.from('trades').insert([trade]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await rebuildPositions(supabase)
    return res.status(201).json(data)
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    const { data, error } = await supabase.from('trades').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await rebuildPositions(supabase)
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await rebuildPositions(supabase)
    return res.status(200).json({ success: true })
  }

  return res.status(405).end()
}
