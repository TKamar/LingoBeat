// __tests__/lib/engine/LRCParser.test.ts
import { parseLRC } from '@/lib/engine/LRCParser'

describe('parseLRC', () => {
  describe('timestamp parsing', () => {
    it('converts [mm:ss.xx] to milliseconds', () => {
      const result = parseLRC('[00:15.23]Hello\n[00:20.00]World')
      expect(result.words[0].start_ms).toBe(15230)
    })

    it('handles three-digit centiseconds', () => {
      const result = parseLRC('[00:15.230]Hello\n[00:20.000]World')
      expect(result.words[0].start_ms).toBe(15230)
    })

    it('handles minutes correctly', () => {
      const result = parseLRC('[02:05.10]Hello\n[02:10.00]World')
      expect(result.words[0].start_ms).toBe(125100)
    })
  })

  describe('word tokenization', () => {
    it('splits a line into individual word tokens', () => {
      const result = parseLRC('[00:15.00]Hello world\n[00:20.00]Done')
      expect(result.words).toHaveLength(3)
      expect(result.words[0].text).toBe('Hello')
      expect(result.words[1].text).toBe('world')
    })

    it('trims extra whitespace between words', () => {
      const result = parseLRC('[00:15.00]Hello   world\n[00:20.00]Done')
      expect(result.words[0].text).toBe('Hello')
      expect(result.words[1].text).toBe('world')
    })

    it('ignores completely empty lines', () => {
      const result = parseLRC('[00:15.00]Hello\n[00:17.00]\n[00:20.00]World')
      expect(result.words).toHaveLength(2)
    })
  })

  describe('timestamp interpolation', () => {
    it('interpolates word start_ms proportionally within line duration', () => {
      // Line: 15000ms → 20000ms (5000ms), 2 words → 2500ms each
      const result = parseLRC('[00:15.00]Hello world\n[00:20.00]Done')
      expect(result.words[0].start_ms).toBe(15000)
      expect(result.words[0].end_ms).toBe(17500)
      expect(result.words[1].start_ms).toBe(17500)
      expect(result.words[1].end_ms).toBe(20000)
    })

    it('uses 5000ms fallback duration for the last line', () => {
      const result = parseLRC('[00:15.00]Hello world')
      expect(result.words[1].end_ms).toBe(20000)
    })
  })

  describe('line index', () => {
    it('tracks wordStart and wordEnd per line', () => {
      const result = parseLRC('[00:10.00]One two\n[00:15.00]Three four five\n[00:22.00]End')
      expect(result.lines[0]).toMatchObject({ lineIndex: 0, wordStart: 0, wordEnd: 2 })
      expect(result.lines[1]).toMatchObject({ lineIndex: 1, wordStart: 2, wordEnd: 5 })
    })

    it('sets line start_ms and end_ms correctly', () => {
      const result = parseLRC('[00:10.00]One\n[00:15.00]Two\n[00:20.00]Three')
      expect(result.lines[0].start_ms).toBe(10000)
      expect(result.lines[0].end_ms).toBe(15000)
      expect(result.lines[1].end_ms).toBe(20000)
    })
  })

  describe('metadata filtering', () => {
    it('ignores LRC metadata tags like [ti:] [ar:] [al:]', () => {
      const lrc = '[ti:Song Title]\n[ar:Artist]\n[al:Album]\n[00:15.00]Hello\n[00:20.00]World'
      const result = parseLRC(lrc)
      expect(result.words).toHaveLength(2)
    })
  })
})
