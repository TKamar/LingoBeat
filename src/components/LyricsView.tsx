'use client'
import { useEffect, useRef } from 'react'
import { useSyncStore } from '@/lib/stores/useSyncStore'
import { useSongStore } from '@/lib/stores/useSongStore'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { WordToken } from './WordToken'
import { ScrollArea } from '@/components/ui/scroll-area'

export function LyricsView() {
  const lyricsData = useSongStore(s => s.lyrics)
  const { words, lines } = lyricsData ?? { words: [], lines: [] }
  const activeWordIndex = useSyncStore(s => s.activeWordIndex)
  const activeLineIndex = useSyncStore(s => s.activeLineIndex)
  const seek = usePlayerStore(s => s.seek)
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
        {lines.map(line => (
          <div
            key={line.lineIndex}
            ref={line.lineIndex === activeLineIndex ? activeLineRef : null}
            className="flex flex-wrap gap-x-2 gap-y-1"
          >
            {words.slice(line.wordStart, line.wordEnd).map((word, j) => {
              const wordIdx = line.wordStart + j
              return (
                <WordToken
                  key={wordIdx}
                  word={word}
                  index={wordIdx}
                  isActive={wordIdx === activeWordIndex}
                  onSeek={seek}
                />
              )
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
