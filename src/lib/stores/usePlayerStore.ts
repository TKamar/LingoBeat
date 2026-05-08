import { create } from 'zustand'
import { MediaBridge, PlayerState } from '../adapters/MediaBridge'

interface PlayerSlice {
  bridge: MediaBridge | null
  state: PlayerState
  duration_ms: number
  setBridge: (bridge: MediaBridge) => void
  setState: (state: PlayerState) => void
  setDuration: (ms: number) => void
  play: () => void
  pause: () => void
  seek: (ms: number) => void
}

export const usePlayerStore = create<PlayerSlice>((set, get) => ({
  bridge: null,
  state: 'idle',
  duration_ms: 0,
  setBridge: (bridge) => {
    get().bridge?.destroy()
    set({ bridge })
  },
  setState: (state) => set({ state }),
  setDuration: (duration_ms) => set({ duration_ms }),
  play: () => { void get().bridge?.play() },
  pause: () => get().bridge?.pause(),
  seek: (ms) => get().bridge?.seek(ms),
}))
