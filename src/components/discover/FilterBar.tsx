'use client'
import { LANGUAGES } from '@/lib/languages'

interface Props {
  selectedLang: string | null
  onLangChange: (lang: string | null) => void
}

export function FilterBar({ selectedLang, onLangChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onLangChange(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedLang === null
            ? 'bg-blue-500 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        All
      </button>
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => onLangChange(l.code)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedLang === l.code
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {l.flag} {l.name}
        </button>
      ))}
    </div>
  )
}
