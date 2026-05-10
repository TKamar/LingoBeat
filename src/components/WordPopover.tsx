'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import type { LyricWord } from '@/lib/types'

interface WordAnalysis {
  ipa: string
  meaning: string
  register: string
  slang_notes: string | null
  examples: string[]
  provider: string
  is_partial: boolean
}

interface Props {
  word: LyricWord | null
  languageCode: string
  onClose: () => void
  onSaved: (word: string) => void
}

export function WordPopover({ word, languageCode, onClose, onSaved }: Props) {
  const { data: session } = useSession()
  const [analysis, setAnalysis] = useState<WordAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!word) {
      setAnalysis(null)
      setError(false)
      setSaved(false)
      return
    }
    setLoading(true)
    setAnalysis(null)
    setError(false)
    setSaved(false)

    fetch('/api/vocab/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_code: languageCode, word: word.text }),
    })
      .then(res => {
        if (!res.ok) throw new Error('err')
        return res.json() as Promise<WordAnalysis>
      })
      .then(data => setAnalysis(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [word, languageCode])

  const isOpen = !!word

  if (!word) return null

  async function handleSave() {
    if (!word) return
    await fetch('/api/srs/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_code: languageCode,
        word: word.text,
        meaning: analysis?.meaning,
      }),
    })
    setSaved(true)
    onSaved(word.text)
  }

  return (
    <div role="dialog" aria-modal="true" className="my-2 w-full">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -4 }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
          >
            <div className="bg-slate-800 border border-blue-700 rounded-xl p-4 shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-slate-100">{word.text}</h2>
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-200 text-xl leading-none p-1 ml-2"
                >
                  ×
                </button>
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-24" />
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-full" />
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-3/4" />
                </div>
              )}

              {error && (
                <p className="text-slate-400 text-sm">Analysis unavailable. Try again later.</p>
              )}

              {analysis && !loading && (
                <div className="space-y-2">
                  {analysis.is_partial && (
                    <div className="text-xs text-amber-400 bg-amber-950 rounded-lg px-3 py-2">
                      Limited analysis — switch to Pro for full details.
                    </div>
                  )}
                  <p className="text-blue-400 font-mono text-sm">{analysis.ipa}</p>
                  <p className="text-slate-200 text-sm">{analysis.meaning}</p>
                  {analysis.slang_notes && (
                    <p className="text-amber-400 text-xs italic">{analysis.slang_notes}</p>
                  )}
                  <p className="text-slate-500 text-xs">{analysis.register}</p>
                  {analysis.examples.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {analysis.examples.map((ex, i) => (
                        <p key={i} className="text-slate-400 text-xs">{ex}</p>
                      ))}
                    </div>
                  )}
                  {session?.user && (
                    <button
                      onClick={handleSave}
                      disabled={saved}
                      className="mt-2 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-xs font-medium transition-colors"
                    >
                      {saved ? '✓ Saved to deck' : 'Save to deck'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
