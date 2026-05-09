'use client'
import { useEffect, useState } from 'react'
import { ParsedLyrics, LyricWord } from '@/lib/types'
import { useSongStore } from '@/lib/stores/useSongStore'
import { LyricsView } from '@/components/LyricsView'
import { PlayerControls } from '@/components/PlayerControls'
import { ProviderToggle } from '@/components/ProviderToggle'
import { PlayerEngine } from './PlayerEngine'

interface Props {
  lyrics: ParsedLyrics
  audioSrc: string
  languageCode: string
}

export function LyricsViewLoader({ lyrics, audioSrc, languageCode }: Props) {
  const setLyrics = useSongStore(s => s.setLyrics)
  const [selectedWord, setSelectedWord] = useState<LyricWord | null>(null)

  useEffect(() => {
    setLyrics(lyrics)
  }, [lyrics, setLyrics])

  return (
    <>
      <PlayerEngine audioSrc={audioSrc} />
      <div className="px-6 py-2 flex justify-end">
        <ProviderToggle />
      </div>
      <div className="flex-1 overflow-hidden">
        <LyricsView
          languageCode={languageCode}
          onWordTap={setSelectedWord}
          selectedWord={selectedWord}
          onWordClose={() => setSelectedWord(null)}
          onWordSaved={() => setSelectedWord(null)}
        />
      </div>
      <PlayerControls />
    </>
  )
}
