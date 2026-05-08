export const VALID_PROVIDERS = ['haiku', 'sonnet', 'free'] as const
export type ProviderName = typeof VALID_PROVIDERS[number]
