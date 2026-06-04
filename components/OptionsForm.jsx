import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

const defaultForm = {
  ticker: '',
  option_type: 'call',
  strike_price: '',
  expiration_date: '',
  contracts: '',
  premium_paid: '',
  current_value: '',
  notes: '',
}

export default function OptionsForm({ onSaved, editOption, onCancelEdit }) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (editOption) {
      setForm({
        ticker: editOption.ticker,
        option_type: editOption.option_type,
        strike_price: editOption.strike_price,
        expiration_date: editOption.expiration_date,
        contracts: editOption.contracts,
        premium_paid: editOption.premium_paid,
        current_value: editOption.current_value ?? '',
        notes: editOption.notes ?? '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [editOption])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ticker: form.ticker.toUpperCase(),
        option_type: form.option_type,
        strike_price: parseFloat(form.strike_price),
        expiration_date: form.expiration_date,
        contracts: parseInt(form.contracts),
        premium_paid: parseFloat(form.premium_paid),
        current_value: form.current_value !== '' ? parseFloat(form.current_value) : null,
        notes: form.notes || null,
        is_open: true,
      }
      const method = editOption ? 'PUT' : 'POST'
      const body = editOption ? { id: editOption.id, ...payload } : payload
      const res = await fetch('/api/options', {
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
        {editOption ? 'Edit Option' : 'Add Option'}
      </h2>

      {/* Call / Put toggle */}
      <div className="flex gap-2">
        {['call', 'put'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => set('option_type', t)}
            className={`flex-1 py-2 rounded-lg text-sm font-mono uppercase tracking-wide transition-colors ${
              form.option_type === t
                ? t === 'call'
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
          <label className="block text-xs text-gray-500 mb-1">Strike Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            placeholder="150.00"
            value={form.strike_price}
            onChange={e => set('strike_price', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Expiration Date</label>
          <input
            type="date"
            className="input-field"
            value={form.expiration_date}
            onChange={e => set('expiration_date', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Contracts</label>
          <input
            type="number"
            min="1"
            step="1"
            className="input-field"
            placeholder="1"
            value={form.contracts}
            onChange={e => set('contracts', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Premium Paid <span className="text-gray-600">(per contract)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            placeholder="2.50"
            value={form.premium_paid}
            onChange={e => set('premium_paid', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Current Value <span className="text-gray-600">(per contract)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            placeholder="3.40"
            value={form.current_value}
            onChange={e => set('current_value', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
        <textarea
          className="input-field resize-none h-16"
          placeholder="e.g. Buying the dip on earnings..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      {error && <p className="text-loss text-xs">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Saving...' : editOption ? 'Update Option' : 'Add Option'}
        </button>
        {editOption && (
          <button type="button" className="btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
