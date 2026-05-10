'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { useSyncStore } from '@/lib/stores/useSyncStore'
import { useSongStore } from '@/lib/stores/useSongStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { WordToken } from './WordToken'
import { WordPopover } from './WordPopover'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { LyricWord } from '@/lib/types'

interface Props {
  languageCode: string
  onWordTap: (word: LyricWord) => void
  selectedWord: LyricWord | null
  onWordClose: () => void
  onWordSaved: (word: string) => void
}

export function LyricsView({ languageCode, onWordTap, selectedWord, onWordClose, onWordSaved }: Props) {
  const lyricsData = useSongStore(s => s.lyrics)
  const { words, lines } = lyricsData ?? { words: [], lines: [] }
  const activeWordIndex = useSyncStore(s => s.activeWordIndex)
  const activeLineIndex = useSyncStore(s => s.activeLineIndex)
  const handleSeek = useCallback((ms: number) => {
    usePlayerStore.getState().seek(ms)
  }, [])
  const activeLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeLineIndex])

  if (!words.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No lyrics loaded
      </div>
    )
  }

  return (
    <ScrollArea className="h-[60vh] w-full px-4">
      <div className="space-y-4 py-8">
        {lines.map(line => {
          const lineWords = words.slice(line.wordStart, line.wordEnd)
          const lineHasSelected = selectedWord != null &&
            lineWords.some(w => w.start_ms === selectedWord.start_ms)

          const isActiveLine = line.lineIndex === activeLineIndex
          return (
            <React.Fragment key={line.lineIndex}>
              <div
                ref={isActiveLine ? activeLineRef : null}
                data-active-line={isActiveLine}
                className={`flex flex-wrap gap-x-2 gap-y-1 transition-colors duration-200 ${isActiveLine ? 'bg-blue-500/5 rounded-xl px-2' : ''}`}
              >
                {lineWords.map((word, j) => {
                  const wordIdx = line.wordStart + j
                  return (
                    <WordToken
                      key={wordIdx}
                      word={word}
                      index={wordIdx}
                      isActive={wordIdx === activeWordIndex}
                      onSeek={handleSeek}
                      onTap={onWordTap}
                    />
                  )
                })}
              </div>
              {lineHasSelected && (
                <WordPopover
                  word={selectedWord}
                  languageCode={languageCode}
                  onClose={onWordClose}
                  onSaved={onWordSaved}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </ScrollArea>
  )
}
