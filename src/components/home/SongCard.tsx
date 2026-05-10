import Link from 'next/link'

interface Props {
  id: string
  title: string
  artist: string
  language_code: string
}

const FLAG: Record<string, string> = {
  fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', ja: '🇯🇵', en: '🇬🇧', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳',
}

export function SongCard({ id, title, artist, language_code }: Props) {
  return (
    <Link
      href={`/player/${id}`}
      className="flex-shrink-0 w-40 rounded-2xl bg-slate-800 border border-slate-700 p-4 hover:border-slate-500 transition-colors"
    >
      <div className="text-2xl mb-2">{FLAG[language_code] ?? '🎵'}</div>
      <p className="text-sm font-semibold text-slate-100 truncate">{title}</p>
      <p className="text-xs text-slate-400 truncate">{artist}</p>
    </Link>
  )
}
