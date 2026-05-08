import { createEmptyCard, fsrs, Rating, type Card as FsrsCard } from 'ts-fsrs'

export type { FsrsCard }
export type SrsRating = 1 | 2 | 3 | 4  // Again | Hard | Good | Easy

export interface ScheduleResult {
  card: FsrsCard
  nextReview: Date
}

export class SRSScheduler {
  private f = fsrs()

  createCard(): FsrsCard {
    return createEmptyCard()
  }

  schedule(card: FsrsCard, rating: SrsRating): ScheduleResult {
    const results = this.f.repeat(card, new Date())
    // SrsRating is 1–4 (Again/Hard/Good/Easy); Rating.Manual=0 is excluded, so the cast is safe
    const scheduled = results[rating as Rating.Again | Rating.Hard | Rating.Good | Rating.Easy]
    return {
      card: scheduled.card,
      nextReview: scheduled.card.due,
    }
  }

  /** Restores an FsrsCard from JSON.parse output (e.g., from the DB). Returns a new card if state is empty or corrupt. */
  fromJSON(state: Record<string, unknown>): FsrsCard {
    if (!state || Object.keys(state).length === 0) return this.createCard()
    if (state.state === undefined) return this.createCard()
    return {
      ...state,
      due: new Date(state.due as string),
      last_review: state.last_review ? new Date(state.last_review as string) : null,
    } as unknown as FsrsCard
  }
}
