// src/lib/types.ts
// Shared domain types for LingoBeat.
// LyricWord    — atomic token output from LRCParser; consumed by SyncEngine binary search.
// LyricLine    — groups words by line; wordStart/wordEnd are half-open indices into words[].
// ParsedLyrics — contract between LRCParser and all downstream consumers (engine, stores, DB).
// Song         — lightweight metadata DTO; mirrors the Prisma Song model (omits created_at).

export interface LyricWord {
  text: string
  start_ms: number
  end_ms: number
  cefr_level?: string
  romanization?: string
}

export interface LyricLine {
  lineIndex: number   // equals position in ParsedLyrics.lines[]; kept for O(1) reverse lookup
  start_ms: number
  end_ms: number
  wordStart: number   // inclusive index into words[]
  wordEnd: number     // exclusive index into words[]
}

export interface ParsedLyrics {
  words: LyricWord[]
  lines: LyricLine[]
}

export interface Song {
  id: string
  title: string
  artist: string
  language_code: string
  duration_ms: number
  media_type: 'html5' | 'youtube' | 'spotify'
  media_id: string
  lrclib_id?: number
}
