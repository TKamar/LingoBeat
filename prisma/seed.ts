import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { parseLRC } from '../src/lib/engine/LRCParser'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Fixed ID so the player page at /player/demo can resolve to this song in Sprint 2+
const DEMO_SONG_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

// Same content used in src/app/(player)/player/[songId]/page.tsx
const DEMO_LRC = `[00:05.00]Dis-moi où on va
[00:08.50]La la la la la
[00:12.00]Dis-moi comment on fait
[00:15.50]Pour devenir grand
[00:19.00]Sans jamais connaître
[00:22.50]Ni père ni papa`

async function main() {
  console.log('Seeding database…')

  const user = await prisma.user.upsert({
    where: { email: 'tomer.kamar@gmail.com' },
    update: {},
    create: {
      email: 'tomer.kamar@gmail.com',
      name: 'Tomer',
      native_lang: 'en',
    },
  })
  console.log(`  ✓ User: ${user.email}`)

  const song = await prisma.song.upsert({
    where: { id: DEMO_SONG_ID },
    update: {},
    create: {
      id: DEMO_SONG_ID,
      title: 'Papaoutai',
      artist: 'Stromae',
      language_code: 'fr',
      duration_ms: 233000,
      media_type: 'html5',
      media_id: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
  })
  console.log(`  ✓ Song: "${song.title}" by ${song.artist}`)

  const parsed = parseLRC(DEMO_LRC)
  await prisma.lyrics.upsert({
    where: { song_id: DEMO_SONG_ID },
    update: {},
    create: {
      song_id: DEMO_SONG_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      words: parsed.words as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lines: parsed.lines as any,
    },
  })
  console.log(`  ✓ Lyrics: ${parsed.words.length} words across ${parsed.lines.length} lines`)

  await prisma.songDifficulty.upsert({
    where: { song_id: DEMO_SONG_ID },
    update: {},
    create: {
      song_id: DEMO_SONG_ID,
      vocab_cefr: 'B1',
      audio_speed_wpm: 72.0,
      grammar_score: 6.0,   // placeholder — normally computed by Claude in Sprint 2
      composite_level: 'B1',
    },
  })
  console.log('  ✓ Difficulty: B1')

  console.log('\nSeed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
