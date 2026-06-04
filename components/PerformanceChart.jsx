import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import dayjs from 'dayjs'
import { filterByRange, formatCurrency } from '../lib/utils'

const RANGES = ['1W', '1M', '3M', '6M', '1Y', 'All']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const val = payload[0]?.value
    const cost = payload[1]?.value
    return (
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-gray-400 mb-1 font-mono">{label}</p>
        <p className="text-white font-mono font-medium">Value: {formatCurrency(val)}</p>
        {cost && <p className="text-gray-400 font-mono">Cost: {formatCurrency(cost)}</p>}
      </div>
    )
  }
  return null
}

const CashLabel = ({ viewBox, label, amount }) => {
  const { x, y } = viewBox || {}
  return (
    <g>
      <text x={x + 4} y={30} fill="#4f8ef7" fontSize={9} fontFamily="IBM Plex Mono">
        +{formatCurrency(amount, true)}
      </text>
    </g>
  )
}

export default function PerformanceChart({ snapshots, cashFlows = [] }) {
  const [range, setRange] = useState('All')

  const filtered = useMemo(() => filterByRange(snapshots, range), [snapshots, range])

  const data = filtered.map(s => ({
    date: dayjs(s.date).format('MMM D'),
    rawDate: s.date,
    value: parseFloat(s.total_value?.toFixed(2) || 0),
    cost: parseFloat(s.total_cost_basis?.toFixed(2) || 0),
  }))

  // Filter cash flows to visible date range
  const visibleCashFlows = useMemo(() => {
    if (!filtered.length || !cashFlows.length) return []
    const firstDate = filtered[0]?.date
    const lastDate = filtered[filtered.length - 1]?.date
    return cashFlows.filter(cf =>
      cf.amount > 0 &&
      cf.date >= firstDate &&
      cf.date <= lastDate
    )
  }, [filtered, cashFlows])

  const isPositive = data.length >= 2 ? data[data.length - 1]?.value >= data[0]?.value : true
  const strokeColor = isPositive ? '#00d97e' : '#ff4d4d'

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">Performance</h2>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                range === r ? 'bg-accent text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          No data yet — add trades and refresh prices
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#162d5e" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Cash injection markers */}
              {visibleCashFlows.map(cf => {
                const formatted = dayjs(cf.date).format('MMM D')
                return (
                  <ReferenceLine
                    key={cf.id}
                    x={formatted}
                    stroke="#4f8ef7"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={<CashLabel amount={cf.amount} />}
                  />
                )
              })}

              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#colorValue)"
                dot={false}
                activeDot={{ r: 4, fill: strokeColor, stroke: '#060b18', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {visibleCashFlows.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-4 border-t border-dashed border-accent" />
              <span className="text-xs text-gray-500 font-mono">Cash injection</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
