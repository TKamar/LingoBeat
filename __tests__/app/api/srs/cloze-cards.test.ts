/** @jest-environment node */
import { GET } from '@/app/api/srs/cloze-cards/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    srsCard: { findMany: jest.fn() },
    lyrics: { findUnique: jest.fn() },
    song: { findUnique: jest.fn() },
  },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')

describe('GET /api/srs/cloze-cards', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns empty cards when no due cards', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.findMany.mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    const body = await res.json()
    expect(body.cards).toEqual([])
  })

  it('returns cloze cards for due SRS cards with context_song', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.findMany.mockResolvedValue([
      { id: 'card-1', word: 'où', context_song: 'song-1', next_review_at: new Date() },
    ])
    db.lyrics.findUnique.mockResolvedValue({
      song_id: 'song-1',
      words: [
        { word: 'Dis-moi', startMs: 0 },
        { word: 'où', startMs: 500 },
        { word: 'on', startMs: 1000 },
        { word: 'va', startMs: 1500 },
      ],
      lines: [{ startMs: 0, endMs: 4000, text: 'Dis-moi où on va' }],
    })
    db.song.findUnique.mockResolvedValue({ title: 'Papaoutai' })
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    const body = await res.json()
    expect(body.cards).toHaveLength(1)
    expect(body.cards[0].word).toBe('où')
    expect(body.cards[0].lyric_line).toBe('Dis-moi ___ on va')
    expect(body.cards[0].choices).toHaveLength(4)
    expect(body.cards[0].choices).toContain('où')
  })

  it('skips cards without context_song', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.findMany.mockResolvedValue([
      { id: 'card-2', word: 'test', context_song: null, next_review_at: new Date() },
    ])
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    const body = await res.json()
    expect(body.cards).toEqual([])
  })
})
