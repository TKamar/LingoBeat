import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { generateCloze } from '@/lib/engine/ClozeGenerator'
import { ClozeSession } from './ClozeSession'

export default async function ClozeReviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const now = new Date()
  const dueCards = await db.srsCard.findMany({
    where: { user_id: session.user.id, next_review_at: { lte: now } },
    take: 10,
  })

  if (dueCards.length === 0) redirect('/deck')

  const cards = (await Promise.all(dueCards.map(async (card) => {
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
  }))).filter((c): c is NonNullable<typeof c> => c !== null)

  return <ClozeSession cards={cards} />
}
