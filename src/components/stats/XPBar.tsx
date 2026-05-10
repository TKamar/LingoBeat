'use client'
import { motion } from 'framer-motion'

interface Props {
  level: number
  xpToNext: number
  progressPct: number
}

export function XPBar({ level, xpToNext, progressPct }: Props) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
        <span className="text-xs font-bold text-blue-400">{level}</span>
      </div>
      <div className="flex-1">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0">{xpToNext} XP</span>
    </div>
  )
}
