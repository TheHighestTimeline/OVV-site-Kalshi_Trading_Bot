'use client'

import { useState } from 'react'
import { KalshiReconnectCard } from '@/components/SetupCards'

interface Props {
  kalshiKeySet: boolean
  githubConnected: boolean
  githubUsername: string | null
  githubRepo: string | null
  onClose: () => void
  onSaved: () => void
}

/** Full settings modal: Kalshi credential re-entry + GitHub connection info. */
export default function SettingsModal({
  kalshiKeySet,
  githubConnected,
  githubUsername,
  githubRepo,
  onClose,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<'kalshi' | 'github'>('kalshi')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 py-10 overflow-y-auto"
      onClick={onClose}
    >
      <div className="card max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-lg">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex gap-1 border-b border-[#252c3a] mb-4">
          <button
            onClick={() => setTab('kalshi')}
            className={`px-3 py-2 text-sm border-b-2 ${tab === 'kalshi' ? 'border-[#00d17a] text-[#00d17a]' : 'border-transparent text-gray-500'}`}
          >
            Kalshi
          </button>
          <button
            onClick={() => setTab('github')}
            className={`px-3 py-2 text-sm border-b-2 ${tab === 'github' ? 'border-[#00d17a] text-[#00d17a]' : 'border-transparent text-gray-500'}`}
          >
            GitHub
          </button>
        </div>

        {tab === 'kalshi' && (
          <KalshiReconnectCard onSaved={() => { onSaved() }} />
        )}

        {tab === 'github' && (
          <div className="space-y-3">
            {githubConnected ? (
              <div className="card bg-[#0c0f15]">
                <p className="text-sm text-gray-300">
                  Connected as <span className="text-white font-medium">{githubUsername}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Bot repo: <span className="font-mono text-gray-300">{githubRepo}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">GitHub is not connected yet.</p>
            )}
            <a href="/setup" className="btn-secondary w-full justify-center">
              {githubConnected ? 'Reconfigure GitHub' : 'Connect GitHub →'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
