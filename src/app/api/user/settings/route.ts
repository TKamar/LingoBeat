import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { VALID_PROVIDERS } from '@/lib/providers'

const ALLOWED_BY_ROLE: Record<string, string[]> = {
  user:  ['free'],
  pro:   ['free', 'haiku'],
  admin: ['free', 'haiku', 'sonnet'],
}

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { analysis_provider: true, role: true },
  })
  return NextResponse.json({
    analysis_provider: user?.analysis_provider ?? 'haiku',
    role: user?.role ?? 'user',
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const requested = body?.analysis_provider

  if (!VALID_PROVIDERS.includes(requested)) {
    return NextResponse.json(
      { error: `analysis_provider must be one of: ${VALID_PROVIDERS.join(', ')}` },
      { status: 400 }
    )
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  const role = dbUser?.role ?? 'user'
  const allowed = ALLOWED_BY_ROLE[role] ?? ['free']

  if (!allowed.includes(requested)) {
    return NextResponse.json(
      { error: `Your plan does not allow the '${requested}' provider. Allowed: ${allowed.join(', ')}` },
      { status: 403 }
    )
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { analysis_provider: requested },
    select: { analysis_provider: true, role: true },
  })
  return NextResponse.json(user)
}
