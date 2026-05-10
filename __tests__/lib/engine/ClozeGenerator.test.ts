import { generateCloze } from '@/lib/engine/ClozeGenerator'

const WORDS = [
  { word: 'Dis-moi', startMs: 0 },
  { word: 'où', startMs: 500 },
  { word: 'on', startMs: 1000 },
  { word: 'va', startMs: 1500 },
  { word: 'La', startMs: 5000 },
  { word: 'la', startMs: 5500 },
]

const LINES = [
  { startMs: 0, endMs: 4000, text: 'Dis-moi où on va' },
  { startMs: 5000, endMs: 9000, text: 'La la la la' },
]

describe('generateCloze', () => {
  it('creates a cloze card with the target word blanked', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(card.lyric_line).toBe('Dis-moi ___ on va')
  })

  it('includes the correct answer in choices', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(card.choices).toContain('où')
  })

  it('returns exactly 4 choices', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(card.choices).toHaveLength(4)
  })

  it('all choices are distinct', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(new Set(card.choices).size).toBe(4)
  })
})
