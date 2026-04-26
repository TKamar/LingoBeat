// src/lib/engine/LRCParser.ts
import { ParsedLyrics, LyricWord, LyricLine } from '../types'

// Matches [mm:ss.xx] or [mm:ss.xxx] — the lyric timestamp format
const LINE_REGEX = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/

function parseTimestampMs(min: string, sec: string, frac: string): number {
  const m = parseInt(min, 10)
  const s = parseInt(sec, 10)
  // Normalize to milliseconds: 2-digit frac is centiseconds (*10), 3-digit is ms
  const ms = frac.length === 2 ? parseInt(frac, 10) * 10 : parseInt(frac, 10)
  return (m * 60 + s) * 1000 + ms
}

export function parseLRC(lrc: string): ParsedLyrics {
  const rawLines = lrc
    .split('\n')
    .map(l => l.trim())
    .map(l => {
      const m = l.match(LINE_REGEX)
      if (!m) return null
      return {
        start_ms: parseTimestampMs(m[1], m[2], m[3]),
        text: m[4].trim(),
      }
    })
    .filter((l): l is { start_ms: number; text: string } => l !== null && l.text.length > 0)

  const words: LyricWord[] = []
  const lines: LyricLine[] = []

  for (let i = 0; i < rawLines.length; i++) {
    const { start_ms, text } = rawLines[i]
    const end_ms = rawLines[i + 1]?.start_ms ?? start_ms + 5000
    const tokens = text.split(/\s+/).filter(Boolean)
    const wordStart = words.length
    const msPerWord = (end_ms - start_ms) / tokens.length

    tokens.forEach((token, j) => {
      words.push({
        text: token,
        start_ms: Math.round(start_ms + j * msPerWord),
        end_ms: Math.round(start_ms + (j + 1) * msPerWord),
      })
    })

    lines.push({
      lineIndex: i,
      start_ms,
      end_ms,
      wordStart,
      wordEnd: words.length,
    })
  }

  return { words, lines }
}
