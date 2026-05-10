import { db } from '@/lib/db'
import { generateCloze } from '@/lib/engine/ClozeGenerator'

export interface ClozeCardData {
  card_id: string
  word: string
  lyric_line: string
  choices: string[]
  song_title: string
}

export async function fetchClozeCards(userId: string, limit = 10): Promise<ClozeCardData[]> {
  const now = new Date()
  const dueCards = await db.srsCard.findMany({
    where: { user_id: userId, next_review_at: { lte: now } },
    take: limit,
  })

  const cards = await Promise.all(dueCards.map(async (card) => {
    if (!card.context_song) return null
    const [lyrics, song] = await Promise.all([
      db.lyrics.findUnique({ where: { song_id: card.context_song } }),
      db.song.findUnique({ where: { id: card.context_song }, select: { title: true } }),
    ])
    if (!lyrics) return null
    const cloze = generateCloze(
      card.word,
      lyrics.words as Array<{ word: string; startMs: number }>,
      lyrics.lines as Array<{ startMs: number; endMs: number; text: string }>
    )
    return { card_id: card.id, song_title: song?.title ?? 'Unknown', ...cloze }
  }))

  return cards.filter((c): c is ClozeCardData => c !== null)
}
