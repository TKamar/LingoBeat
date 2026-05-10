import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { computeXP, computeStreak, computeLevelProgress, computeTodayXP } from '@/lib/engine/UserStatsEngine'
import { StreakRing } from '@/components/stats/StreakRing'
import { XPBar } from '@/components/stats/XPBar'
import { SongCard } from '@/components/home/SongCard'
import { PageTransition } from '@/components/PageTransition'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Bonsoir'
  if (h < 12) return 'Bonjour'
  if (h < 17) return 'Bon après-midi'
  return 'Bonsoir'
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - 366)

  const [logs, pref, songs, dueCount] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: session.user.id, reviewed_at: { gte: windowStart } },
      select: { reviewed_at: true, rating: true },
      orderBy: { reviewed_at: 'desc' },
    }),
    db.userPreference.findUnique({
      where: { user_id: session.user.id },
      select: { target_language: true, daily_goal_xp: true, onboarding_done: true },
    }),
    db.song.findMany({
      take: 6,
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true, artist: true, language_code: true },
    }),
    db.srsCard.count({
      where: { user_id: session.user.id, next_review_at: { lte: new Date() } },
    }),
  ])

  if (!pref?.onboarding_done) redirect('/onboarding')

  const totalXP = computeXP(logs)
  const todayXP = computeTodayXP(logs)
  const streak = computeStreak(logs)
  const { level, xpToNext, progressPct } = computeLevelProgress(totalXP)
  const dailyGoal = pref?.daily_goal_xp ?? 20
  const goalPct = Math.min(Math.round((todayXP / dailyGoal) * 100), 100)
  const name = session.user.name?.split(' ')[0] ?? 'there'
  const initials = name[0]?.toUpperCase() ?? '?'

  return (
    <PageTransition>
      <main className="min-h-screen bg-slate-950 pb-20 px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-400 text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-slate-100">{name} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-400">{initials}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-8">
          <StreakRing streak={streak} size={80} />
          <div className="flex-1 flex flex-col gap-3">
            <XPBar level={level} xpToNext={xpToNext} progressPct={progressPct} />
            <div className="text-sm text-slate-400">
              Today: <span className="text-slate-200 font-medium">{todayXP} / {dailyGoal} XP</span>
              <span className="ml-2 text-xs text-slate-600">({goalPct}%)</span>
            </div>
          </div>
        </div>

        {/* Due words CTA */}
        {dueCount > 0 && (
          <Link
            href="/review"
            className="block w-full mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-100">Review due words</p>
                <p className="text-sm text-slate-400">{dueCount} word{dueCount !== 1 ? 's' : ''} ready</p>
              </div>
              <span className="text-blue-400 text-xl">→</span>
            </div>
          </Link>
        )}

        {/* Featured songs */}
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Songs</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
          {songs.map(s => <SongCard key={s.id} {...s} />)}
        </div>
      </main>
    </PageTransition>
  )
}
