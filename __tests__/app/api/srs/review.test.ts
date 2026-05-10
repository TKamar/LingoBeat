/** @jest-environment node */
import { POST } from '@/app/api/srs/review/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    srsCard: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    reviewLog: { create: jest.fn(), findMany: jest.fn() },
    userAchievement: { upsert: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')

describe('POST /api/srs/review', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/srs/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: 'card-1', rating: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(401)
  })

  it('returns 400 for invalid rating (5)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/srs/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: 'card-1', rating: 5 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(400)
  })

  it('returns 404 when card not found or not owned by user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.findUnique.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/srs/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: 'card-999', rating: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(404)
  })

  it('updates FSRS state and logs the review', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.srsCard.findUnique.mockResolvedValue({ id: 'card-1', user_id: 'user-1', fsrs_state: {} })
    const mockUpdated = { id: 'card-1' }
    db.$transaction.mockResolvedValue([mockUpdated, {}])
    db.reviewLog.findMany.mockResolvedValue([])
    db.srsCard.count.mockResolvedValue(0)
    db.srsCard.findMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/srs/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: 'card-1', rating: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when card_id is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/srs/review', {
      method: 'POST',
      body: JSON.stringify({ rating: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(400)
  })
})
