'use client'
import React from 'react'
import type { CefrLevel } from '@/lib/types'
import { LyricWord } from '@/lib/types'
import { cn } from '@/lib/utils'

const CEFR_COLORS: Record<CefrLevel, string> = {
  A1: 'text-slate-400',
  A2: 'text-blue-400',
  B1: 'text-yellow-400',
  B2: 'text-orange-400',
  C1: 'text-red-400',
  C2: 'text-purple-400',
}

interface Props {
  word: LyricWord
  index: number
  isActive: boolean
  onSeek: (ms: number) => void
  onTap: (word: LyricWord) => void
}

export const WordToken = React.memo(function WordToken({ word, index, isActive, onSeek, onTap }: Props) {
  function handleClick() {
    onSeek(word.start_ms)
    onTap(word)
  }
  const cefrColor = word.cefr_level ? (CEFR_COLORS[word.cefr_level] ?? '') : ''
  return (
    <span
      onClick={handleClick}
      className={cn(
        'inline-block px-0.5 rounded cursor-pointer transition-colors duration-75',
        'hover:text-blue-400',
        isActive
          ? 'text-blue-400 bg-blue-500/15 font-medium'
          : cefrColor || 'text-slate-300',
      )}
    >
      {word.text}
    </span>
  )
})
