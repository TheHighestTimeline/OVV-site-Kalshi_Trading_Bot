import { createSign, constants } from 'crypto'

/**
 * Kalshi REST client (Trade API v2) with RSA-PSS request signing.
 *
 * Auth scheme: each request sends
 *   KALSHI-ACCESS-KEY        = <keyId (UUID)>
 *   KALSHI-ACCESS-TIMESTAMP  = <ms epoch>
 *   KALSHI-ACCESS-SIGNATURE  = base64( RSA-PSS-SHA256( timestamp + METHOD + path ) )
 *
 * Reconstructed from the deployed dashboard's call sites:
 *   getPortfolioBalance, getPositions, getSettlements,
 *   getCurrentBtcEvent, getEventMarkets, pickActiveMarket.
 */

const BASE = 'https://api.elections.kalshi.com/trade-api/v2'

function sign(pem: string, timestamp: string, method: string, path: string): string {
  // The signed message is timestamp + METHOD + path (path includes /trade-api/v2…)
  const msg = `${timestamp}${method}${path}`
  const signer = createSign('RSA-SHA256')
  signer.update(msg)
  signer.end()
  return signer.sign(
    {
      key: pem,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
    },
    'base64'
  )
}

async function kalshiFetch(
  keyId: string,
  pem: string,
  method: string,
  endpoint: string
): Promise<any> {
  const ts = Date.now().toString()
  // Kalshi signs the full request path including the API prefix.
  const fullPath = `/trade-api/v2${endpoint}`
  const signature = sign(pem, ts, method, fullPath)

  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      'KALSHI-ACCESS-KEY': keyId,
      'KALSHI-ACCESS-TIMESTAMP': ts,
      'KALSHI-ACCESS-SIGNATURE': signature,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Kalshi ${method} ${endpoint} -> ${res.status} ${text.slice(0, 200)}`)
  }
  return res.json()
}

export interface PortfolioBalance {
  available_balance: number
  portfolio_value: number
}

/** GET /portfolio/balance — returns dollars (Kalshi returns cents). */
export async function getPortfolioBalance(
  keyId: string,
  pem: string
): Promise<PortfolioBalance> {
  const data = await kalshiFetch(keyId, pem, 'GET', '/portfolio/balance')
  const balanceCents = data.balance ?? 0
  // portfolio_value isn't always present; fall back to balance.
  const portfolioCents = data.portfolio_value ?? data.balance ?? 0
  return {
    available_balance: balanceCents / 100,
    portfolio_value: portfolioCents / 100,
  }
}

/** GET /portfolio/positions — open market positions with non-zero exposure. */
export async function getPositions(keyId: string, pem: string): Promise<any[]> {
  const data = await kalshiFetch(
    keyId,
    pem,
    'GET',
    '/portfolio/positions?count_filter=position&settlement_status=unsettled'
  )
  return (data.market_positions ?? []).filter(
    (p: any) => (p.position ?? 0) !== 0
  )
}

/** GET /portfolio/settlements — resolved trades (history). */
export async function getSettlements(keyId: string, pem: string): Promise<any[]> {
  const data = await kalshiFetch(
    keyId,
    pem,
    'GET',
    '/portfolio/settlements?limit=200'
  )
  return data.settlements ?? []
}

/** GET the current hourly BTC event (KXBTCD series). */
export async function getCurrentBtcEvent(keyId: string, pem: string): Promise<any | null> {
  const data = await kalshiFetch(
    keyId,
    pem,
    'GET',
    '/events?series_ticker=KXBTCD&status=open&limit=1'
  )
  return (data.events && data.events[0]) || null
}

/** GET all markets for an event. */
export async function getEventMarkets(
  keyId: string,
  pem: string,
  eventTicker: string
): Promise<any[]> {
  const data = await kalshiFetch(
    keyId,
    pem,
    'GET',
    `/markets?event_ticker=${encodeURIComponent(eventTicker)}&status=open&limit=200`
  )
  return data.markets ?? []
}

/**
 * Pick the most relevant active market from an event's markets — the one with
 * the most balanced (closest to 50/50) pricing and meaningful volume, which is
 * what the scanner treats as the live tradable contract.
 */
export function pickActiveMarket(markets: any[]): any | null {
  const open = (markets ?? []).filter(m => m.status === 'open' && m.close_time)
  if (open.length === 0) return null
  open.sort((a, b) => {
    const aMid = Math.abs((a.yes_bid + a.yes_ask) / 2 - 50)
    const bMid = Math.abs((b.yes_bid + b.yes_ask) / 2 - 50)
    return aMid - bMid
  })
  return open[0]
}
