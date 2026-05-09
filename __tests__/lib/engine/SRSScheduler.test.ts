import { SRSScheduler } from '@/lib/engine/SRSScheduler'

describe('SRSScheduler', () => {
  let scheduler: SRSScheduler

  beforeEach(() => {
    scheduler = new SRSScheduler()
  })

  it('createCard returns a valid initial FSRS card state', () => {
    const card = scheduler.createCard()
    expect(card).toMatchObject({
      stability: expect.any(Number),
      difficulty: expect.any(Number),
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
    })
    expect(card.due instanceof Date).toBe(true)
  })

  it('schedule with Again (1) — reps incremented to 1 in ts-fsrs v5', () => {
    const card = scheduler.createCard()
    const result = scheduler.schedule(card, 1)
    expect(result.nextReview instanceof Date).toBe(true)
    expect(result.card.reps).toBe(1)
  })

  it('schedule with Good (3) — increments reps, positive stability', () => {
    const card = scheduler.createCard()
    const result = scheduler.schedule(card, 3)
    expect(result.card.reps).toBe(1)
    expect(result.card.stability).toBeGreaterThan(0)
  })

  it('Easy (4) schedules further than Good (3)', () => {
    const card = scheduler.createCard()
    const good = scheduler.schedule(card, 3)
    const easy = scheduler.schedule(card, 4)
    expect(easy.card.scheduled_days).toBeGreaterThanOrEqual(good.card.scheduled_days)
  })

  it('all four ratings produce valid results without throwing', () => {
    const card = scheduler.createCard()
    for (const rating of [1, 2, 3, 4] as const) {
      expect(() => scheduler.schedule(card, rating)).not.toThrow()
    }
  })

  it('fromJSON on empty object returns a new card', () => {
    const card = scheduler.fromJSON({})
    expect(card.reps).toBe(0)
  })

  it('fromJSON on serialized state restores the card with rehydrated dates', () => {
    const original = scheduler.createCard()
    const serialized = JSON.parse(JSON.stringify(original))
    const restored = scheduler.fromJSON(serialized)
    expect(restored.reps).toBe(original.reps)
    expect(restored.due instanceof Date).toBe(true)
  })

  it('fromJSON on a scheduled card allows subsequent scheduling', () => {
    const initial = scheduler.createCard()
    const scheduled = scheduler.schedule(initial, 3)
    const serialized = JSON.parse(JSON.stringify(scheduled.card))
    const restored = scheduler.fromJSON(serialized)
    expect(() => scheduler.schedule(restored, 3)).not.toThrow()
    expect(restored.reps).toBe(1)
  })
})
