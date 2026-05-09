import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { parseLRC } from '../src/lib/engine/LRCParser'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx !== -1 ? args[idx + 1] : undefined
  }
  return {
    title: get('--title'),
    artist: get('--artist'),
    lang: get('--lang'),
    audio: get('--audio'),
    lrc: get('--lrc'),
  }
}

async function fetchLrclib(artist: string, title: string): Promise<string | null> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'LingoBeat/1.0 (tomer.kamar@gmail.com)' } })
    if (!res.ok) return null
    const data = await res.json() as { syncedLyrics?: string }
    return data.syncedLyrics ?? null
  } catch {
    return null
  }
}

async function main() {
  const { title, artist, lang, audio, lrc } = parseArgs()

  if (!title || !artist || !lang || !audio) {
    console.error('Usage: npx tsx scripts/import-song.ts --title "X" --artist "Y" --lang fr --audio "https://..."')
    console.error('Optional: --lrc path/to/lyrics.lrc')
    process.exit(1)
  }

  console.log(`Importing: "${title}" by ${artist} (${lang})`)

  let lrcContent: string | null = null

  if (lrc) {
    const { readFileSync } = await import('fs')
    lrcContent = readFileSync(lrc, 'utf-8')
    console.log(`Using local LRC file: ${lrc}`)
  } else {
    console.log('Fetching from lrclib.io...')
    lrcContent = await fetchLrclib(artist, title)
    if (lrcContent) {
      console.log('✓ Synced lyrics found on lrclib.io')
    } else {
      console.error('✗ No synced lyrics found. Provide --lrc <file> to use local LRC.')
      process.exit(1)
    }
  }

  const parsed = parseLRC(lrcContent)
  console.log(`Parsed ${parsed.words.length} words across ${parsed.lines.length} lines`)

  const song = await prisma.song.create({
    data: {
      title,
      artist,
      language_code: lang,
      duration_ms: 0,
      media_type: 'mp3',
      media_id: audio,
      lyrics: {
        create: {
          words: parsed.words as object[],
          lines: parsed.lines as object[],
        },
      },
    },
  })

  console.log(`✓ Song created: ${song.id}`)
  console.log(`  Player URL: http://localhost:3000/player/${song.id}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
