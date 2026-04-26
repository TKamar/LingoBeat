import { create } from 'zustand'

interface SyncSlice {
  activeWordIndex: number
  activeLineIndex: number
  setSync: (wordIndex: number, lineIndex: number) => void
}

export const useSyncStore = create<SyncSlice>((set) => ({
  activeWordIndex: -1,
  activeLineIndex: -1,
  setSync: (activeWordIndex, activeLineIndex) => set({ activeWordIndex, activeLineIndex }),
}))
