const FLAG: Record<string, string> = {
  fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', ja: '🇯🇵', en: '🇬🇧', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳',
}

interface Props { code: string; wordCount: number; lastReview: string }

export function LanguageCard({ code, wordCount, lastReview }: Props) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
      <span className="text-2xl">{FLAG[code] ?? '🌐'}</span>
      <div>
        <p className="font-semibold text-slate-100 capitalize">{code}</p>
        <p className="text-xs text-slate-400">{wordCount} words · last {lastReview}</p>
      </div>
    </div>
  )
}
