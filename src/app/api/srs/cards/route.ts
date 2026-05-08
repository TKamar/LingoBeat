import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { SRSScheduler } from '@/lib/engine/SRSScheduler'

const scheduler = new SRSScheduler()

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cards = await db.srsCard.findMany({
    where: { user_id: session.user.id, next_review_at: { lte: new Date() } },
    orderBy: { next_review_at: 'asc' },
  })
  return NextResponse.json(cards)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.language_code || !body?.word) {
    return NextResponse.json({ error: 'language_code and word are required' }, { status: 400 })
  }
  if (typeof body.word !== 'string' || typeof body.language_code !== 'string') {
    return NextResponse.json({ error: 'language_code and word must be strings' }, { status: 400 })
  }
  if (body.word.length > 200 || body.language_code.length > 10) {
    return NextResponse.json({ error: 'word or language_code too long' }, { status: 400 })
  }

  const word = (body.word as string).toLowerCase().trim()
  const language_code = (body.language_code as string).toLowerCase().trim()
  const initialState = scheduler.createCard()

  const card = await db.srsCard.upsert({
    where: {
      user_id_language_code_word: {
        user_id: session.user.id,
        language_code,
        word,
      },
    },
    update: {},
    create: {
      user_id: session.user.id,
      language_code,
      word,
      meaning: body.meaning ?? null,
      context_song: body.context_song ?? null,
      fsrs_state: initialState as object,
      next_review_at: initialState.due,
    },
  })
  return NextResponse.json(card, { status: 201 })
}
