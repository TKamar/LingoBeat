'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Card {
  id: string
  word: string
  meaning: string | null
  context_song: string | null
}

const RATINGS = [
  { label: 'Again', value: 1 as const, className: 'bg-red-800 hover:bg-red-700 text-red-100' },
  { label: 'Hard',  value: 2 as const, className: 'bg-amber-800 hover:bg-amber-700 text-amber-100' },
  { label: 'Good',  value: 3 as const, className: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100' },
  { label: 'Easy',  value: 4 as const, className: 'bg-blue-800 hover:bg-blue-700 text-blue-100' },
]

export function ReviewSession({ initialCards }: { initialCards: Card[] }) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-2xl text-slate-100 font-bold">All done!</p>
        <p className="text-slate-400">No more cards due for review.</p>
        <button
          onClick={() => router.push('/deck')}
          className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
        >
          Back to deck
        </button>
      </div>
    )
  }

  const card = cards[index]

  async function handleRating(rating: 1 | 2 | 3 | 4) {
    setSubmitting(true)
    await fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, rating }),
    })
    setSubmitting(false)
    if (index + 1 >= cards.length) {
      setCards([])
    } else {
      setIndex(i => i + 1)
      setShowAnswer(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-slate-400 text-sm">{index + 1} / {cards.length}</p>

      {/* Card face */}
      <div className="w-full rounded-2xl bg-slate-800 border border-slate-700 p-8">
        {/* Cloze placeholder */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6 border-l-2 border-blue-600">
          {card.context_song && (
            <p className="text-slate-500 text-xs mb-2">♪ Saved from song</p>
          )}
          <p className="text-slate-200 text-lg">
            <span className="bg-blue-900 text-blue-300 px-2 py-0.5 rounded font-bold">___</span>
          </p>
        </div>

        {/* Revealed answer */}
        {showAnswer ? (
          <div className="text-center space-y-2">
            <p className="text-3xl font-bold text-slate-100">{card.word}</p>
            {card.meaning && <p className="text-slate-300 text-sm">{card.meaning}</p>}
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowAnswer(true)}
              className="px-8 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition-colors"
            >
              Show answer
            </button>
          </div>
        )}
      </div>

      {/* Rating buttons — only after answer revealed */}
      {showAnswer && (
        <div className="flex gap-3 flex-wrap justify-center w-full">
          {RATINGS.map(({ label, value, className }) => (
            <button
              key={value}
              onClick={() => handleRating(value)}
              disabled={submitting}
              className={`flex-1 min-w-[80px] py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-40 ${className}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
