'use client'
import { useEffect } from 'react'
import { ParsedLyrics } from '@/lib/types'
import { useSongStore } from '@/lib/stores/useSongStore'
import { LyricsView } from '@/components/LyricsView'
import { PlayerControls } from '@/components/PlayerControls'
import { PlayerEngine } from './PlayerEngine'

interface Props {
  lyrics: ParsedLyrics
  audioSrc: string
}

export function LyricsViewLoader({ lyrics, audioSrc }: Props) {
  const setLyrics = useSongStore(s => s.setLyrics)

  useEffect(() => {
    setLyrics(lyrics)
  }, [lyrics, setLyrics])

  return (
    <>
      <PlayerEngine audioSrc={audioSrc} />
      <div className="flex-1 overflow-hidden">
        <LyricsView />
      </div>
      <PlayerControls />
    </>
  )
}
