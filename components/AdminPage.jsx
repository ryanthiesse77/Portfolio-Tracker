import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import TradeForm from './TradeForm'
import TradeHistory from './TradeHistory'
import CashFlowForm from './CashFlowForm'
import OptionsForm from './OptionsForm'
import OptionsTable from './OptionsTable'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [trades, setTrades] = useState([])
  const [cashFlows, setCashFlows] = useState([])
  const [options, setOptions] = useState([])
  const [editTrade, setEditTrade] = useState(null)
  const [editOption, setEditOption] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setUser(session.user)
        setAuthLoading(false)
      }
    })
  }, [])

  async function loadTrades() {
    const res = await fetch('/api/trades')
    setTrades((await res.json()) || [])
  }

  async function loadCashFlows() {
    const res = await fetch('/api/cash-flows')
    setCashFlows((await res.json()) || [])
  }

  async function loadOptions() {
    const res = await fetch('/api/options')
    setOptions((await res.json()) || [])
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadTrades()
      loadCashFlows()
      loadOptions()
    }
  }, [authLoading, user])

  async function handleRefreshPrices() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const res = await fetch('/api/update-prices', { method: 'POST' })
      const data = await res.json()
      setRefreshMsg(data.error || `Updated ${data.updated?.length || 0} tickers`)
    } catch (e) {
      setRefreshMsg('Error: ' + e.message)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function copyShareLink() {
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      <Head><title>Admin · Portfolio</title></Head>
      <div className="min-h-screen bg-navy-950">
        <header className="border-b border-navy-800 px-4 py-4 md:px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display text-white">Admin</h1>
              <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
            </div>
            <div className="flex gap-3 items-center">
              <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors font-mono">← Public View</a>
              <button onClick={handleSignOut} className="text-xs text-gray-600 hover:text-loss transition-colors font-mono">Sign Out</button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 md:px-6 space-y-5">

          {/* Admin Tools */}
          <div className="stat-card space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">Admin Tools</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={handleRefreshPrices} disabled={refreshing} className="btn-primary">
                {refreshing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    Refreshing...
                  </span>
                ) : '↻ Refresh Prices Now'}
              </button>
              {refreshMsg && <span className="text-xs text-gray-400 font-mono">{refreshMsg}</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Share Link (public, read-only)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-navy-800 rounded-lg px-3 py-2 text-xs text-accent font-mono truncate">{shareUrl}</code>
                <button onClick={copyShareLink} className="btn-ghost text-xs whitespace-nowrap">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Cash Flows */}
          <CashFlowForm cashFlows={cashFlows} onSaved={loadCashFlows} />

          {/* Stock Trades */}
          <TradeForm onSaved={loadTrades} editTrade={editTrade} onCancelEdit={() => setEditTrade(null)} />
          <TradeHistory
            trades={trades}
            onEdit={t => { setEditTrade(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onRefresh={loadTrades}
          />

          {/* Options */}
          <OptionsForm
            onSaved={loadOptions}
            editOption={editOption}
            onCancelEdit={() => setEditOption(null)}
          />
          <OptionsTable
            options={options}
            isAdmin={true}
            onEdit={o => { setEditOption(o); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onRefresh={loadOptions}
          />

        </main>
      </div>
    </>
  )
}
