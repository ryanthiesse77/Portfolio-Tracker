import { getSupabaseServer } from '../../lib/supabase'

export default async function handler(req, res) {
  const supabase = getSupabaseServer()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('*')
      .order('date', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { date, amount, label } = req.body
    const { data, error } = await supabase
      .from('cash_flows')
      .insert([{ date, amount: parseFloat(amount), label }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase.from('cash_flows').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).end()
}
