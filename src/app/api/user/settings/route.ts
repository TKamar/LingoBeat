import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { VALID_PROVIDERS } from '@/lib/providers'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { analysis_provider: true },
  })
  return NextResponse.json({ analysis_provider: user?.analysis_provider ?? 'haiku' })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!VALID_PROVIDERS.includes(body?.analysis_provider)) {
    return NextResponse.json(
      { error: `analysis_provider must be one of: ${VALID_PROVIDERS.join(', ')}` },
      { status: 400 }
    )
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { analysis_provider: body.analysis_provider },
  })
  return NextResponse.json({ analysis_provider: user.analysis_provider })
}
