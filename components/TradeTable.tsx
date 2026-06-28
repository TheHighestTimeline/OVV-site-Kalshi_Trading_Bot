'use client'

interface Props {
  trades: any[]
  type: 'open' | 'closed'
}

function fmtMoney(cents: number | undefined): string {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Renders open positions or settled trade history.
 * `type="open"` uses Kalshi market_positions rows; `type="closed"` uses
 * settlements rows (with a `revenue` field).
 */
export default function TradeTable({ trades, type }: Props) {
  if (type === 'open') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-[#252c3a]">
              <th className="text-left font-medium py-2">Market</th>
              <th className="text-right font-medium py-2">Position</th>
              <th className="text-right font-medium py-2">Exposure</th>
              <th className="text-right font-medium py-2">Unrealized</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const pnl = t.market_exposure != null && t.realized_pnl != null
                ? t.realized_pnl
                : (t.unrealized_pnl ?? 0)
              const pnlColor = pnl >= 0 ? 'text-[#00d17a]' : 'text-[#ff4d6d]'
              return (
                <tr key={t.ticker ?? i} className="border-b border-[#1a1f29] last:border-0">
                  <td className="py-2.5 font-mono text-gray-300">{t.ticker}</td>
                  <td className="py-2.5 text-right text-gray-300">{t.position}</td>
                  <td className="py-2.5 text-right text-gray-400">{fmtMoney(t.market_exposure)}</td>
                  <td className={`py-2.5 text-right font-medium ${pnlColor}`}>{fmtMoney(pnl)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-[#252c3a]">
            <th className="text-left font-medium py-2">Market</th>
            <th className="text-right font-medium py-2">Result</th>
            <th className="text-right font-medium py-2">Revenue</th>
            <th className="text-right font-medium py-2">Settled</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const rev = t.revenue ?? 0
            const won = rev > 0
            return (
              <tr key={t.ticker ?? i} className="border-b border-[#1a1f29] last:border-0">
                <td className="py-2.5 font-mono text-gray-300">{t.ticker}</td>
                <td className="py-2.5 text-right">
                  <span className={won ? 'text-[#00d17a]' : 'text-[#ff4d6d]'}>
                    {won ? 'WON' : 'LOST'}
                  </span>
                </td>
                <td className={`py-2.5 text-right font-medium ${won ? 'text-[#00d17a]' : 'text-[#ff4d6d]'}`}>
                  {fmtMoney(rev)}
                </td>
                <td className="py-2.5 text-right text-gray-500 text-xs">
                  {t.settled_time ? new Date(t.settled_time).toLocaleDateString() : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
