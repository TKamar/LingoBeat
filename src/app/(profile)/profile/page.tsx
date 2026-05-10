import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { computeXP, computeStreak, computeLevel } from '@/lib/engine/UserStatsEngine'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'
import { LanguageCard } from '@/components/profile/LanguageCard'
import { AchievementBadge } from '@/components/profile/AchievementBadge'
import { PageTransition } from '@/components/PageTransition'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [logs, achievements, cards] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: userId },
      select: { reviewed_at: true, rating: true },
      orderBy: { reviewed_at: 'asc' },
    }),
    db.userAchievement.findMany({
      where: { user_id: userId },
      orderBy: { unlocked_at: 'asc' },
    }),
    db.srsCard.findMany({
      where: { user_id: userId },
      select: { language_code: true, created_at: true },
    }),
  ])

  const totalXP = computeXP(logs)
  const streak = computeStreak(logs)
  const { level } = computeLevel(totalXP)

  // Build daily XP map using local date strings
  const dailyXP: Record<string, number> = {}
  for (const log of logs) {
    const d = new Date(log.reviewed_at)
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dailyXP[day] = (dailyXP[day] ?? 0) + (log.rating ?? 0)
  }

  // Language breakdown
  const langMap = new Map<string, { count: number; last: Date }>()
  for (const card of cards) {
    const entry = langMap.get(card.language_code) ?? { count: 0, last: new Date(0) }
    entry.count++
    if (card.created_at > entry.last) entry.last = card.created_at
    langMap.set(card.language_code, entry)
  }

  const name = session.user.name ?? 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <PageTransition>
      <main className="min-h-screen bg-slate-950 pb-20 px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-400">{initials}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{name}</h1>
            <p className="text-sm text-slate-400">Level {level} · {streak} day streak</p>
          </div>
        </div>

        {/* Activity heatmap */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">30-Day Activity</h2>
        <ActivityHeatmap dailyXP={dailyXP} />

        {/* Languages */}
        {langMap.size > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-8">Languages</h2>
            <div className="flex flex-col gap-2">
              {[...langMap.entries()].map(([code, { count, last }]) => (
                <LanguageCard
                  key={code}
                  code={code}
                  wordCount={count}
                  lastReview={last.toLocaleDateString()}
                />
              ))}
            </div>
          </>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-8">Achievements</h2>
            <div className="grid grid-cols-4 gap-3">
              {achievements.map(a => (
                <AchievementBadge
                  key={a.id}
                  achievement={a.achievement}
                  unlockedAt={a.unlocked_at.toLocaleDateString()}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </PageTransition>
  )
}
