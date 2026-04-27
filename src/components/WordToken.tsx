'use client'
import React from 'react'
import { LyricWord } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  word: LyricWord
  index: number
  isActive: boolean
  onSeek: (ms: number) => void
}

export const WordToken = React.memo(function WordToken({ word, index, isActive, onSeek }: Props) {
  return (
    <span
      onClick={() => onSeek(word.start_ms)}
      className={cn(
        'inline-block px-0.5 rounded cursor-pointer transition-colors duration-75',
        'hover:text-blue-400',
        isActive
          ? 'text-blue-400 bg-blue-500/15 font-medium'
          : 'text-slate-300',
      )}
    >
      {word.text}
    </span>
  )
})
