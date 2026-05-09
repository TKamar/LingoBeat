import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ReviewSession } from './ReviewSession'
import Link from 'next/link'

export default async function ReviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const cards = await db.srsCard.findMany({
    where: { user_id: session.user.id, next_review_at: { lte: new Date() } },
    orderBy: { next_review_at: 'asc' },
    take: 20,
  })

  if (cards.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-2xl text-slate-100">Nothing due!</p>
        <p className="text-slate-400">Check back later.</p>
        <Link href="/deck" className="px-6 py-3 rounded-full bg-slate-700 text-white font-medium hover:bg-slate-600">
          Back to deck
        </Link>
      </main>
    )
  }

  const serializable = cards.map(c => ({
    id: c.id,
    word: c.word,
    meaning: c.meaning,
    context_song: c.context_song,
  }))

  return (
    <main className="min-h-screen bg-background text-foreground p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Review</h1>
        <Link href="/deck" className="text-sm text-slate-400 hover:text-slate-200">← Deck</Link>
      </div>
      <ReviewSession initialCards={serializable} />
    </main>
  )
}
