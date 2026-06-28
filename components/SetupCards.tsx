'use client'

import { useState } from 'react'

/**
 * Onboarding cards shown before the user has connected credentials, plus the
 * inline KalshiReconnectCard used for quick re-pasting of Kalshi creds.
 *
 * Props/exports reconstructed from the dashboard page:
 *   default SetupCards({ kalshiKeySet, kalshiPemSet, githubConnected,
 *                        onKalshiSaved, onGitHubSaved })
 *   named   KalshiReconnectCard({ onSaved })
 */

interface SetupProps {
  kalshiKeySet: boolean
  kalshiPemSet: boolean
  githubConnected: boolean
  onKalshiSaved: () => void
  onGitHubSaved: () => void
}

async function saveKalshi(apiKey: string, pem: string): Promise<void> {
  const res = await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kalshiApiKey: apiKey, kalshiPrivateKey: pem }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Save failed (HTTP ${res.status})`)
}

function KalshiForm({ onSaved, compact }: { onSaved: () => void; compact?: boolean }) {
  const [apiKey, setApiKey] = useState('')
  const [pem, setPem] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveKalshi(apiKey.trim(), pem.trim())
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-gray-400 text-xs">Kalshi Key ID (UUID)</label>
        <input
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="62d80886-c163-41a2-8ac2-968fc5180841"
          className="w-full mt-1 bg-[#0c0f15] border border-[#252c3a] rounded-lg px-3 py-2 text-sm text-white font-mono"
        />
      </div>
      <div>
        <label className="text-gray-400 text-xs">RSA Private Key (PEM)</label>
        <textarea
          value={pem}
          onChange={e => setPem(e.target.value)}
          rows={compact ? 4 : 6}
          placeholder={'-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'}
          className="w-full mt-1 bg-[#0c0f15] border border-[#252c3a] rounded-lg px-3 py-2 text-xs text-white font-mono"
        />
      </div>
      {error && <p className="text-[#ff4d6d] text-xs font-mono break-words">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
        {saving ? 'Verifying with Kalshi…' : 'Save Kalshi credentials'}
      </button>
    </form>
  )
}

export function KalshiReconnectCard({ onSaved }: { onSaved: () => void }) {
  return (
    <div className="card border-[#4f8ef7]/30 bg-[#4f8ef7]/5">
      <h3 className="font-semibold text-white mb-1">Update Kalshi API Keys</h3>
      <p className="text-gray-400 text-sm mb-3">
        Re-paste your Key ID and private key. They&apos;re verified against Kalshi before saving.
      </p>
      <KalshiForm onSaved={onSaved} compact />
    </div>
  )
}

export default function SetupCards({
  kalshiKeySet,
  kalshiPemSet,
  githubConnected,
  onKalshiSaved,
  onGitHubSaved,
}: SetupProps) {
  const kalshiReady = kalshiKeySet && kalshiPemSet
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">1 · Kalshi Credentials</h3>
          {kalshiReady && <span className="badge-blue">Connected</span>}
        </div>
        {kalshiReady ? (
          <p className="text-gray-400 text-sm">
            Your Kalshi key is saved and verified. Live data is loading above.
          </p>
        ) : (
          <KalshiForm onSaved={onKalshiSaved} />
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">2 · GitHub (to run the bot)</h3>
          {githubConnected && <span className="badge-blue">Connected</span>}
        </div>
        <p className="text-gray-400 text-sm mb-3">
          The bot runs as a GitHub Actions workflow on your fork. Connect GitHub once you&apos;re
          ready to trade automatically.
        </p>
        <a href="/setup" className="btn-secondary w-full justify-center">
          {githubConnected ? 'Manage GitHub connection' : 'Connect GitHub →'}
        </a>
      </div>
    </div>
  )
}
