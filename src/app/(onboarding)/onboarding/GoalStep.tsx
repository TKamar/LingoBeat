'use client'
import { motion } from 'framer-motion'
import { DAILY_GOAL_OPTIONS } from '@/lib/languages'

interface Props {
  selected: number
  onSelect: (xp: number) => void
}

const GOAL_LABELS: Record<number, string> = {
  10: 'Casual',
  20: 'Regular',
  30: 'Serious',
  50: 'Intense',
}

export function GoalStep({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {DAILY_GOAL_OPTIONS.map((xp, i) => (
        <motion.button
          key={xp}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => onSelect(xp)}
          className={`flex flex-col items-center gap-1 p-5 rounded-2xl border transition-all ${
            selected === xp
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <span className="text-2xl font-bold text-slate-100">{xp} XP</span>
          <span className="text-sm text-slate-400">{GOAL_LABELS[xp]}</span>
        </motion.button>
      ))}
    </div>
  )
}
