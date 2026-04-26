// __tests__/lib/engine/SyncEngine.test.ts
import { SyncEngine } from '@/lib/engine/SyncEngine'
import { LyricWord } from '@/lib/types'
import { MediaBridge, PlayerState } from '@/lib/adapters/MediaBridge'

// Minimal MediaBridge stub
function makeBridge(currentMs: number): MediaBridge {
  return {
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    seek: jest.fn(),
    getCurrentTime: jest.fn(() => currentMs),
    getDuration: jest.fn(() => 300000),
    getState: jest.fn<PlayerState, []>(() => 'playing'),
    on: jest.fn(() => jest.fn()),
    destroy: jest.fn(),
  }
}

const WORDS: LyricWord[] = [
  { text: 'Hello', start_ms: 1000, end_ms: 1500 },
  { text: 'world', start_ms: 1500, end_ms: 2000 },
  { text: 'How',   start_ms: 3000, end_ms: 3400 },
  { text: 'are',   start_ms: 3400, end_ms: 3800 },
  { text: 'you',   start_ms: 3800, end_ms: 4200 },
]

const LINE_FOR_WORD = [0, 0, 1, 1, 1]  // words 0–1 → line 0, words 2–4 → line 1

describe('SyncEngine.binarySearch', () => {
  it('returns -1 when before any word', () => {
    expect(SyncEngine.binarySearch(WORDS, 500)).toBe(-1)
  })

  it('returns correct index mid-first-word', () => {
    expect(SyncEngine.binarySearch(WORDS, 1200)).toBe(0)
  })

  it('returns correct index at exact word boundary', () => {
    expect(SyncEngine.binarySearch(WORDS, 1500)).toBe(1)
  })

  it('returns -1 in silence gap between lines', () => {
    // Gap is 2000ms–3000ms. Word ends at 2000ms + 200ms grace = 2200ms. At 2500ms → silence.
    expect(SyncEngine.binarySearch(WORDS, 2500)).toBe(-1)
  })

  it('returns last word index for the last word', () => {
    expect(SyncEngine.binarySearch(WORDS, 4000)).toBe(4)
  })
})

describe('SyncEngine subscription', () => {
  it('notifies subscriber with activeWordIndex when word changes', async () => {
    const bridge = makeBridge(1200)  // mid "Hello"
    const engine = new SyncEngine(bridge, WORDS, LINE_FOR_WORD)
    const listener = jest.fn()
    engine.subscribe(listener)
    engine.start()

    await new Promise(r => setTimeout(r, 20))  // wait one rAF tick
    engine.stop()

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ activeWordIndex: 0, activeLineIndex: 0 })
    )
  })

  it('unsubscribe stops notifications', async () => {
    const bridge = makeBridge(1200)
    const engine = new SyncEngine(bridge, WORDS, LINE_FOR_WORD)
    const listener = jest.fn()
    const unsub = engine.subscribe(listener)
    unsub()
    engine.start()

    await new Promise(r => setTimeout(r, 20))
    engine.stop()

    expect(listener).not.toHaveBeenCalled()
  })

  it('does not re-notify if word index has not changed', async () => {
    const bridge = makeBridge(1200)
    const engine = new SyncEngine(bridge, WORDS, LINE_FOR_WORD)
    const listener = jest.fn()
    engine.subscribe(listener)
    engine.start()

    await new Promise(r => setTimeout(r, 50))  // several rAF ticks
    engine.stop()

    // getCurrentTime always returns 1200ms (same word index 0), listener called exactly once
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
