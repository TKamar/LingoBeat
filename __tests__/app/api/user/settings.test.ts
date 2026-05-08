/** @jest-environment node */
import { GET, PATCH } from '@/app/api/user/settings/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn(), update: jest.fn() },
  },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')

describe('GET /api/user/settings', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/user/settings'))).status).toBe(401)
  })

  it('returns user settings', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.user.findUnique.mockResolvedValue({ analysis_provider: 'free' })
    const res = await GET(new NextRequest('http://localhost/api/user/settings'))
    expect(res.status).toBe(200)
    expect((await res.json()).analysis_provider).toBe('free')
  })
})

describe('PATCH /api/user/settings', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify({ analysis_provider: 'free' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await PATCH(req)).status).toBe(401)
  })

  it('returns 400 for invalid provider name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify({ analysis_provider: 'gpt4' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await PATCH(req)).status).toBe(400)
  })

  it('updates analysis_provider and returns updated settings', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.user.update.mockResolvedValue({ analysis_provider: 'free' })
    const req = new NextRequest('http://localhost/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify({ analysis_provider: 'free' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect((await res.json()).analysis_provider).toBe('free')
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { analysis_provider: 'free' },
    })
  })
})
