/** @jest-environment node */
import { GET, POST } from '@/app/api/srs/cards/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: { srsCard: { findMany: jest.fn(), upsert: jest.fn() } },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')

describe('GET /api/srs/cards', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/srs/cards'))).status).toBe(401)
  })

  it('returns cards due for review scoped to the user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.findMany.mockResolvedValue([
      { id: 'card-1', word: 'dis-moi', meaning: 'tell me', language_code: 'fr' },
    ])
    const res = await GET(new NextRequest('http://localhost/api/srs/cards'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].word).toBe('dis-moi')
    expect(db.srsCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ user_id: 'user-1' }) })
    )
  })
})

describe('POST /api/srs/cards', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/srs/cards', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(401)
  })

  it('returns 400 when language_code missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/srs/cards', {
      method: 'POST',
      body: JSON.stringify({ word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(400)
  })

  it('saves card via upsert and returns 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.upsert.mockResolvedValue({ id: 'card-1', word: 'dis-moi', language_code: 'fr' })
    const req = new NextRequest('http://localhost/api/srs/cards', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'dis-moi', meaning: 'tell me' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect((await res.json()).word).toBe('dis-moi')
  })

  it('returns 400 when word is a non-string type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/srs/cards', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 42 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(400)
  })

  it('normalises word to lowercase before saving', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.upsert.mockResolvedValue({ id: 'card-1', word: 'dis-moi', language_code: 'fr' })
    const req = new NextRequest('http://localhost/api/srs/cards', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'Dis-Moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)
    const upsertCall = db.srsCard.upsert.mock.calls[0][0]
    expect(upsertCall.where.user_id_language_code_word.word).toBe('dis-moi')
  })
})
