import { useState } from 'react'
import dayjs from 'dayjs'
import { formatCurrency } from '../lib/utils'

export default function CashFlowForm({ cashFlows, onSaved }) {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('Initial Deposit')
  const [type, setType] = useState('deposit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const totalDeposited = (cashFlows || []).reduce((sum, c) => sum + parseFloat(c.amount), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const finalAmount = type === 'withdrawal' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount))
      const res = await fetch('/api/cash-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, amount: finalAmount, label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAmount('')
      setLabel('Initial Deposit')
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this cash entry?')) return
    setDeleting(id)
    try {
      await fetch(`/api/cash-flows?id=${id}`, { method: 'DELETE' })
      onSaved?.()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="stat-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">Cash Flows</h2>
        <span className="text-xs font-mono text-gray-400">
          Total Deposited: <span className="text-white font-medium">{formatCurrency(totalDeposited)}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Deposit / Withdrawal toggle */}
        <div className="flex gap-2">
          {['deposit', 'withdrawal'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-mono capitalize tracking-wide transition-colors ${
                type === t
                  ? t === 'deposit'
                    ? 'bg-gain/20 text-gain border border-gain/30'
                    : 'bg-loss/20 text-loss border border-loss/30'
                  : 'border border-navy-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Label</label>
          <input
            className="input-field"
            placeholder="e.g. Initial Deposit, Monthly Addition"
            value={label}
            onChange={e => setLabel(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-loss text-xs">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving...' : `Add ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
        </button>
      </form>

      {/* History */}
      {cashFlows?.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-navy-800">
          <p className="text-xs text-gray-600 font-mono uppercase tracking-wide">History</p>
          {cashFlows.map(cf => (
            <div key={cf.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-mono">{dayjs(cf.date).format('MMM D, YYYY')}</span>
              <span className="text-gray-300 flex-1 mx-3 truncate">{cf.label}</span>
              <span className={`font-mono font-medium ${cf.amount >= 0 ? 'text-gain' : 'text-loss'}`}>
                {cf.amount >= 0 ? '+' : ''}{formatCurrency(cf.amount)}
              </span>
              <button
                onClick={() => handleDelete(cf.id)}
                disabled={deleting === cf.id}
                className="ml-3 text-gray-600 hover:text-loss transition-colors"
              >
                {deleting === cf.id ? '...' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
