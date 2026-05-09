import { create } from 'zustand'

interface SrsCard {
  id: string
  word: string
  meaning: string | null
  language_code: string
  next_review_at: string
}

interface SRSStore {
  cards: SrsCard[]
  dueCount: number
  loading: boolean
  setCards: (cards: SrsCard[]) => void
  setLoading: (loading: boolean) => void
}

export const useSRSStore = create<SRSStore>((set) => ({
  cards: [],
  dueCount: 0,
  loading: false,
  setCards: (cards) => set({ cards, dueCount: cards.length }),
  setLoading: (loading) => set({ loading }),
}))
