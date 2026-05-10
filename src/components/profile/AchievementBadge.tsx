const ACHIEVEMENTS: Record<string, { emoji: string; label: string }> = {
  first_word:  { emoji: '🎯', label: 'First Word' },
  streak_week: { emoji: '🔥', label: 'Week Streak' },
  century:     { emoji: '💯', label: 'Century' },
  polyglot:    { emoji: '🌍', label: 'Polyglot' },
}

interface Props { achievement: string; unlockedAt: string }

export function AchievementBadge({ achievement, unlockedAt }: Props) {
  const meta = ACHIEVEMENTS[achievement] ?? { emoji: '🏆', label: achievement }
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl border border-slate-700">
      <span className="text-3xl">{meta.emoji}</span>
      <span className="text-xs font-medium text-slate-200">{meta.label}</span>
      <span className="text-[10px] text-slate-500">{unlockedAt}</span>
    </div>
  )
}
