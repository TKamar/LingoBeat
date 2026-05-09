import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DeckPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const cards = await db.srsCard.findMany({
    where: { user_id: session.user.id },
    orderBy: { next_review_at: 'asc' },
  })

  const now = new Date()
  const dueCount = cards.filter(c => new Date(c.next_review_at) <= now).length

  return (
    <main className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">My Deck</h1>
        <div className="flex gap-3 items-center">
          <Link href="/player/demo" className="text-sm text-slate-400 hover:text-slate-200">← Player</Link>
          {dueCount > 0 && (
            <Link
              href="/review"
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Review {dueCount} due →
            </Link>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No words saved yet.</p>
          <p className="text-sm mt-2">Tap any word in the player to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map(card => {
            const isDue = new Date(card.next_review_at) <= now
            return (
              <div
                key={card.id}
                className={`rounded-xl p-4 bg-slate-800 border ${isDue ? 'border-blue-700' : 'border-slate-700 opacity-70'}`}
              >
                <p className="font-bold text-slate-100 text-lg">{card.word}</p>
                {card.meaning && (
                  <p className="text-slate-400 text-sm mt-1">{card.meaning}</p>
                )}
                {card.context_song && (
                  <p className="text-slate-500 text-xs mt-1">♪ Saved from song</p>
                )}
                <div className="mt-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDue
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isDue ? 'Due now' : 'Scheduled'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
