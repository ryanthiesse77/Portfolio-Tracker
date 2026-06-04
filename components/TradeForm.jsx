import { useState, useEffect } from 'react'
import { SECTORS } from '../lib/utils'

const defaultForm = {
  ticker: '',
  company_name: '',
  sector: 'Technology',
  trade_type: 'buy',
  date: new Date().toISOString().split('T')[0],
  shares: '',
  dollar_amount: '',
  price_per_share: '',
  notes: '',
}

export default function TradeForm({ onSaved, editTrade, onCancelEdit }) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (editTrade) {
      setForm({
        ...editTrade,
        dollar_amount: (editTrade.shares * editTrade.price_per_share).toFixed(2),
      })
    } else {
      setForm(defaultForm)
    }
  }, [editTrade])

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-calculate shares or dollar_amount
      if (field === 'shares' && next.price_per_share) {
        next.dollar_amount = (parseFloat(value) * parseFloat(next.price_per_share)).toFixed(2)
      }
      if (field === 'dollar_amount' && next.price_per_share) {
        next.shares = (parseFloat(value) / parseFloat(next.price_per_share)).toFixed(6)
      }
      if (field === 'price_per_share') {
        if (next.shares) {
          next.dollar_amount = (parseFloat(next.shares) * parseFloat(value)).toFixed(2)
        } else if (next.dollar_amount) {
          next.shares = (parseFloat(next.dollar_amount) / parseFloat(value)).toFixed(6)
        }
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ticker: form.ticker.toUpperCase(),
      company_name: form.company_name,
      sector: form.sector,
      trade_type: form.trade_type,
      date: form.date,
      shares: parseFloat(form.shares),
      price_per_share: parseFloat(form.price_per_share),
      notes: form.notes || null,
    }

    try {
      const url = '/api/trades'
      const method = editTrade ? 'PUT' : 'POST'
      const body = editTrade ? { id: editTrade.id, ...payload } : payload

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(defaultForm)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stat-card space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">
        {editTrade ? 'Edit Trade' : 'Add Trade'}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ticker</label>
          <input
            className="input-field uppercase"
            placeholder="AAPL"
            value={form.ticker}
            onChange={e => set('ticker', e.target.value.toUpperCase())}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Company Name</label>
          <input
            className="input-field"
            placeholder="Apple Inc."
            value={form.company_name}
            onChange={e => set('company_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sector</label>
          <select
            className="input-field"
            value={form.sector}
            onChange={e => set('sector', e.target.value)}
          >
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Trade Type</label>
          <div className="flex gap-2">
            {['buy', 'sell'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('trade_type', t)}
                className={`flex-1 py-2 rounded-lg text-sm font-mono uppercase tracking-wide transition-colors ${
                  form.trade_type === t
                    ? t === 'buy' ? 'bg-gain/20 text-gain border border-gain/30' : 'bg-loss/20 text-loss border border-loss/30'
                    : 'border border-navy-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Date</label>
        <input
          type="date"
          className="input-field"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-white font-medium mb-1">
          {form.trade_type === 'sell' ? 'Sale Price Per Share' : 'Purchase Price Per Share'}
          <span className="text-loss ml-1">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          The exact price you {form.trade_type === 'sell' ? 'sold' : 'paid'} per share
        </p>
        <input
          type="number"
          step="0.0001"
          min="0"
          className="input-field text-base font-mono"
          placeholder="e.g. 182.50"
          value={form.price_per_share}
          onChange={e => set('price_per_share', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Shares</label>
          <input
            type="number"
            step="0.000001"
            min="0"
            className="input-field"
            placeholder="0"
            value={form.shares}
            onChange={e => set('shares', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">— or — Dollar Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            placeholder="$0.00"
            value={form.dollar_amount}
            onChange={e => set('dollar_amount', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
        <textarea
          className="input-field resize-none h-16"
          placeholder="Optional notes..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      {error && <p className="text-loss text-xs">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Saving...' : editTrade ? 'Update Trade' : 'Add Trade'}
        </button>
        {editTrade && (
          <button type="button" className="btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
