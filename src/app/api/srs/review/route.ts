import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { SRSScheduler, type SrsRating } from '@/lib/engine/SRSScheduler'
import { computeStreak } from '@/lib/engine/UserStatsEngine'
import { checkAchievements } from '@/lib/engine/AchievementEngine'

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

  const [updated] = await db.$transaction([
    db.srsCard.update({
      where: { id: card_id, user_id: session.user.id },
      data: { fsrs_state: newState as object, next_review_at: nextReview },
    }),
    db.reviewLog.create({ data: { card_id, user_id: session.user.id, rating } }),
  ])

  // Check and award achievements
  const userId = session.user.id
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - 366)
  const [allLogs, wordCount, langs] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: userId, reviewed_at: { gte: windowStart } },
      select: { reviewed_at: true, rating: true },
    }),
    db.srsCard.count({ where: { user_id: userId } }),
    db.srsCard.findMany({
      where: { user_id: userId },
      select: { language_code: true },
      distinct: ['language_code'],
    }),
  ])
  const earned = checkAchievements({
    streakDays: computeStreak(allLogs),
    totalWords: wordCount,
    distinctLanguages: langs.length,
    reviewCount: allLogs.length,
  })
  for (const achievement of earned) {
    await db.userAchievement.upsert({
      where: { user_id_achievement: { user_id: userId, achievement } },
      update: {},
      create: { user_id: userId, achievement },
    })
  }

  return NextResponse.json(updated)
}
