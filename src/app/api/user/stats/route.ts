import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { computeXP, computeStreak, computeLevel, computeTodayXP } from '@/lib/engine/UserStatsEngine'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [logs, totalWords, pref] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: session.user.id },
      select: { reviewed_at: true, rating: true },
      orderBy: { reviewed_at: 'desc' },
    }),
    db.srsCard.count({ where: { user_id: session.user.id } }),
    db.userPreference.findUnique({
      where: { user_id: session.user.id },
      select: { daily_goal_xp: true },
    }),
  ])

  const totalXP = computeXP(logs)
  const { level, xpToNext } = computeLevel(totalXP)

  return NextResponse.json({
    streak_days: computeStreak(logs),
    total_xp: totalXP,
    today_xp: computeTodayXP(logs),
    level,
    xp_to_next_level: xpToNext,
    total_words: totalWords,
    daily_goal_xp: pref?.daily_goal_xp ?? 20,
  })
}
