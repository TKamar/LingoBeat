import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { fetchClozeCards } from '@/lib/fetchClozeCards'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cards = await fetchClozeCards(session.user.id)
  return NextResponse.json({ cards })
}
