import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { SRSScheduler, type SrsRating } from '@/lib/engine/SRSScheduler'

const scheduler = new SRSScheduler()
const VALID_RATINGS: SrsRating[] = [1, 2, 3, 4]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { card_id, rating } = body ?? {}
  if (!card_id || !VALID_RATINGS.includes(rating)) {
    return NextResponse.json({ error: 'card_id and rating (1–4) are required' }, { status: 400 })
  }

  const card = await db.srsCard.findUnique({ where: { id: card_id, user_id: session.user.id } })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const currentState = scheduler.fromJSON(card.fsrs_state as Record<string, unknown>)
  const { card: newState, nextReview } = scheduler.schedule(currentState, rating as SrsRating)

  const [updated] = await Promise.all([
    db.srsCard.update({
      where: { id: card_id },
      data: { fsrs_state: newState as object, next_review_at: nextReview },
    }),
    db.reviewLog.create({ data: { card_id, user_id: session.user.id, rating } }),
  ])
  return NextResponse.json(updated)
}
