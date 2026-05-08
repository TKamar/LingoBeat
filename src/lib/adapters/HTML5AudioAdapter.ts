import { MediaBridge, PlayerEvent, PlayerState } from './MediaBridge'

export class HTML5AudioAdapter implements MediaBridge {
  private audio: HTMLAudioElement
  private state: PlayerState = 'idle'
  private handlers: Map<PlayerEvent, Set<() => void>> = new Map()

  constructor(src: string) {
    this.audio = new Audio(src)
    this.audio.addEventListener('play', () => this.transition('playing'))
    this.audio.addEventListener('pause', () => this.transition('paused'))
    this.audio.addEventListener('ended', () => this.transition('paused'))
    this.audio.addEventListener('error', () => this.transition('error'))
    this.audio.addEventListener('loadstart', () => this.transition('loading'))
    this.audio.addEventListener('canplay', () => {
      if (this.state === 'loading') this.transition('idle')
    })
    this.audio.addEventListener('loadedmetadata', () => {
      this.handlers.get('durationchange')?.forEach(fn => fn())
    })
  }

  private transition(next: PlayerState) {
    this.state = next
    const event: PlayerEvent | null =
      next === 'playing' ? 'play' :
      next === 'paused'  ? 'pause' :
      next === 'error'   ? 'error' : null
    if (event) this.handlers.get(event)?.forEach(fn => fn())
  }

  play() { return this.audio.play() }

  pause() { this.audio.pause() }

  seek(ms: number) { this.audio.currentTime = ms / 1000 }

  getCurrentTime() { return this.audio.currentTime * 1000 }

  getDuration() { return (this.audio.duration || 0) * 1000 }

  getState() { return this.state }

  on(event: PlayerEvent, handler: () => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.handlers.get(event)?.delete(handler)
  }

  destroy() {
    this.audio.pause()
    this.audio.src = ''
    this.handlers.clear()
  }
}
