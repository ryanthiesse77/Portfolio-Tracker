import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

const sections = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'whats_compelling', label: "What's Compelling", icon: '⚡' },
  { key: 'risks', label: 'Risks', icon: '⚠️' },
  { key: 'catalysts', label: 'Catalysts', icon: '🚀' },
]

export default function ResearchModal({ position, onClose }) {
  const [research, setResearch] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    if (!position) return
    setLoading(true)
    setError(null)
    setResearch(null)

    fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: position.ticker, company_name: position.company_name }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setResearch(data.research)
        setGeneratedAt(data.generated_at)
        setFromCache(data.cached)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [position?.ticker])

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!position) return null

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-navy-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display text-white">{position.company_name}</h2>
              <span className="text-xs bg-navy-800 text-accent font-mono px-2 py-0.5 rounded">
                {position.ticker}
              </span>
            </div>
            {generatedAt && (
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {fromCache ? '📦 Cached · ' : '✨ Fresh · '}
                Generated {dayjs(generatedAt).format('MMM D, YYYY h:mm A')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 -mt-1 -mr-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Generating research...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-loss text-sm">Failed to load research</p>
              <p className="text-gray-500 text-xs mt-1">{error}</p>
            </div>
          )}

          {research && (
            <div className="space-y-4">
              {sections.map(s => (
                <div key={s.key} className="bg-navy-800/60 rounded-xl p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                    {s.icon} {s.label}
                  </p>
                  <p className="text-gray-200 text-sm leading-relaxed">{research[s.key]}</p>
                </div>
              ))}
              <p className="text-xs text-gray-600 text-center pt-2">
                AI-generated research. Not financial advice. Cache refreshes every 14 days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
