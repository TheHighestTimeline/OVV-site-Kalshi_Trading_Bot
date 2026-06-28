import { NextResponse } from 'next/server'

/**
 * Minimal same-origin CSRF guard for state-changing POST routes.
 *
 * Returns a NextResponse (403) when the request's Origin/Referer does not
 * match the host, or `null` when the request is allowed to proceed.
 *
 * Reconstructed from call sites: `const csrf = checkCsrf(request); if (csrf) return csrf`.
 */
export function checkCsrf(request: Request): NextResponse | null {
  const method = request.method.toUpperCase()
  // Only guard mutating methods.
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null

  const host = request.headers.get('host')
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Allow requests from the same host. If neither origin nor referer is
  // present (e.g. server-to-server), allow — Clerk auth still gates the route.
  const source = origin || referer
  if (!source || !host) return null

  try {
    const url = new URL(source)
    if (url.host === host) return null
  } catch {
    /* fall through to rejection */
  }

  return NextResponse.json(
    { error: 'CSRF check failed: cross-origin request rejected.' },
    { status: 403 }
  )
}
