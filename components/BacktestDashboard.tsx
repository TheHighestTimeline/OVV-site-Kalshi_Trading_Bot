'use client'

import { useEffect, useState } from 'react'

/**
 * Backtest tab. Reads the bot's committed state file via /api/bot/state
 * (dashboard/btc_paper_state.json) and shows paper-trading performance.
 *
 * The original deployed component rendered the bot's backtest/paper results;
 * this reconstruction surfaces the same state file the route exposes. Refine
 * the visualization to taste once live data is flowing.
 */
export default function BacktestDashboard() {
  const [state, setState] = useState<any>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/bot/state')
        const data = await res.json()
        setState(data.state)
        setReason(data.reason ?? null)
      } catch {
        setReason('fetch-failed')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="card h-32 flex items-center justify-center text-gray-500 text-sm animate-pulse">
        Loading backtest / paper state…
      </div>
    )
  }

  if (!state) {
    const msg =
      reason === 'github-not-connected'
        ? 'Connect GitHub to read the bot’s committed state file.'
        : reason === 'no-state-yet'
        ? 'No state yet — run the bot at least once and it will commit results here.'
        : 'No backtest data available.'
    return (
      <div className="card">
        <h3 className="font-semibold text-white mb-1">Backtest / Paper Results</h3>
        <p className="text-gray-400 text-sm">{msg}</p>
      </div>
    )
  }

  const trades: any[] = state.trades ?? state.paperTrades ?? []
  const bankroll = state.bankroll ?? state.balance ?? null
  const wins = trades.filter(t => (t.pnl ?? 0) > 0).length
  const losses = trades.filter(t => (t.pnl ?? 0) <= 0).length
  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-500 text-xs uppercase">Bankroll</p>
          <p className="text-2xl font-bold mt-1">{bankroll != null ? `$${Number(bankroll).toFixed(2)}` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-xs uppercase">Net P&L</p>
          <p className={`text-2xl font-bold mt-1 ${totalPnl >= 0 ? 'text-[#00d17a]' : 'text-[#ff4d6d]'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-xs uppercase">Trades</p>
          <p className="text-2xl font-bold mt-1">{trades.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-xs uppercase">Win Rate</p>
          <p className="text-2xl font-bold mt-1">
            {trades.length ? ((wins / trades.length) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-white mb-3">
          Paper Trades <span className="badge-yellow ml-2">{trades.length}</span>
        </h3>
        {trades.length === 0 ? (
          <p className="text-gray-500 text-sm">No trades recorded in the state file yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-[#252c3a]">
                  <th className="text-left py-2 font-medium">Ticker</th>
                  <th className="text-left py-2 font-medium">Side</th>
                  <th className="text-right py-2 font-medium">Cost</th>
                  <th className="text-right py-2 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(-50).reverse().map((t, i) => (
                  <tr key={t.ticker ? `${t.ticker}-${i}` : i} className="border-b border-[#1a1f29] last:border-0">
                    <td className="py-2 font-mono text-gray-300">{t.ticker}</td>
                    <td className="py-2 text-gray-400">{t.side}</td>
                    <td className="py-2 text-right text-gray-400">${(t.cost ?? 0).toFixed?.(2) ?? t.cost}</td>
                    <td className={`py-2 text-right font-medium ${(t.pnl ?? 0) >= 0 ? 'text-[#00d17a]' : 'text-[#ff4d6d]'}`}>
                      {(t.pnl ?? 0) >= 0 ? '+' : ''}{(t.pnl ?? 0).toFixed?.(2) ?? t.pnl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
