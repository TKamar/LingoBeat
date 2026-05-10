interface AchievementContext {
  streakDays: number
  totalWords: number
  distinctLanguages: number
  reviewCount: number
}

export function checkAchievements(ctx: AchievementContext): string[] {
  const earned: string[] = []
  if (ctx.reviewCount >= 1 && ctx.totalWords >= 1) earned.push('first_word')
  if (ctx.streakDays >= 7) earned.push('streak_week')
  if (ctx.totalWords >= 100) earned.push('century')
  if (ctx.distinctLanguages >= 2) earned.push('polyglot')
  return earned
}
