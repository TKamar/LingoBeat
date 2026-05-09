import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const DEFAULTS = { target_language: 'fr', daily_goal_xp: 20, onboarding_done: false }

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pref = await db.userPreference.findUnique({
    where: { user_id: session.user.id },
    select: { target_language: true, daily_goal_xp: true, onboarding_done: true },
  })
  return NextResponse.json(pref ?? DEFAULTS)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const allowed = ['target_language', 'daily_goal_xp', 'onboarding_done']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const pref = await db.userPreference.upsert({
    where: { user_id: session.user.id },
    update: data,
    create: { user_id: session.user.id, ...DEFAULTS, ...data },
    select: { target_language: true, daily_goal_xp: true, onboarding_done: true },
  })
  return NextResponse.json(pref)
}
