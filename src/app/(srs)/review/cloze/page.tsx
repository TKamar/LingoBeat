import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { fetchClozeCards } from '@/lib/fetchClozeCards'
import { ClozeSession } from './ClozeSession'

export default async function ClozeReviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const cards = await fetchClozeCards(session.user.id)
  if (cards.length === 0) redirect('/deck')

  return <ClozeSession cards={cards} />
}
