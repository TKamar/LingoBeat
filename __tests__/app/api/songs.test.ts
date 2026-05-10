/** @jest-environment node */
import { GET } from '@/app/api/songs/route'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

jest.mock('@/lib/db', () => ({
  db: { song: { findMany: jest.fn() } },
}))

const SONGS = [
  { id: '1', title: 'Papaoutai', artist: 'Stromae', language_code: 'fr' },
  { id: '2', title: '99 Luftballons', artist: 'Nena', language_code: 'de' },
]

describe('GET /api/songs', () => {
  it('returns all songs with no filter', async () => {
    ;(db.song.findMany as jest.Mock).mockResolvedValue(SONGS)
    const res = await GET(new NextRequest('http://localhost/api/songs'))
    const body = await res.json()
    expect(body.songs).toHaveLength(2)
    expect(body.nextCursor).toBeNull()
  })

  it('filters by language', async () => {
    ;(db.song.findMany as jest.Mock).mockResolvedValue([SONGS[0]])
    const res = await GET(new NextRequest('http://localhost/api/songs?lang=fr'))
    const body = await res.json()
    expect(body.songs).toHaveLength(1)
    expect(body.songs[0].language_code).toBe('fr')
    expect(db.song.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { language_code: 'fr' } })
    )
  })

  it('returns nextCursor when result count equals limit', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, title: 'S', artist: 'A', language_code: 'fr' }))
    ;(db.song.findMany as jest.Mock).mockResolvedValue(many)
    const res = await GET(new NextRequest('http://localhost/api/songs?limit=5'))
    const body = await res.json()
    expect(body.nextCursor).toBe('4')
  })

  it('returns null nextCursor when fewer songs than limit', async () => {
    ;(db.song.findMany as jest.Mock).mockResolvedValue(SONGS) // 2 songs, limit default 20
    const res = await GET(new NextRequest('http://localhost/api/songs'))
    const body = await res.json()
    expect(body.nextCursor).toBeNull()
  })
})
