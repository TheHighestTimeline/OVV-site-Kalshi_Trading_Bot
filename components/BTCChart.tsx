'use client'

import { useEffect, useRef } from 'react'

/**
 * Embeds the TradingView advanced chart for BINANCE:BTCUSDT (15m, dark).
 * Reconstructed from the deployed bundle which injected the TradingView
 * embed script with these exact options.
 */
export default function BTCChart() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BINANCE:BTCUSDT',
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#111318',
      gridColor: 'rgba(37, 44, 58, 0.5)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
    })
    ref.current.appendChild(script)
  }, [])

  return (
    <div className="tradingview-widget-container" style={{ height: 420 }}>
      <div ref={ref} className="tradingview-widget-container__widget" style={{ height: '100%' }} />
    </div>
  )
}
