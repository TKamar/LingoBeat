import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SESSION_MAX_AGE_DAYS = 30

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json(
      { error: `User not found: ${email}. Run npx prisma db seed first.` },
      { status: 404 }
    )
  }

  await db.session.deleteMany({ where: { userId: user.id } })

  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_MAX_AGE_DAYS)

  const sessionToken = crypto.randomUUID()
  await db.session.create({
    data: { sessionToken, userId: user.id, expires },
  })

  const redirectTo = req.nextUrl.searchParams.get('redirectTo') ?? '/deck'
  const response = NextResponse.redirect(new URL(redirectTo, req.nextUrl))
  response.cookies.set('authjs.session-token', sessionToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    expires,
    path: '/',
  })

  return response
}
