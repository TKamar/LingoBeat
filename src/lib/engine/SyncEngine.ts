// src/lib/engine/SyncEngine.ts
import { LyricWord } from '../types'
import { MediaBridge } from '../adapters/MediaBridge'

export interface SyncState {
  activeWordIndex: number   // -1 = no active word (silence)
  activeLineIndex: number   // -1 = no active line
}

type SyncListener = (state: SyncState) => void

const UNINITIALIZED_WORD_INDEX = -2 // any value binarySearch never returns

export class SyncEngine {
  private rafId: number | null = null
  private lastWordIndex = UNINITIALIZED_WORD_INDEX
  private listeners: Set<SyncListener> = new Set()

  constructor(
    private bridge: MediaBridge,
    private words: LyricWord[],
    private lineForWord: number[],  // parallel array: lineForWord[i] = line index for words[i]
  ) {
    if (lineForWord.length !== words.length) {
      throw new Error(
        `SyncEngine: lineForWord.length (${lineForWord.length}) must equal words.length (${words.length})`
      )
    }
  }

  /**
   * Binary search: find the last word whose start_ms <= currentMs.
   * Returns -1 if before first word or in a silence gap (word ended + 200ms grace).
   */
  static binarySearch(words: LyricWord[], currentMs: number): number {
    let lo = 0, hi = words.length - 1, result = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (words[mid].start_ms <= currentMs) {
        result = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    if (result >= 0 && words[result].end_ms + 200 < currentMs) return -1
    return result
  }

  start() {
    if (this.rafId !== null) return
    const tick = () => {
      const currentMs = this.bridge.getCurrentTime()
      const wordIdx = SyncEngine.binarySearch(this.words, currentMs)
      if (wordIdx !== this.lastWordIndex) {
        this.lastWordIndex = wordIdx
        this.notify({
          activeWordIndex: wordIdx,
          activeLineIndex: wordIdx >= 0 ? this.lineForWord[wordIdx] : -1,
        })
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  subscribe(fn: SyncListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(state: SyncState) {
    for (const fn of [...this.listeners]) fn(state)
  }

  destroy() {
    this.stop()
    this.listeners.clear()
    this.lastWordIndex = UNINITIALIZED_WORD_INDEX
  }
}
