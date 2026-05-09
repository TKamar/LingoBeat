import { computeStreak, computeXP, computeLevel, computeTodayXP } from '@/lib/engine/UserStatsEngine'

const day = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(12, 0, 0, 0)
  return d
}

describe('computeXP', () => {
  it('returns 0 for empty log', () => expect(computeXP([])).toBe(0))
  it('sums ratings correctly: Again=1, Hard=2, Good=3, Easy=4', () => {
    const logs = [{ rating: 1 }, { rating: 2 }, { rating: 3 }, { rating: 4 }] as any
    expect(computeXP(logs)).toBe(10)
  })
})

describe('computeStreak', () => {
  it('returns 0 for no reviews', () => expect(computeStreak([])).toBe(0))

  it('returns 1 for reviews only today', () => {
    const logs = [{ reviewed_at: day(0) }] as any
    expect(computeStreak(logs)).toBe(1)
  })

  it('returns 3 for reviews on 3 consecutive days', () => {
    const logs = [
      { reviewed_at: day(0) },
      { reviewed_at: day(1) },
      { reviewed_at: day(2) },
    ] as any
    expect(computeStreak(logs)).toBe(3)
  })

  it('breaks streak if a day is missed', () => {
    const logs = [
      { reviewed_at: day(0) },
      { reviewed_at: day(2) }, // day 1 is missing
    ] as any
    expect(computeStreak(logs)).toBe(1)
  })
})

describe('computeLevel', () => {
  it('level 1 at 0 XP', () => expect(computeLevel(0).level).toBe(1))
  it('level 2 at 10 XP', () => expect(computeLevel(10).level).toBe(2))
  it('level 4 at 90 XP', () => expect(computeLevel(90).level).toBe(4))
})

describe('computeTodayXP', () => {
  it('counts only reviews from today', () => {
    const logs = [
      { reviewed_at: day(0), rating: 3 },
      { reviewed_at: day(1), rating: 4 }, // yesterday — excluded
    ] as any
    expect(computeTodayXP(logs)).toBe(3)
  })
})
