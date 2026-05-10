import { checkAchievements } from '@/lib/engine/AchievementEngine'

describe('checkAchievements', () => {
  const base = { streakDays: 0, totalWords: 0, distinctLanguages: 1, reviewCount: 0 }

  it('returns [] for baseline user (no achievements)', () => {
    expect(checkAchievements(base)).toHaveLength(0)
  })

  it('returns first_word on first review', () => {
    expect(checkAchievements({ ...base, reviewCount: 1, totalWords: 1 })).toContain('first_word')
  })

  it('returns streak_week at 7 day streak', () => {
    expect(checkAchievements({ ...base, streakDays: 7 })).toContain('streak_week')
  })

  it('returns century at 100 words', () => {
    expect(checkAchievements({ ...base, totalWords: 100 })).toContain('century')
  })

  it('returns polyglot at 2+ languages', () => {
    expect(checkAchievements({ ...base, distinctLanguages: 2 })).toContain('polyglot')
  })

  it('can return multiple achievements at once', () => {
    const result = checkAchievements({ streakDays: 7, totalWords: 1, distinctLanguages: 1, reviewCount: 1 })
    expect(result).toContain('first_word')
    expect(result).toContain('streak_week')
  })
})
