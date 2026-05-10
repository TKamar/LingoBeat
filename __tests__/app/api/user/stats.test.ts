/** @jest-environment node */
import { GET } from '@/app/api/user/stats/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    reviewLog: { findMany: jest.fn() },
    srsCard: { count: jest.fn() },
    userPreference: { findUnique: jest.fn() },
  },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')

describe('GET /api/user/stats', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/user/stats'))
    expect(res.status).toBe(401)
  })

  it('returns stats for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.reviewLog.findMany.mockResolvedValue([
      { reviewed_at: new Date(), rating: 3 },
      { reviewed_at: new Date(), rating: 4 },
    ])
    db.srsCard.count.mockResolvedValue(5)
    db.userPreference.findUnique.mockResolvedValue({ daily_goal_xp: 20 })

    const res = await GET(new NextRequest('http://localhost/api/user/stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('streak_days')
    expect(body).toHaveProperty('total_xp')
    expect(body).toHaveProperty('level')
    expect(body).toHaveProperty('total_words', 5)
    expect(body.today_xp).toBe(7) // 3+4
  })

  it('returns default daily_goal_xp of 20 when no preference exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.reviewLog.findMany.mockResolvedValue([])
    db.srsCard.count.mockResolvedValue(0)
    db.userPreference.findUnique.mockResolvedValue(null)

    const res = await GET(new NextRequest('http://localhost/api/user/stats'))
    const body = await res.json()
    expect(body.daily_goal_xp).toBe(20)
  })
})
