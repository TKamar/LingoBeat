/** @jest-environment node */
import { POST } from '@/app/api/vocab/analyze/route'
import { NextRequest } from 'next/server'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn() },
    vocabCache: { findUnique: jest.fn(), create: jest.fn() },
  },
}))

const mockAuth = require('@/auth').auth
const { db } = require('@/lib/db')
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockAnalysis = {
  ipa: '/di.mwa/',
  meaning: 'tell me (imperative)',
  register: 'informal',
  slang_notes: null,
  examples: ['Dis-moi tout. (Tell me everything.)'],
  provider: 'haiku',
  is_partial: false,
}

describe('POST /api/vocab/analyze', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when language_code is missing', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/vocab/analyze', {
      method: 'POST',
      body: JSON.stringify({ word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(400)
  })

  it('uses system default provider when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    db.vocabCache.findUnique.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockAnalysis })
    db.vocabCache.create.mockResolvedValue({})

    const req = new NextRequest('http://localhost/api/vocab/analyze', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const fetchCall = mockFetch.mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    expect(body.provider).toBe('haiku')
  })

  it('uses user analysis_provider from DB when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.user.findUnique.mockResolvedValue({ analysis_provider: 'free' })
    db.vocabCache.findUnique.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ...mockAnalysis, provider: 'free' }) })
    db.vocabCache.create.mockResolvedValue({})

    const req = new NextRequest('http://localhost/api/vocab/analyze', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)
    const fetchCall = mockFetch.mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    expect(body.provider).toBe('free')
  })

  it('returns cached analysis without calling Python service', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    db.user.findUnique.mockResolvedValue({ analysis_provider: 'haiku' })
    db.vocabCache.findUnique.mockResolvedValue({ analysis: mockAnalysis, is_partial: false })

    const req = new NextRequest('http://localhost/api/vocab/analyze', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 502 when Python service is unreachable', async () => {
    mockAuth.mockResolvedValue(null)
    db.vocabCache.findUnique.mockResolvedValue(null)
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const req = new NextRequest('http://localhost/api/vocab/analyze', {
      method: 'POST',
      body: JSON.stringify({ language_code: 'fr', word: 'dis-moi' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(502)
  })
})
