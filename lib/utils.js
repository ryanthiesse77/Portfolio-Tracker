import dayjs from 'dayjs'

export function calcPositions(trades) {
  const map = {}

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))

  for (const t of sorted) {
    const tk = t.ticker
    if (!map[tk]) {
      map[tk] = {
        ticker: t.ticker,
        company_name: t.company_name,
        sector: t.sector,
        shares_held: 0,
        total_cost: 0,
        avg_cost_basis: 0,
        is_open: true,
        realized_pnl: 0,
        exit_price: null,
        exit_date: null,
        open_date: t.date,
        shares_at_close: null,
        total_shares_bought: 0,
      }
    }
    const pos = map[tk]
    if (t.trade_type === 'buy') {
      pos.total_cost += t.shares * t.price_per_share
      pos.shares_held += t.shares
      pos.total_shares_bought += t.shares
      pos.avg_cost_basis = pos.total_cost / pos.shares_held
      if (!pos.open_date || t.date < pos.open_date) pos.open_date = t.date
    } else {
      const realizedPerShare = t.price_per_share - pos.avg_cost_basis
      pos.realized_pnl += realizedPerShare * t.shares
      pos.shares_held -= t.shares
      pos.exit_price = t.price_per_share
      pos.exit_date = t.date
      if (pos.shares_held <= 0.000001) {
        pos.shares_at_close = pos.total_shares_bought
        pos.shares_held = 0
        pos.is_open = false
      }
    }
  }

  return Object.values(map)
}

export function formatCurrency(val, compact = false) {
  if (val === null || val === undefined) return '—'
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

export function formatPct(val) {
  if (val === null || val === undefined) return '—'
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}

export function formatShares(val) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val.toFixed(6)).toString()
}

export function pctChange(current, cost) {
  if (!cost) return 0
  return ((current - cost) / cost) * 100
}

export function filterByRange(snapshots, range) {
  if (!snapshots?.length) return []
  const now = dayjs()
  let cutoff
  switch (range) {
    case '1W': cutoff = now.subtract(7, 'day'); break
    case '1M': cutoff = now.subtract(1, 'month'); break
    case '3M': cutoff = now.subtract(3, 'month'); break
    case '6M': cutoff = now.subtract(6, 'month'); break
    case '1Y': cutoff = now.subtract(1, 'year'); break
    default: return snapshots
  }
  return snapshots.filter(s => dayjs(s.date).isAfter(cutoff))
}

export const SECTORS = [
  'Technology',
  'Healthcare',
  'Financials',
  'Energy',
  'Consumer Discretionary',
  'Consumer Staples',
  'Industrials',
  'Utilities',
  'Real Estate',
  'Materials',
  'Communication Services',
  'Other',
]
