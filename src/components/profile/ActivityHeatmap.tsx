interface Props {
  dailyXP: Record<string, number>
}

function getDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

function intensity(xp: number): 'none' | 'low' | 'medium' | 'high' {
  if (xp === 0) return 'none'
  if (xp < 5) return 'low'
  if (xp < 15) return 'medium'
  return 'high'
}

const COLORS = {
  none: 'bg-slate-800',
  low: 'bg-blue-900',
  medium: 'bg-blue-600',
  high: 'bg-blue-400',
}

export function ActivityHeatmap({ dailyXP }: Props) {
  const days = getDays(30)

  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map(day => {
        const xp = dailyXP[day] ?? 0
        const level = intensity(xp)
        return (
          <div
            key={day}
            role="cell"
            data-intensity={level}
            title={`${day}: ${xp} XP`}
            className={`w-6 h-6 rounded-sm ${COLORS[level]} transition-colors`}
          />
        )
      })}
    </div>
  )
}
