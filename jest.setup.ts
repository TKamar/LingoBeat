// jest.setup.ts
import '@testing-library/jest-dom'

// rAF shim for SyncEngine tests
global.requestAnimationFrame = (cb) => setTimeout(cb, 16) as unknown as number
global.cancelAnimationFrame = (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>)

// HTMLAudioElement shim for HTML5AudioAdapter tests
Object.defineProperty(global, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentTime: 0,
    duration: 180,
    src: '',
  })),
})
