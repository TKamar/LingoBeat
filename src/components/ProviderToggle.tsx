'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function ProviderToggle() {
  const { data: session } = useSession()
  const [provider, setProvider] = useState<'haiku' | 'free'>('haiku')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/user/settings')
      .then(r => r.json())
      .then(d => setProvider(d.analysis_provider === 'free' ? 'free' : 'haiku'))
      .catch(() => {})
  }, [session])

  if (!session?.user) return null

  async function toggle() {
    const next = provider === 'haiku' ? 'free' : 'haiku'
    setSaving(true)
    await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_provider: next }),
    }).catch(() => {})
    setProvider(next)
    setSaving(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={
        provider === 'haiku'
          ? 'AI analysis (Pro). Click to switch to free.'
          : 'Free analysis. Click to switch to AI (Pro).'
      }
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
    >
      <span
        className={`w-2 h-2 rounded-full ${provider === 'haiku' ? 'bg-blue-400' : 'bg-slate-400'}`}
      />
      {provider === 'haiku' ? 'Pro ✦' : 'Free'}
    </button>
  )
}
