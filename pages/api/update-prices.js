import { getSupabaseServer } from '../../lib/supabase'

async function fetchYahooPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    }
  })
  const data = await res.json()
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
  return price || null
}

async function fetchYahooHistory(ticker, fromDate, toDate) {
  const period1 = Math.floor(new Date(fromDate).getTime() / 1000)
  const period2 = Math.floor(new Date(toDate).getTime() / 1000)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${period1}&period2=${period2}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  if (!result) return []
  const timestamps = result.timestamps || result.timestamp || []
  const closes = result.indicators?.quote?.[0]?.close || []
  return timestamps.map((t, i) => ({
    date: new Date(t * 1000).toISOString().split('T')[0],
    close: closes[i],
  })).filter(r => r.close != null)
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseServer()

  try {
    const { data: positions } = await supabase
      .from('positions')
      .select('ticker')
      .eq('is_open', true)

    if (!positions?.length) {
      return res.status(200).json({ message: 'No open positions to update' })
    }

    const tickers = [...new Set(positions.map(p => p.ticker))]
    const today = new Date().toISOString().split('T')[0]
    const results = []
    const errors = []

    const { data: earliestTrade } = await supabase
      .from('trades')
      .select('date')
      .order('date', { ascending: true })
      .limit(1)
      .single()

    const startDate = earliestTrade?.date || '2026-01-01'

    for (const ticker of tickers) {
      try {
        const { data: existingPrices } = await supabase
          .from('stock_prices')
          .select('date')
          .eq('ticker', ticker)
          .order('date', { ascending: false })
          .limit(1)

        const lastDate = existingPrices?.[0]?.date
        const daysSinceUpdate = lastDate
          ? Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24))
          : 999

        if (daysSinceUpdate <= 1) {
          const price = await fetchYahooPrice(ticker)
          if (price) {
            await supabase.from('stock_prices').upsert(
              { ticker, date: today, close_price: price },
              { onConflict: 'ticker,date' }
            )
            results.push({ ticker, close_price: price, date: today })
          }
        } else {
          const fromDate = lastDate || startDate
          const history = await fetchYahooHistory(ticker, fromDate, today)

          if (history.length) {
            const rows = history.map(r => ({
              ticker,
              date: r.date,
              close_price: r.close,
            }))
            await supabase.from('stock_prices').upsert(rows, { onConflict: 'ticker,date' })
            const latest = rows[rows.length - 1]
            results.push({ ticker, close_price: latest.close_price, date: latest.date, backfilled: rows.length })
          } else {
            // Fallback to current price only
            const price = await fetchYahooPrice(ticker)
            if (price) {
              await supabase.from('stock_prices').upsert(
                { ticker, date: today, close_price: price },
                { onConflict: 'ticker,date' }
              )
              results.push({ ticker, close_price: price, date: today })
            }
          }
        }
      } catch (e) {
        console.error(`Failed to fetch price for ${ticker}:`, e.message)
        errors.push({ ticker, error: e.message })
      }
    }

    // Compute portfolio snapshot
    const { data: allPositions } = await supabase
      .from('positions')
      .select('*')
      .eq('is_open', true)

    let totalValue = 0
    let totalCostBasis = 0

    for (const pos of allPositions || []) {
      const { data: latestPrice } = await supabase
        .from('stock_prices')
        .select('close_price')
        .eq('ticker', pos.ticker)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (latestPrice) {
        totalValue += pos.shares_held * latestPrice.close_price
      }
      totalCostBasis += pos.shares_held * pos.avg_cost_basis
    }

    await supabase.from('portfolio_snapshots').upsert(
      { date: today, total_value: totalValue, total_cost_basis: totalCostBasis },
      { onConflict: 'date' }
    )

    return res.status(200).json({
      success: true,
      updated: results,
      errors,
      snapshot: { totalValue, totalCostBasis }
    })
  } catch (err) {
    console.error('update-prices error:', err)
    return res.status(500).json({ error: err.message })
  }
}
