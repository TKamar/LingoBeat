const XP_MAP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4 }

interface ReviewLogMinimal {
  reviewed_at: Date
  rating: number
}

/** Returns a local YYYY-MM-DD string for the given date (no UTC conversion). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeXP(logs: ReviewLogMinimal[]): number {
  return logs.reduce((sum, r) => sum + (XP_MAP[r.rating] ?? 0), 0)
}

export function computeTodayXP(logs: ReviewLogMinimal[]): number {
  const todayStr = toLocalDateStr(new Date())
  return logs
    .filter(r => toLocalDateStr(new Date(r.reviewed_at)) === todayStr)
    .reduce((sum, r) => sum + (XP_MAP[r.rating] ?? 0), 0)
}

export function computeStreak(logs: ReviewLogMinimal[]): number {
  if (logs.length === 0) return 0

  const uniqueDays = [...new Set(
    logs.map(r => toLocalDateStr(new Date(r.reviewed_at)))
  )].sort().reverse()

  const today = toLocalDateStr(new Date())
  const yesterday = toLocalDateStr(new Date(Date.now() - 86400000))

  // Accept either today or yesterday as a valid streak start (grace period until midnight)
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function computeLevel(xp: number): { level: number; xpToNext: number } {
  // Level thresholds: level n requires n*n*10 cumulative XP
  // Level 1=0, 2=10, 3=40, 4=90, 5=160 ...
  let level = 1
  while (xp >= level * level * 10) level++
  const xpToNext = level * level * 10 - xp
  return { level, xpToNext }
}
