'use client'
import { motion } from 'framer-motion'

interface Props {
  streak: number
  size?: number
}

export function StreakRing({ streak, size = 80 }: Props) {
  const r = (size / 2) * 0.75
  const circumference = 2 * Math.PI * r
  const maxStreak = Math.max(streak, 7)
  const fillRatio = Math.min(streak / maxStreak, 1)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="#f97316"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - fillRatio) }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-100">{streak}</span>
          <span className="text-[9px] text-slate-400">days</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-1">🔥 streak</span>
    </div>
  )
}
