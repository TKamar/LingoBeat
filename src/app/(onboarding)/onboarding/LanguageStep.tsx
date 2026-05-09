'use client'
import { motion } from 'framer-motion'
import { LANGUAGES, LanguageCode } from '@/lib/languages'

interface Props {
  selected: LanguageCode | null
  onSelect: (code: LanguageCode) => void
}

export function LanguageStep({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3 w-full">
      {LANGUAGES.map((lang, i) => (
        <motion.button
          key={lang.code}
          data-selected={selected === lang.code}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(lang.code)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
            selected === lang.code
              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <span className="text-3xl">{lang.flag}</span>
          <span className="text-sm font-medium text-slate-200">{lang.name}</span>
          {selected === lang.code && (
            <span className="text-blue-400 text-xs">✓</span>
          )}
        </motion.button>
      ))}
    </div>
  )
}
