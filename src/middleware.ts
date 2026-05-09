import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname

  if (!isLoggedIn && (
    path.startsWith('/deck') ||
    path.startsWith('/review') ||
    path.startsWith('/admin')
  )) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ['/deck/:path*', '/review/:path*', '/admin/:path*'],
}
