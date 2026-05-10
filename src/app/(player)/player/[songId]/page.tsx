import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { LyricsViewLoader } from './LyricsViewLoader'
import { PageTransition } from '@/components/PageTransition'
import type { LyricWord, LyricLine } from '@/lib/types'

const DEMO_SONG_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

interface Props {
  params: Promise<{ songId: string }>
}

export default async function PlayerPage({ params }: Props) {
  const { songId } = await params
  const resolvedId = songId === 'demo' ? DEMO_SONG_ID : songId

  const song = await db.song.findUnique({
    where: { id: resolvedId },
    include: { lyrics: true },
  })

  if (!song || !song.lyrics) notFound()

  const parsedLyrics = {
    words: song.lyrics.words as unknown as LyricWord[],
    lines: song.lyrics.lines as unknown as LyricLine[],
  }

  return (
    <PageTransition>
      <main className="flex flex-col h-screen bg-background">
        <header className="px-6 py-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-slate-100">{song.title}</h1>
          <p className="text-sm text-slate-400">{song.artist}</p>
        </header>
        <LyricsViewLoader
          lyrics={parsedLyrics}
          audioSrc={song.media_id}
          languageCode={song.language_code}
        />
      </main>
    </PageTransition>
  )
}
