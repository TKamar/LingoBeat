import { parseLRC } from '@/lib/engine/LRCParser'
import { LyricsViewLoader } from './LyricsViewLoader'

const DEMO = {
  title: 'Papaoutai',
  artist: 'Stromae',
  audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  lrcContent: `[00:05.00]Dis-moi où on va
[00:08.50]La la la la la
[00:12.00]Dis-moi comment on fait
[00:15.50]Pour devenir grand
[00:19.00]Sans jamais connaître
[00:22.50]Ni père ni papa`,
}

export default async function PlayerPage() {
  const lyrics = parseLRC(DEMO.lrcContent)

  return (
    <main className="flex flex-col h-screen bg-background">
      <header className="px-6 py-4 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-slate-100">{DEMO.title}</h1>
        <p className="text-sm text-slate-400">{DEMO.artist}</p>
      </header>
      <LyricsViewLoader lyrics={lyrics} audioSrc={DEMO.audioSrc} />
    </main>
  )
}
