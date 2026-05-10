import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lang = searchParams.get('lang')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const cursor = searchParams.get('cursor')

  const songs = await db.song.findMany({
    where: lang ? { language_code: lang } : undefined,
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { created_at: 'desc' },
    select: { id: true, title: true, artist: true, language_code: true },
  })

  return NextResponse.json({
    songs,
    nextCursor: songs.length === limit ? songs[songs.length - 1].id : null,
  })
}
