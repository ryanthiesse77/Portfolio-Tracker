import { getSupabaseServer } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabase = getSupabaseServer()

  try {
    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .order('ticker')

    const openTickers = positions?.filter(p => p.is_open).map(p => p.ticker) || []
    const priceMap = {}

    for (const ticker of openTickers) {
      const { data } = await supabase
        .from('stock_prices')
        .select('close_price, date')
        .eq('ticker', ticker)
        .order('date', { ascending: false })
        .limit(1)
        .single()
      if (data) priceMap[ticker] = data
    }

    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('date, total_value, total_cost_basis')
      .order('date', { ascending: true })

    const { data: cashFlows } = await supabase
      .from('cash_flows')
      .select('*')
      .order('date', { ascending: true })

    const { data: options } = await supabase
      .from('options_positions')
      .select('*')
      .order('expiration_date', { ascending: true })

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      positions,
      priceMap,
      snapshots,
      cashFlows: cashFlows || [],
      options: options || [],
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
