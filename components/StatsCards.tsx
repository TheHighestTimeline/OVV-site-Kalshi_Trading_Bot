'use client'

interface Props {
  currentBalance: number
  startingBalance: number
  profitPct: string
  winRate: string
  totalTrades: number
  wins: number
  losses: number
  totalPnl: number
  loading: boolean
}

function Stat({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
  loading: boolean
}) {
  return (
    <div className="card">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="h-7 mt-2 w-24 bg-[#1e2330] rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold mt-1" style={{ color: accent || '#ffffff' }}>
          {value}
        </p>
      )}
      {sub && !loading && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

/** Top-row KPI cards: balance, P&L, win rate, trades. */
export default function StatsCards({
  currentBalance,
  startingBalance,
  profitPct,
  winRate,
  totalTrades,
  wins,
  losses,
  totalPnl,
  loading,
}: Props) {
  const pnlAccent = totalPnl >= 0 ? '#00d17a' : '#ff4d6d'
  const pctAccent = Number(profitPct) >= 0 ? '#00d17a' : '#ff4d6d'
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        label="Balance"
        value={`$${Number(currentBalance).toFixed(2)}`}
        sub={`Started at $${startingBalance.toFixed(2)}`}
        loading={loading}
      />
      <Stat
        label="Total P&L"
        value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`}
        sub={`${Number(profitPct) >= 0 ? '+' : ''}${profitPct}%`}
        accent={pnlAccent}
        loading={loading}
      />
      <Stat
        label="Win Rate"
        value={`${winRate}%`}
        sub={`${wins}W / ${losses}L`}
        accent={pctAccent}
        loading={loading}
      />
      <Stat
        label="Total Trades"
        value={`${totalTrades}`}
        sub="Settled"
        loading={loading}
      />
    </div>
  )
}
