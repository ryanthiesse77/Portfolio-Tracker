import { useState, useEffect } from 'react'
import Head from 'next/head'
import StatCard from '../components/StatCard'
import PerformanceChart from '../components/PerformanceChart'
import SectorChart from '../components/SectorChart'
import PositionsTable from '../components/PositionsTable'
import OptionsTable from '../components/OptionsTable'
import ResearchModal from '../components/ResearchModal'
import { formatCurrency, formatPct, pctChange } from '../lib/utils'

export default function Portfolio() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState(null)

  useEffect(() => {
    fetch('/api/portfolio')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const positions = data?.positions || []
  const priceMap = data?.priceMap || {}
  const snapshots = data?.snapshots || []
  const cashFlows = data?.cashFlows || []
  const options = data?.options || []

  const openPositions = positions.filter(p => p.is_open)

  // Current market value of all open stock positions
  let investedValue = 0
  let totalCostBasis = 0
  for (const pos of openPositions) {
    const price = priceMap[pos.ticker]?.close_price || pos.avg_cost_basis
    investedValue += pos.shares_held * price
    totalCostBasis += pos.shares_held * pos.avg_cost_basis
  }

  // Add open options current value
  for (const opt of options.filter(o => o.is_open)) {
    if (opt.current_value != null) {
      investedValue += opt.current_value * opt.contracts * 100
      totalCostBasis += opt.premium_paid * opt.contracts * 100
    }
  }

  // Total cash deposited
  const totalDeposited = cashFlows.reduce((sum, c) => sum + parseFloat(c.amount), 0)

  // Uninvested cash = what you deposited minus what you've actually put into positions
  const amountInvested = totalCostBasis
  const uninvestedCash = Math.max(0, totalDeposited - amountInvested)

  // Total portfolio value = current market value of positions + uninvested cash
  const totalValue = investedValue + uninvestedCash

  // Unrealized return = gain/loss on invested positions only
  const unrealizedReturn = investedValue - totalCostBasis
  const unrealizedReturnPct = pctChange(investedValue, totalCostBasis)

  // Return on cash = how much the total portfolio has grown vs what was deposited
  const returnOnCash = totalDeposited > 0 ? ((totalValue - totalDeposited) / totalDeposited) * 100 : null

  return (
    <>
      <Head>
        <title>Portfolio · Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-navy-950">
        <header className="border-b border-navy-800 px-4 py-4 md:px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display text-white">Portfolio</h1>
              <p className="text-xs text-gray-500 font-mono">Live Tracker</p>
            </div>
            <a href="/admin" className="text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono">
              Admin ↗
            </a>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 md:px-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Value"
                  value={formatCurrency(totalValue)}
                  subValue={`${formatCurrency(uninvestedCash)} cash`}
                />
                <StatCard
                  label="Unrealized Return"
                  value={formatCurrency(unrealizedReturn)}
                  subValue={formatPct(unrealizedReturnPct)}
                  positive={unrealizedReturn >= 0}
                  negative={unrealizedReturn < 0}
                />
                <StatCard
                  label="Total Deposited"
                  value={formatCurrency(totalDeposited)}
                  subValue={`${formatCurrency(amountInvested)} invested`}
                />
                {returnOnCash !== null && (
                  <StatCard
                    label="Return on Cash"
                    value={formatPct(returnOnCash)}
                    subValue={formatCurrency(totalValue - totalDeposited)}
                    positive={returnOnCash >= 0}
                    negative={returnOnCash < 0}
                  />
                )}
              </div>

              <PerformanceChart snapshots={snapshots} cashFlows={cashFlows} />
              <SectorChart positions={positions} priceMap={priceMap} />
              <PositionsTable positions={positions} priceMap={priceMap} onResearch={setSelectedPosition} closed={false} />
              <PositionsTable positions={positions} priceMap={priceMap} closed={true} />

              {options.length > 0 && (
                <div>
                  <h2 className="text-base font-display text-white mb-3 px-1">Options</h2>
                  <OptionsTable options={options} isAdmin={false} />
                </div>
              )}
            </>
          )}
        </main>

        <footer className="text-center py-8 text-xs text-gray-700 font-mono">
          Prices update daily at 4:30 PM ET · Not financial advice
        </footer>
      </div>

      {selectedPosition && (
        <ResearchModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />
      )}
    </>
  )
}
