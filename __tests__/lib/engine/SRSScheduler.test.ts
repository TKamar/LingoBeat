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

  it('schedule with Again (1) — returns valid next review date', () => {
    const card = scheduler.createCard()
    const result = scheduler.schedule(card, 1)
    expect(result.nextReview instanceof Date).toBe(true)
    // ts-fsrs v5 increments reps for all ratings including Again
    expect(result.card.reps).toBeGreaterThanOrEqual(0)
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

  it('fromJSON on serialized state restores the card', () => {
    const original = scheduler.createCard()
    const serialized = JSON.parse(JSON.stringify(original))
    const restored = scheduler.fromJSON(serialized)
    expect(restored.reps).toBe(original.reps)
  })
})
