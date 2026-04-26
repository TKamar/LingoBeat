import { create } from 'zustand'
import { Song, ParsedLyrics } from '../types'

interface SongSlice {
  song: Song | null
  lyrics: ParsedLyrics | null
  lineForWord: number[]  // lineForWord[i] = line index for words[i]
  setSong: (song: Song) => void
  setLyrics: (lyrics: ParsedLyrics) => void
}

function buildLineForWord(lyrics: ParsedLyrics): number[] {
  const map: number[] = new Array(lyrics.words.length).fill(-1)
  lyrics.lines.forEach(line => {
    for (let i = line.wordStart; i < line.wordEnd; i++) {
      map[i] = line.lineIndex
    }
  })
  return map
}

export const useSongStore = create<SongSlice>((set) => ({
  song: null,
  lyrics: null,
  lineForWord: [],
  setSong: (song) => set({ song }),
  setLyrics: (lyrics) => set({ lyrics, lineForWord: buildLineForWord(lyrics) }),
}))
