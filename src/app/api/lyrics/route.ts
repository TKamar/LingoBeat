import { NextRequest, NextResponse } from 'next/server'

const LRCLIB_BASE = 'https://lrclib.net/api/get'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const track_name = searchParams.get('track_name')
  const artist_name = searchParams.get('artist_name')
  const duration = searchParams.get('duration')

  if (!track_name || !artist_name) {
    return NextResponse.json(
      { error: 'track_name and artist_name are required' },
      { status: 400 },
    )
  }

  const params = new URLSearchParams({ track_name, artist_name })
  if (duration) params.set('duration', duration)

  const upstream = await fetch(`${LRCLIB_BASE}?${params}`, {
    headers: { 'Lrclib-Client': 'LingoBeat/0.1' },
    next: { revalidate: 86400 },
  })

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 })
  }

  const data = await upstream.json()
  return NextResponse.json({
    syncedLyrics: data.syncedLyrics ?? null,
    plainLyrics:  data.plainLyrics  ?? null,
    trackName:    data.trackName,
    artistName:   data.artistName,
    duration:     data.duration,
  })
}
