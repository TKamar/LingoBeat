import { HTML5AudioAdapter } from '@/lib/adapters/HTML5AudioAdapter'

function makeAdapter() {
  return new HTML5AudioAdapter('https://example.com/song.mp3')
}

describe('HTML5AudioAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls audio.play() on play()', async () => {
    const adapter = makeAdapter()
    await adapter.play()
    const audioInstance = (global.Audio as jest.Mock).mock.results[0].value
    expect(audioInstance.play).toHaveBeenCalled()
  })

  it('calls audio.pause() on pause()', () => {
    const adapter = makeAdapter()
    adapter.pause()
    const audioInstance = (global.Audio as jest.Mock).mock.results[0].value
    expect(audioInstance.pause).toHaveBeenCalled()
  })

  it('sets audio.currentTime in seconds on seek(ms)', () => {
    const adapter = makeAdapter()
    const audioInstance = (global.Audio as jest.Mock).mock.results[0].value
    adapter.seek(5000)
    expect(audioInstance.currentTime).toBe(5)
  })

  it('returns currentTime in milliseconds', () => {
    const adapter = makeAdapter()
    const audioInstance = (global.Audio as jest.Mock).mock.results[0].value
    audioInstance.currentTime = 15.5
    expect(adapter.getCurrentTime()).toBe(15500)
  })

  it('returns duration in milliseconds', () => {
    const adapter = makeAdapter()
    const audioInstance = (global.Audio as jest.Mock).mock.results[0].value
    audioInstance.duration = 180
    expect(adapter.getDuration()).toBe(180000)
  })

  it('starts in idle state', () => {
    const adapter = makeAdapter()
    expect(adapter.getState()).toBe('idle')
  })

  it('returns unsubscribe function from on()', () => {
    const adapter = makeAdapter()
    const handler = jest.fn()
    const unsub = adapter.on('play', handler)
    expect(typeof unsub).toBe('function')
  })

  it('clears src on destroy()', () => {
    const adapter = makeAdapter()
    adapter.destroy()
    const audioInstance = (global.Audio as jest.Mock).mock.results[0].value
    expect(audioInstance.src).toBe('')
  })
})
