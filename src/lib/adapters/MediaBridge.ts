export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'
export type PlayerEvent = 'play' | 'pause' | 'ended' | 'error' | 'durationchange'

export interface MediaBridge {
  play(): Promise<void>
  pause(): void
  seek(ms: number): void
  getCurrentTime(): number   // returns milliseconds — polled by SyncEngine
  getDuration(): number      // returns milliseconds
  getState(): PlayerState
  on(event: PlayerEvent, handler: () => void): () => void  // returns unsubscribe fn
  destroy(): void
}
