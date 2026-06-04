import { useState } from 'react'
import dayjs from 'dayjs'
import { formatCurrency, formatPct } from '../lib/utils'

export default function OptionsTable({ options, onEdit, onClose, onRefresh, isAdmin = false }) {
  const [closing, setClosing] = useState(null)
  const [closePrice, setClosePrice] = useState('')
  const [deleting, setDeleting] = useState(null)

  const open = options.filter(o => o.is_open)
  const closed = options.filter(o => !o.is_open)

  async function handleClose(option) {
    if (!closePrice) return
    setClosing(null)
    try {
      await fetch('/api/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: option.id,
          is_open: false,
          close_price: parseFloat(closePrice),
          closed_at: new Date().toISOString().split('T')[0],
        }),
      })
      setClosePrice('')
      onRefresh?.()
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this option?')) return
    setDeleting(id)
    try {
      await fetch(`/api/options?id=${id}`, { method: 'DELETE' })
      onRefresh?.()
    } finally {
      setDeleting(null)
    }
  }

  function isExpired(expDate) {
    return dayjs(expDate).isBefore(dayjs(), 'day')
  }

  function renderRow(o, isClosed) {
    const costBasis = o.premium_paid * o.contracts * 100
    const currentVal = isClosed
      ? (o.close_price ?? 0) * o.contracts * 100
      : (o.current_value ?? o.premium_paid) * o.contracts * 100
    const pnl = currentVal - costBasis
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0
    const expired = isExpired(o.expiration_date) && o.is_open

    return (
      <tr key={o.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
        <td className="table-cell">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{o.ticker}</span>
            <span className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded ${
              o.option_type === 'call' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
            }`}>
              {o.option_type}
            </span>
            {expired && (
              <span className="text-xs font-mono bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">
                expired
              </span>
            )}
          </div>
        </td>
        <td className="table-cell text-gray-300 font-mono text-xs">${o.strike_price}</td>
        <td className="table-cell text-gray-300 font-mono text-xs">
          {dayjs(o.expiration_date).format('MMM D, YY')}
        </td>
        <td className="table-cell text-gray-300 font-mono text-xs">{o.contracts}</td>
        <td className="table-cell text-gray-300 font-mono text-xs">{formatCurrency(o.premium_paid)}</td>
        <td className="table-cell text-white font-mono text-xs">
          {isClosed ? formatCurrency(o.close_price) : (o.current_value != null ? formatCurrency(o.current_value) : '—')}
        </td>
        <td className="table-cell text-gray-400 font-mono text-xs">{formatCurrency(costBasis)}</td>
        <td className={`table-cell font-mono text-xs font-medium ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
        </td>
        <td className={`table-cell font-mono text-xs font-medium ${pnlPct >= 0 ? 'text-gain' : 'text-loss'}`}>
          {formatPct(pnlPct)}
        </td>
        {isAdmin && (
          <td className="table-cell">
            <div className="flex gap-2 items-center">
              <button onClick={() => onEdit?.(o)} className="text-xs text-gray-500 hover:text-accent transition-colors">
                Edit
              </button>
              {o.is_open && (
                closing === o.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 bg-navy-800 border border-navy-600 rounded px-1 py-0.5 text-xs text-white font-mono"
                      placeholder="0.00"
                      value={closePrice}
                      onChange={e => setClosePrice(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => handleClose(o)} className="text-xs text-gain hover:text-white">✓</button>
                    <button onClick={() => setClosing(null)} className="text-xs text-gray-500 hover:text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setClosing(o.id); setClosePrice('') }} className="text-xs text-gray-500 hover:text-gain transition-colors">
                    Close
                  </button>
                )
              )}
              <button
                onClick={() => handleDelete(o.id)}
                disabled={deleting === o.id}
                className="text-xs text-gray-500 hover:text-loss transition-colors"
              >
                {deleting === o.id ? '...' : 'Del'}
              </button>
            </div>
          </td>
        )}
      </tr>
    )
  }

  const headers = ['Ticker', 'Strike', 'Expiry', 'Contracts', 'Premium', 'Current', 'Cost Basis', 'P&L $', 'P&L %', ...(isAdmin ? ['Actions'] : [])]

  return (
    <div className="space-y-4">
      {/* Open Options */}
      <div className="stat-card overflow-hidden">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">Open Options</h2>
        {!open.length ? (
          <p className="text-gray-500 text-sm text-center py-4">No open options</p>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-navy-800">
                  {headers.map(h => (
                    <th key={h} className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{open.map(o => renderRow(o, false))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Options */}
      {closed.length > 0 && (
        <div className="stat-card overflow-hidden">
          <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">
            Closed Options <span className="text-gray-600">(Realized)</span>
          </h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-navy-800">
                  {headers.map(h => (
                    <th key={h} className="table-cell text-xs text-gray-500 font-mono uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{closed.map(o => renderRow(o, true))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
