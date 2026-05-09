/** @jest-environment node */
import { GET, PATCH } from '@/app/api/user/preferences/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    userPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')

describe('GET /api/user/preferences', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/user/preferences'))
    expect(res.status).toBe(401)
  })

  it('returns defaults when no preference exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.userPreference.findUnique.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/user/preferences'))
    const body = await res.json()
    expect(body.target_language).toBe('fr')
    expect(body.daily_goal_xp).toBe(20)
    expect(body.onboarding_done).toBe(false)
  })

  it('returns saved preference when it exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.userPreference.findUnique.mockResolvedValue({
      target_language: 'es',
      daily_goal_xp: 30,
      onboarding_done: true,
    })
    const res = await GET(new NextRequest('http://localhost/api/user/preferences'))
    const body = await res.json()
    expect(body.target_language).toBe('es')
    expect(body.onboarding_done).toBe(true)
  })
})

describe('PATCH /api/user/preferences', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ target_language: 'fr' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('updates preference and returns updated record', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.userPreference.upsert.mockResolvedValue({
      target_language: 'ja',
      daily_goal_xp: 20,
      onboarding_done: false,
    })
    const req = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ target_language: 'ja' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.target_language).toBe('ja')
  })
})
