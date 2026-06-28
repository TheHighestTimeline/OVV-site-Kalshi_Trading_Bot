'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Live multi-timeframe confluence snapshot. Polls /api/scanner (which returns
 * btcPrice, rsi1m/5m, per-TF signals, confluence, and the active contract).
 * Response shape reconstructed from app/api/scanner/route.ts.
 */

type Dir = 'UP' | 'DOWN' | null

interface Scan {
  ts: string
  btcPrice: number | null
  rsi1m: number | null
  rsi5m: number | null
  signals: Record<string, Dir>
  confluenceDir: Dir
  confluenceScore: number
  totalTFs: number
  contract: any | null
}

const TFS = ['1m', '3m', '5m', '15m', '30m', '1h', '4h']

function dirColor(d: Dir): string {
  if (d === 'UP') return 'text-[#00d17a] bg-[#00d17a]/10'
  if (d === 'DOWN') return 'text-[#ff4d6d] bg-[#ff4d6d]/10'
  return 'text-gray-600 bg-[#1e2330]'
}

export default function ScanSnapshot() {
  const [scan, setScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchScan = useCallback(async () => {
    try {
      const res = await fetch('/api/scanner')
      if (res.ok) setScan(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScan()
    const id = setInterval(fetchScan, 30_000)
    return () => clearInterval(id)
  }, [fetchScan])

  if (loading && !scan) {
    return (
      <div className="card h-24 flex items-center justify-center text-gray-500 text-sm animate-pulse">
        Loading market scan…
      </div>
    )
  }
  if (!scan) return null

  const c = scan.contract
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">
          Market Scanner
          {scan.confluenceDir && (
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-mono ${dirColor(scan.confluenceDir)}`}>
              {scan.confluenceDir} {scan.confluenceScore}/{scan.totalTFs}
            </span>
          )}
        </h3>
        <span className="text-gray-500 text-xs">
          {scan.btcPrice != null ? `$${scan.btcPrice.toLocaleString()}` : '—'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {TFS.map(tf => (
          <div key={tf} className={`px-2 py-1 rounded text-xs font-mono ${dirColor(scan.signals[tf])}`}>
            {tf} {scan.signals[tf] === 'UP' ? '↑' : scan.signals[tf] === 'DOWN' ? '↓' : '·'}
          </div>
        ))}
        <div className="px-2 py-1 rounded text-xs font-mono text-gray-400 bg-[#1e2330]">
          RSI 1m {scan.rsi1m ?? '—'} / 5m {scan.rsi5m ?? '—'}
        </div>
      </div>

      {c && (
        <div className="bg-[#0c0f15] border border-[#252c3a] rounded-lg p-3 text-xs font-mono text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Contract</span>
            <span className="text-gray-300">{c.ticker}</span>
          </div>
          <div className="flex justify-between">
            <span>Strike / Dist</span>
            <span className="text-gray-300">{c.strike} / {c.dist}</span>
          </div>
          <div className="flex justify-between">
            <span>Yes / No mid</span>
            <span className="text-gray-300">{c.yesMid} / {c.noMid}</span>
          </div>
          <div className="flex justify-between">
            <span>Window (in / left)</span>
            <span className="text-gray-300">{c.minutesIn}m / {c.minutesLeft}m</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Mode 4 status</span>
            <span
              className={
                c.mode4Status === 'green' ? 'text-[#00d17a]'
                : c.mode4Status === 'yellow' ? 'text-[#f5c842]'
                : 'text-gray-600'
              }
            >
              ● {c.mode4Status}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
