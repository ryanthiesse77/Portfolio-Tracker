import { useState } from 'react'
import dayjs from 'dayjs'
import { formatCurrency, formatShares } from '../lib/utils'

export default function TradeHistory({ trades, onEdit, onRefresh }) {
  const [deleting, setDeleting] = useState(null)

  async function handleDelete(id) {
    if (!confirm('Delete this trade? Positions will be recalculated.')) return
    setDeleting(id)
    try {
      await fetch(`/api/trades?id=${id}`, { method: 'DELETE' })
      onRefresh?.()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="stat-card overflow-hidden">
      <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">Trade History</h2>
      {!trades?.length ? (
        <p className="text-gray-500 text-sm text-center py-6">No trades yet</p>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-navy-800">
                {['Date', 'Ticker', 'Type', 'Shares', 'Price', 'Total', ''].map(h => (
                  <th key={h} className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="table-cell text-gray-400 font-mono text-xs">{dayjs(t.date).format('MMM D, YY')}</td>
                  <td className="table-cell">
                    <p className="text-white text-sm font-medium">{t.ticker}</p>
                    <p className="text-gray-500 text-xs truncate max-w-[100px]">{t.company_name}</p>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${
                      t.trade_type === 'buy' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                    }`}>
                      {t.trade_type}
                    </span>
                  </td>
                  <td className="table-cell text-gray-300 font-mono text-xs">{formatShares(t.shares)}</td>
                  <td className="table-cell text-gray-300 font-mono text-xs">{formatCurrency(t.price_per_share)}</td>
                  <td className="table-cell text-white font-mono text-xs">{formatCurrency(t.shares * t.price_per_share)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(t)}
                        className="text-xs text-gray-500 hover:text-accent transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="text-xs text-gray-500 hover:text-loss transition-colors"
                      >
                        {deleting === t.id ? '...' : 'Del'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
