/** @jest-environment node */
import { GET } from '@/app/api/srs/cloze-cards/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/fetchClozeCards', () => ({
  fetchClozeCards: jest.fn(),
}))

const { auth } = require('@/auth')
const { fetchClozeCards } = require('@/lib/fetchClozeCards')

describe('GET /api/srs/cloze-cards', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    auth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns empty cards when fetchClozeCards returns empty', async () => {
    auth.mockResolvedValue({ user: { id: 'user-1' } })
    fetchClozeCards.mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    const body = await res.json()
    expect(body.cards).toEqual([])
  })

  it('returns cloze cards from fetchClozeCards', async () => {
    auth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockCard = {
      card_id: 'card-1',
      word: 'où',
      lyric_line: 'Dis-moi ___ on va',
      choices: ['où', 'on', 'va', 'dis-moi'],
      song_title: 'Papaoutai',
    }
    fetchClozeCards.mockResolvedValue([mockCard])
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    const res = await GET(req)
    const body = await res.json()
    expect(body.cards).toHaveLength(1)
    expect(body.cards[0].word).toBe('où')
  })

  it('calls fetchClozeCards with the user id', async () => {
    auth.mockResolvedValue({ user: { id: 'user-42' } })
    fetchClozeCards.mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/srs/cloze-cards')
    await GET(req)
    expect(fetchClozeCards).toHaveBeenCalledWith('user-42')
  })
})
