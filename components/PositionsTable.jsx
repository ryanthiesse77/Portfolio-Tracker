import dayjs from 'dayjs'
import { formatCurrency, formatPct, formatShares, pctChange } from '../lib/utils'

export default function PositionsTable({ positions, priceMap, onResearch, closed = false }) {
  const rows = positions.filter(p => closed ? !p.is_open : p.is_open)

  if (!rows.length) {
    return (
      <div className="stat-card">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">
          {closed ? 'Closed Positions' : 'Open Positions'}
        </h2>
        <p className="text-gray-500 text-sm text-center py-6">No {closed ? 'closed' : 'open'} positions</p>
      </div>
    )
  }

  // For closed positions use shares_at_close, for open use shares_held
  const totalPortfolioValue = rows.reduce((sum, pos) => {
    const shares = closed ? (pos.shares_at_close || pos.shares_held) : pos.shares_held
    const price = closed ? pos.exit_price : priceMap[pos.ticker]?.close_price || pos.avg_cost_basis
    return sum + shares * price
  }, 0)

  return (
    <div className="stat-card overflow-hidden">
      <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">
        {closed ? 'Closed Positions' : 'Open Positions'}
        {closed && <span className="ml-2 text-gray-600">(Realized)</span>}
      </h2>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">Company</th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">
                {closed ? 'Sell Date' : 'Purchase Date'}
              </th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">Shares</th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">Avg Cost</th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">
                {closed ? 'Sold At' : 'Current Price'}
              </th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">% Portfolio</th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">
                {closed ? 'Realized $' : 'Return $'}
              </th>
              <th className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">Return %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(pos => {
              const shares = closed ? (pos.shares_at_close || pos.shares_held) : pos.shares_held
              const currentPrice = closed
                ? pos.exit_price
                : priceMap[pos.ticker]?.close_price || pos.avg_cost_basis
              const totalValue = shares * currentPrice
              const totalCost = shares * pos.avg_cost_basis
              const returnDollar = totalValue - totalCost
              const returnPct = pctChange(totalValue, totalCost)
              const portfolioPct = totalPortfolioValue ? (totalValue / totalPortfolioValue) * 100 : 0
              const displayDate = closed ? pos.exit_date : pos.open_date

              return (
                <tr
                  key={pos.ticker}
                  className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors"
                >
                  <td className="table-cell">
                    <button
                      onClick={() => !closed && onResearch?.(pos)}
                      className={`text-left ${!closed ? 'hover:text-accent cursor-pointer' : ''}`}
                    >
                      <p className="text-white font-medium text-sm">{pos.company_name}</p>
                      <p className={`text-xs font-mono ${!closed ? 'text-accent' : 'text-gray-500'}`}>
                        {pos.ticker}
                      </p>
                    </button>
                  </td>
                  <td className="table-cell text-gray-400 font-mono text-xs">
                    {displayDate ? dayjs(displayDate).format('MMM D, YYYY') : '—'}
                  </td>
                  <td className="table-cell text-gray-300 font-mono text-xs">{formatShares(shares)}</td>
                  <td className="table-cell text-gray-300 font-mono text-xs">{formatCurrency(pos.avg_cost_basis)}</td>
                  <td className="table-cell text-white font-mono text-xs">{formatCurrency(currentPrice)}</td>
                  <td className="table-cell text-gray-400 font-mono text-xs">{portfolioPct.toFixed(1)}%</td>
                  <td className={`table-cell font-mono text-xs font-medium ${returnDollar >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {returnDollar >= 0 ? '+' : ''}{formatCurrency(returnDollar)}
                  </td>
                  <td className={`table-cell font-mono text-xs font-medium ${returnPct >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {formatPct(returnPct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
