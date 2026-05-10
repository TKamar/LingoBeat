'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface ClozeCard {
  card_id: string
  word: string
  lyric_line: string
  choices: string[]
  song_title: string
}

interface Props {
  cards: ClozeCard[]
}

export function ClozeSession({ cards }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [xpTotal, setXpTotal] = useState(0)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const card = cards[index]

  async function handleAnswer(choice: string) {
    if (selected) return
    setSelected(choice)
    const correct = choice === card.word
    const xp = correct ? 5 : 0
    const rating = correct ? 3 : 1

    await fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.card_id, rating }),
    })

    setXpTotal(p => p + xp)

    setTimeout(() => {
      if (index + 1 >= cards.length) {
        setDone(true)
      } else {
        setIndex(i => i + 1)
        setSelected(null)
      }
    }, 1400)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-6 px-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-slate-100">Session complete!</h2>
        <p className="text-slate-400">You earned <span className="text-yellow-400 font-bold">+{xpTotal} XP</span></p>
        <button onClick={() => router.push('/deck')} className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-semibold">Back to Deck</button>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-950 px-6 pt-12 pb-20">
      <div className="w-full max-w-sm mb-8">
        <div className="h-1.5 bg-slate-800 rounded-full">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(index / cards.length) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>{index + 1} / {cards.length}</span>
          <span className="text-yellow-400">⚡ {xpTotal} XP</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.card_id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="w-full max-w-sm"
        >
          <p className="text-slate-400 text-sm mb-2 text-center">{card.song_title}</p>
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 text-center">
            <p className="text-xl text-slate-100 font-medium leading-relaxed">
              {card.lyric_line.split('___').map((part, i) => (
                <span key={i}>
                  {part}
                  {i === 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="inline-block w-16 h-0.5 bg-blue-400 mx-1 mb-1"
                    />
                  )}
                </span>
              ))}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {card.choices.map((choice) => {
              const isCorrect = choice === card.word
              const isSelected = choice === selected
              let bg = 'bg-slate-800 border-slate-700 hover:border-slate-500'
              if (selected) {
                if (isCorrect) bg = 'bg-green-500/20 border-green-500'
                else if (isSelected) bg = 'bg-red-500/20 border-red-500'
                else bg = 'bg-slate-800/40 border-slate-800'
              }
              return (
                <motion.button
                  key={choice}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(choice)}
                  className={`p-4 rounded-2xl border text-slate-100 font-medium transition-all ${bg}`}
                >
                  {choice}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
