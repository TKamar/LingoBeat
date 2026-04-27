/**
 * @jest-environment node
 */
import { GET } from '@/app/api/lyrics/route'
import { NextRequest } from 'next/server'

global.fetch = jest.fn()

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/lyrics')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

describe('GET /api/lyrics', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when track_name is missing', async () => {
    const req = makeRequest({ artist_name: 'Stromae' })
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when artist_name is missing', async () => {
    const req = makeRequest({ track_name: 'Papaoutai' })
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when LRCLIB returns non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
    const req = makeRequest({ track_name: 'Unknown Song', artist_name: 'Nobody' })
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('returns syncedLyrics from LRCLIB on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncedLyrics: '[00:15.23]Hello world',
        plainLyrics: 'Hello world',
        trackName: 'Papaoutai',
        artistName: 'Stromae',
        duration: 233,
      }),
    })
    const req = makeRequest({ track_name: 'Papaoutai', artist_name: 'Stromae' })
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.syncedLyrics).toBe('[00:15.23]Hello world')
    expect(body.trackName).toBe('Papaoutai')
  })

  it('passes duration param to LRCLIB when provided', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ syncedLyrics: '', plainLyrics: '', trackName: '', artistName: '', duration: 233 }),
    })
    const req = makeRequest({ track_name: 'Papaoutai', artist_name: 'Stromae', duration: '233' })
    await GET(req)
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(calledUrl).toContain('duration=233')
  })
})
