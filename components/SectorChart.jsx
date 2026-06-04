import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '../lib/utils'

const COLORS = [
  '#4f8ef7', '#00d97e', '#f5a623', '#e83e3e',
  '#a855f7', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#14b8a6', '#8b5cf6', '#64748b',
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0]
    return (
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-white font-medium">{d.name}</p>
        <p className="text-gray-400 font-mono">{formatCurrency(d.value)}</p>
        <p className="text-gray-500 font-mono">{d.payload.pct?.toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

export default function SectorChart({ positions, priceMap }) {
  // Build sector buckets
  const sectorMap = {}
  for (const pos of positions) {
    if (!pos.is_open) continue
    const price = priceMap[pos.ticker]?.close_price || pos.avg_cost_basis
    const value = pos.shares_held * price
    const sector = pos.sector || 'Other'
    sectorMap[sector] = (sectorMap[sector] || 0) + value
  }

  const total = Object.values(sectorMap).reduce((a, b) => a + b, 0)
  const data = Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)), pct: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value)

  if (!data.length) {
    return (
      <div className="stat-card">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">Sector Allocation</h2>
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No positions yet</div>
      </div>
    )
  }

  return (
    <div className="stat-card">
      <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">Sector Allocation</h2>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="w-full md:w-auto space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-300 flex-1 min-w-0 truncate">{d.name}</span>
              <span className="text-gray-500 font-mono">{d.pct.toFixed(1)}%</span>
              <span className="text-gray-400 font-mono">{formatCurrency(d.value, true)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
