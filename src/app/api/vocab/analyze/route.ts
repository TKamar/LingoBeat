import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000'
const VALID_PROVIDERS = ['haiku', 'sonnet', 'free'] as const
type ProviderName = typeof VALID_PROVIDERS[number]

async function getUserProvider(userId: string): Promise<ProviderName> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { analysis_provider: true },
  })
  const p = user?.analysis_provider ?? 'haiku'
  return VALID_PROVIDERS.includes(p as ProviderName) ? (p as ProviderName) : 'haiku'
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.language_code || !body?.word) {
    return NextResponse.json({ error: 'language_code and word are required' }, { status: 400 })
  }

  const { language_code, word, context = '' } = body as {
    language_code: string
    word: string
    context?: string
  }

  const session = await auth()
  const provider: ProviderName = session?.user?.id
    ? await getUserProvider(session.user.id)
    : 'haiku'

  const cached = await db.vocabCache.findUnique({
    where: { language_code_word_context_provider: { language_code, word, context, provider } },
  })
  if (cached) return NextResponse.json({
    ...(cached.analysis as Record<string, unknown>),
    is_partial: cached.is_partial,
  })

  let analysis: Record<string, unknown>
  try {
    const upstream = await fetch(`${PYTHON_SERVICE_URL}/analyze-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_code, word, context, provider }),
    })
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Analysis service error' }, { status: 502 })
    }
    analysis = await upstream.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Analysis service unreachable' }, { status: 502 })
  }

  const is_partial = Boolean(analysis.is_partial)
  await db.vocabCache.create({
    data: { language_code, word, context, provider, is_partial, analysis: analysis as object },
  })

  return NextResponse.json(analysis)
}
