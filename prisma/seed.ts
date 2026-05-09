import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { parseLRC } from '../src/lib/engine/LRCParser'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DEMO_SONG_ID    = 'aaaaaaaa-0000-0000-0000-000000000001'
const DEMO_SONG_2_ID  = 'aaaaaaaa-0000-0000-0000-000000000002'
const DEMO_SONG_3_ID  = 'aaaaaaaa-0000-0000-0000-000000000003'
const DEMO_SONG_4_ID  = 'aaaaaaaa-0000-0000-0000-000000000004'

const USER_USER_ID  = 'bbbbbbbb-0000-0000-0000-000000000001'
const PRO_USER_ID   = 'bbbbbbbb-0000-0000-0000-000000000002'
const ADMIN_USER_ID = 'bbbbbbbb-0000-0000-0000-000000000003'

async function fetchLrclib(artist: string, track: string): Promise<string | null> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'LingoBeat/1.0 (tomer.kamar@gmail.com)' } })
    if (!res.ok) return null
    const data = await res.json() as { syncedLyrics?: string }
    return data.syncedLyrics ?? null
  } catch {
    return null
  }
}

const PAPAOUTAI_LRC = `[00:05.00]Dis-moi où on va
[00:08.50]La la la la la
[00:12.00]Dis-moi comment on fait
[00:15.50]Pour devenir grand
[00:19.00]Sans jamais connaître
[00:22.50]Ni père ni papa`

const JE_VEUX_LRC = `[00:10.00]Je veux du bonheur
[00:13.50]Je veux de l'amour
[00:17.00]Je veux du soleil
[00:20.50]Et je veux tout ça pour toujours`

const LUFTBALLONS_LRC = `[00:05.00]Hast du etwas Zeit für mich
[00:09.00]Dann singe ich ein Lied für dich
[00:13.00]Von 99 Luftballons
[00:17.00]Auf ihrem Weg zum Horizont`

const DESPACITO_LRC = `[00:15.00]Sí, sabes que ya llevo un rato mirándote
[00:20.00]Tengo que bailar contigo hoy
[00:24.50]Vi que tu mirada ya estaba llamándome
[00:29.00]Muéstrame el camino que yo voy`

interface SongDef {
  id: string
  title: string
  artist: string
  language_code: string
  audioSrc: string
  fallbackLrc: string
}

const SONGS: SongDef[] = [
  {
    id: DEMO_SONG_ID,
    title: 'Papaoutai',
    artist: 'Stromae',
    language_code: 'fr',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    fallbackLrc: PAPAOUTAI_LRC,
  },
  {
    id: DEMO_SONG_2_ID,
    title: 'Je veux',
    artist: 'Zaz',
    language_code: 'fr',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    fallbackLrc: JE_VEUX_LRC,
  },
  {
    id: DEMO_SONG_3_ID,
    title: '99 Luftballons',
    artist: 'Nena',
    language_code: 'de',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    fallbackLrc: LUFTBALLONS_LRC,
  },
  {
    id: DEMO_SONG_4_ID,
    title: 'Despacito',
    artist: 'Luis Fonsi',
    language_code: 'es',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    fallbackLrc: DESPACITO_LRC,
  },
]

async function main() {
  console.log('Seeding demo users...')

  const users = [
    { id: USER_USER_ID,  email: 'user@test.dev',  name: 'Demo User',  role: 'user',  analysis_provider: 'free' },
    { id: PRO_USER_ID,   email: 'pro@test.dev',   name: 'Pro User',   role: 'pro',   analysis_provider: 'haiku' },
    { id: ADMIN_USER_ID, email: 'admin@test.dev', name: 'Admin User', role: 'admin', analysis_provider: 'haiku' },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, analysis_provider: u.analysis_provider },
      create: u,
    })
    console.log(`  ✓ User: ${u.email} (${u.role})`)
  }

  console.log('Seeding demo songs...')

  for (const song of SONGS) {
    let lrcContent = await fetchLrclib(song.artist, song.title)
    if (!lrcContent) {
      console.log(`  ⚠ lrclib.io: no result for "${song.title}" — using fallback LRC`)
      lrcContent = song.fallbackLrc
    } else {
      console.log(`  ✓ lrclib.io: fetched synced lyrics for "${song.title}"`)
    }

    const parsed = parseLRC(lrcContent)

    await prisma.song.upsert({
      where: { id: song.id },
      update: { title: song.title, artist: song.artist },
      create: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        language_code: song.language_code,
        duration_ms: 180000,
        media_type: 'mp3',
        media_id: song.audioSrc,
      },
    })

    await prisma.lyrics.upsert({
      where: { song_id: song.id },
      update: { words: parsed.words as object[], lines: parsed.lines as object[] },
      create: {
        song_id: song.id,
        words: parsed.words as object[],
        lines: parsed.lines as object[],
      },
    })

    console.log(`  ✓ Song: "${song.title}" by ${song.artist} (${song.language_code})`)
  }

  console.log('Seeding SRS card...')
  // Delete any pre-existing card with this id (left from prior seed runs with different user_id)
  await prisma.srsCard.deleteMany({ where: { id: 'a1b2c3d4-0000-0000-0000-000000000010' } })
  await prisma.srsCard.upsert({
    where: {
      user_id_language_code_word: {
        user_id: PRO_USER_ID,
        language_code: 'fr',
        word: 'dis-moi',
      },
    },
    update: {},
    create: {
      id: 'a1b2c3d4-0000-0000-0000-000000000010',
      user_id: PRO_USER_ID,
      language_code: 'fr',
      word: 'dis-moi',
      meaning: 'tell me (imperative)',
      context_song: DEMO_SONG_ID,
      fsrs_state: {},
      next_review_at: new Date(),
    },
  })
  console.log('  ✓ SRS card: dis-moi (pro@test.dev)')

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
