export const LANGUAGES = [
  { code: 'en', name: 'English',  flag: '🇬🇧' },
  { code: 'es', name: 'Spanish',  flag: '🇪🇸' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian',  flag: '🇷🇺' },
  { code: 'fr', name: 'French',   flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic',   flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese',  flag: '🇨🇳' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const
