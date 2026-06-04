export default function StatCard({ label, value, subValue, subLabel, positive, negative }) {
  const isGain = positive
  const isLoss = negative

  return (
    <div className="stat-card flex flex-col gap-1">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">{label}</p>
      <p className="text-2xl md:text-3xl font-display text-white leading-tight">{value}</p>
      {subValue && (
        <p className={`text-sm font-mono font-medium ${isGain ? 'text-gain' : isLoss ? 'text-loss' : 'text-gray-400'}`}>
          {subValue}
          {subLabel && <span className="text-gray-500 font-normal ml-1">{subLabel}</span>}
        </p>
      )}
    </div>
  )
}
