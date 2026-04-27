@AGENTS.md

# LingoBeat — Project Reference

## What This Is

LingoBeat is an audio-first language learning app. Users learn any language by listening to songs with millisecond-accurate synchronized lyrics. Words highlight in real time as audio plays. Tapping a word jumps the audio to that exact timestamp. Words can be saved to a personal spaced-repetition deck.

**Sprint 1 (current):** Foundation complete. User can play a Latin-script song and see words highlight in sync, with tap-to-seek working. 33/33 tests passing, 0 TypeScript errors.

**Sprint 2 (next):** Auth (NextAuth.js), Python FastAPI microservice, Claude Sonnet 4.6 word analysis, WordPopover, SRS deck + FSRS review session.

---

## Tech Stack — Exact Versions

| Technology | Version | Notes |
|---|---|---|
| Next.js | 16.2.4 | App Router. `create-next-app@latest` resolved to 16, not 15. |
| React | 19.2.4 | |
| TypeScript | 5.x | Strict mode |
| Tailwind CSS | v4 | Uses `@import "tailwindcss"` — NOT `@tailwind base/components/utilities` |
| shadcn/ui | 4.x | **base-nova style** using `@base-ui/react`. NOT `@radix-ui`. |
| `@base-ui/react` | 1.4.1 | Replaces Radix UI in this install. Slider API differs — see below. |
| Zustand | 5.0.12 | |
| Prisma | **7.x** | Breaking changes vs Prisma 6 — no built-in engine, requires driver adapter. |
| `pg` | 8.x | PostgreSQL driver used by Prisma 7 adapter |
| `@prisma/adapter-pg` | 7.x | Prisma 7 driver adapter for `pg` |
| PostgreSQL | Docker (local) or Neon (production) | Port 5433 locally to avoid conflict with system postgres |
| Jest | 30.x | With `next/jest` SWC transformer. No `ts-jest`. |
| `lucide-react` | 1.11.0 | |
| `framer-motion` | 12.x | Installed, not yet used in Sprint 1 UI. |
| `lrclib-api` | 2.0.4 | Installed but route uses raw `fetch` to the LRCLIB REST API directly. |
| `ts-fsrs` | — | SRS algorithm for Sprint 2, not yet installed. |

---

## Critical Version Gotchas

### Prisma 7 (not 6)

Prisma 7 has three major breaking changes from Prisma 6:

**1. Generator** — must use `"prisma-client"` not `"prisma-client-js"`:
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

**2. Database URL** — lives in `prisma.config.ts`, NOT in the schema `datasource` block. Also configures the seed command:
```typescript
// prisma.config.ts (already exists — do not recreate)
import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",  // registered here, not in package.json
  },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

`dotenv` is a devDependency because `prisma.config.ts` uses `import "dotenv/config"`.

**Schema datasource** — NO `url` field:
```prisma
datasource db {
  provider = "postgresql"
}
```

**3. No built-in query engine — requires a driver adapter.** Prisma 7 dropped the Rust binary engine. All runtime PrismaClient usage must pass a driver adapter:

```typescript
// src/lib/db.ts — THE ONLY place PrismaClient should be instantiated
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Note: import from /client — Prisma 7 has no index.ts in the generated output
// Note: @/generated/prisma, not @prisma/client

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

**Import path for generated client:** Always use `@/generated/prisma/client` (with `/client`). There is no `index.ts` — the entry point is `client.ts`.

**Constructor options that do NOT exist in Prisma 7** (they existed in Prisma 6):
- `datasourceUrl` — removed
- `datasources` — removed
- Use the `adapter` option instead.

### shadcn base-nova / @base-ui/react Slider

The Slider component uses `@base-ui/react`, NOT `@radix-ui/react-slider`. The `onValueChange` callback signature is:

```typescript
onValueChange?: (value: number | readonly number[], event: Event) => void
```

Always guard with `Array.isArray`:
```typescript
const handleSliderChange = useCallback((values: number | readonly number[]) => {
  const ms = Array.isArray(values) ? values[0] : values
  seek(ms)
}, [seek])
```

### Tailwind CSS v4 in globals.css

```css
/* CORRECT — Tailwind v4 */
@import "tailwindcss";

/* WRONG — old v3 syntax, will break */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### API Route Tests — Node Environment

Next.js route handlers use Web Fetch API globals (`Request`, `Response`, `NextRequest`) that are not available in jsdom. Route handler test files need:

```typescript
/**
 * @jest-environment node
 */
```

---

## Running the Project

### Prerequisites
- **Node.js** 20+ 
- **Docker Desktop** (for local PostgreSQL) — already installed on this machine. Start it from the Start menu if it's not running. The CLI is at `C:\Program Files\Docker\Docker\resources\bin\docker.exe`.

### First time setup

```bash
cd C:/Projects/LingoBeat/lingobeat

# 1. Start the database container (port 5433 — avoids conflict with system postgres on 5432)
npm run db:up

# 2. Copy .env
cp .env.example .env
# .env already has the correct Docker URL:
# DATABASE_URL="postgresql://lingobeat:lingobeat@127.0.0.1:5433/lingobeat"

# 3. Run migrations (creates all tables)
npx prisma migrate dev --name init

# 4. Generate Prisma client (creates src/generated/prisma/)
npx prisma generate

# 5. Seed demo data (demo user + Stromae song + lyrics)
npx prisma db seed
```

### Daily development

```bash
npm run db:up        # Start database container (if not running)
npm run dev          # Start Next.js dev server at http://localhost:3000
npm test             # Run all 33 tests
npm run test:watch   # Jest in watch mode
npx tsc --noEmit    # Type check without building
```

### Database shortcuts

```bash
npm run db:up        # docker compose up -d
npm run db:down      # docker compose down (keeps data)
npm run db:reset     # docker compose down -v && up (wipes all data, re-run seed after)
npm run db:seed      # npx prisma db seed
```

### Docker port note
The container maps **host 5433 → container 5432**. This avoids conflict with any local PostgreSQL instance. Always use port 5433 in the DATABASE_URL on this machine.

### Demo player (Sprint 1)

Open **http://localhost:3000/player/demo**

The demo page (`src/app/(player)/player/[songId]/page.tsx`) hardcodes a Stromae "Papaoutai" LRC snippet with a royalty-free audio URL from soundhelix.com. No database or auth required.

**What to verify:**
- Dark navy background renders
- Song title + artist in header
- Word tokens display as clickable spans
- Play button starts audio
- Words highlight in sync as audio plays (active word: blue + background)
- Seek bar tracks current position
- Clicking a word jumps audio to that word's timestamp
- Active line auto-scrolls into center

### Mock user (Sprint 1)

Auth does not exist yet (Sprint 2 adds NextAuth.js). The demo works without login.

For Sprint 2 development, use this mock user object:
```typescript
const MOCK_USER = {
  id: 'mock-user-001',
  email: 'demo@lingobeat.dev',
  name: 'Demo User',
  native_lang: 'en',
}
```

---

## Architecture

### Real-Time Sync — The Heartbeat

```
Audio Element
  → HTML5AudioAdapter.getCurrentTime()   ← polled by SyncEngine at ~60fps
    → SyncEngine rAF loop (binary search O(log n))
      → Zustand { activeWordIndex, activeLineIndex }
        → LyricsView re-renders only the changed WordToken (React.memo)

User taps word
  → WordToken onClick → usePlayerStore.getState().seek(ms)
    → HTML5AudioAdapter.seek(ms) → audio.currentTime = ms / 1000
```

**Why rAF, not `timeupdate`?** The `timeupdate` event fires only 4–15× per second (~67–250ms granularity), producing visible lag. requestAnimationFrame fires at ~60fps (16ms), matching the display refresh rate.

**Why binary search?** A 300-word song needs one O(log n) lookup per frame. With n=300, that is ≤9 comparisons per tick, keeping frame cost well under 2ms.

**Why Zustand, not Context?** Zustand subscriptions are granular — a component subscribes to one slice and only re-renders when that slice changes. Context re-renders the entire subtree.

### Component Re-render Strategy

- `WordToken` is wrapped in `React.memo` — only re-renders when its `isActive` prop changes
- `LyricsView` subscribes to `activeWordIndex` + `activeLineIndex` separately from word data
- `PlayerControls` uses individual `usePlayerStore(s => s.xxx)` selectors (not whole-store destructure)
- `PlayerEngine` returns `null` — pure side effects, no rendering

### Data Flow Diagram

```
page.tsx (Server Component)
  parseLRC(lrcContent) → ParsedLyrics
    ↓ props
LyricsViewLoader (Client)
  setLyrics() → useSongStore    ← builds lineForWord[] in setLyrics
    ↓
PlayerEngine (Client, returns null)
  HTML5AudioAdapter → setBridge → usePlayerStore
  SyncEngine.start() → subscribe → useSyncStore.setSync()
    ↓
LyricsView (Client)
  useSongStore(lyrics) + useSyncStore(activeWordIndex, activeLineIndex)
  → renders WordToken[] with React.memo
    ↓
WordToken (Client, React.memo)
  isActive prop → className toggle
  onClick → usePlayerStore.getState().seek(ms)
```

---

## File Map

```
lingobeat/
├── src/
│   ├── app/
│   │   ├── (player)/
│   │   │   └── player/[songId]/
│   │   │       ├── page.tsx            — Server Component: parses LRC, renders layout
│   │   │       ├── LyricsViewLoader.tsx — Client: hydrates store, renders all player pieces
│   │   │       └── PlayerEngine.tsx    — Client: manages bridge + SyncEngine lifecycle (returns null)
│   │   ├── api/
│   │   │   └── lyrics/
│   │   │       └── route.ts            — GET proxy to LRCLIB with 24h cache + error handling
│   │   ├── globals.css                 — Dark navy CSS variables, Tailwind v4 import
│   │   ├── layout.tsx                  — Root layout: html.dark + LingoBeat metadata
│   │   └── page.tsx                    — Home page (placeholder)
│   ├── components/
│   │   ├── LyricsView.tsx              — Scrolling word grid, auto-scroll active line
│   │   ├── PlayerControls.tsx          — Play/pause + seek bar (250ms poll interval)
│   │   ├── WordToken.tsx               — React.memo wrapped tappable word span
│   │   └── ui/                         — shadcn/ui components (base-nova style)
│   │       ├── button.tsx
│   │       ├── slider.tsx              — @base-ui/react Slider (not Radix)
│   │       ├── scroll-area.tsx
│   │       ├── card.tsx
│   │       ├── popover.tsx
│   │       └── badge.tsx
│   └── lib/
│       ├── types.ts                    — LyricWord, LyricLine, ParsedLyrics, Song
│       ├── utils.ts                    — cn() helper (clsx + tailwind-merge)
│       ├── db.ts                       — Prisma 7 singleton with pg driver adapter
│       ├── adapters/
│       │   ├── MediaBridge.ts          — Interface + PlayerState/PlayerEvent types
│       │   └── HTML5AudioAdapter.ts    — Wraps HTMLAudioElement, implements MediaBridge
│       ├── engine/
│       │   ├── LRCParser.ts            — LRC string → ParsedLyrics (interpolates word timestamps)
│       │   └── SyncEngine.ts           — rAF loop, binary search, subscriber pattern
│       └── stores/
│           ├── usePlayerStore.ts       — bridge ref, PlayerState, play/pause/seek actions
│           ├── useSyncStore.ts         — activeWordIndex, activeLineIndex
│           └── useSongStore.ts         — song metadata, ParsedLyrics, lineForWord[]
├── __tests__/
│   ├── lib/engine/
│   │   ├── LRCParser.test.ts           — 11 tests
│   │   └── SyncEngine.test.ts          — 8 tests
│   ├── lib/adapters/
│   │   └── HTML5AudioAdapter.test.ts  — 8 tests
│   └── app/api/
│       └── lyrics.test.ts              — 6 tests (@jest-environment node)
├── prisma/
│   ├── schema.prisma                   — User, Song, Lyrics, SongDifficulty models
│   ├── seed.ts                         — Demo user + Stromae song + lyrics + difficulty
│   └── migrations/                     — Created after first `prisma migrate dev`
├── docker-compose.yml                  — Local PostgreSQL on port 5433
├── prisma.config.ts                    — Prisma 7 config (DATABASE_URL, migrations path, seed command)
├── jest.config.ts                      — next/jest SWC transformer, jsdom, @/ alias
├── jest.setup.ts                       — @testing-library/jest-dom, rAF polyfill, Audio mock
├── .env                                — DATABASE_URL (gitignored)
├── .env.example                        — Placeholder (committed)
├── AGENTS.md                           — Next.js version warning for AI agents
└── CLAUDE.md                           — This file
```

---

## Domain Types

```typescript
// src/lib/types.ts

interface LyricWord {
  text: string
  start_ms: number
  end_ms: number
  cefr_level?: string      // A1–C2, populated by Python service in Sprint 3+
  romanization?: string    // populated by Python service in Sprint 3+
}

interface LyricLine {
  lineIndex: number   // equals index in ParsedLyrics.lines[] — O(1) reverse lookup
  start_ms: number
  end_ms: number
  wordStart: number   // inclusive index into words[]
  wordEnd: number     // exclusive index into words[]
}

interface ParsedLyrics {
  words: LyricWord[]
  lines: LyricLine[]
}

interface Song {
  id: string
  title: string
  artist: string
  language_code: string   // ISO 639-1: 'fr', 'ja', 'ar'
  duration_ms: number
  media_type: 'html5' | 'youtube' | 'spotify'
  media_id: string        // URL, YouTube videoId, or Spotify URI
  lrclib_id?: number
}
```

---

## MediaBridge Interface

```typescript
// src/lib/adapters/MediaBridge.ts
type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'
type PlayerEvent = 'play' | 'pause' | 'ended' | 'error' | 'durationchange'

interface MediaBridge {
  play(): Promise<void>
  pause(): void
  seek(ms: number): void
  getCurrentTime(): number    // polled by SyncEngine rAF loop
  getDuration(): number
  getState(): PlayerState
  on(event: PlayerEvent, handler: () => void): () => void   // returns unsubscribe fn
  destroy(): void
}
```

Sprint 1 implements `HTML5AudioAdapter`. Sprint 3 adds `YouTubeAdapter` and `SpotifyAdapter`.

---

## Zustand Stores

### usePlayerStore
```typescript
bridge: MediaBridge | null       // set by PlayerEngine on mount
state: PlayerState               // 'idle' | 'loading' | 'playing' | 'paused' | 'error'
duration_ms: number
setBridge(bridge): void          // destroys previous bridge before setting new one
setState(state): void
setDuration(ms): void
play(): void                     // delegates to bridge?.play() (promise voided)
pause(): void
seek(ms): void
```

### useSyncStore
```typescript
activeWordIndex: number          // -1 = silence/before first word
activeLineIndex: number          // -1 = silence/before first line
setSync(wordIndex, lineIndex): void
```

### useSongStore
```typescript
song: Song | null
lyrics: ParsedLyrics | null
lineForWord: number[]            // lineForWord[i] = line index for words[i], built in setLyrics()
setSong(song): void              // also clears lyrics + lineForWord
setLyrics(lyrics): void          // also computes lineForWord via buildLineForWord()
```

**Note:** `seek` in `LyricsView` is read via `usePlayerStore.getState().seek(ms)` inside a `useCallback([], [])` — this gives a stable reference that doesn't trigger re-renders.

---

## Database Schema (Prisma 7)

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  name        String?
  native_lang String   @default("en")
  created_at  DateTime @default(now())
}

model Song {
  id            String          @id @default(uuid())
  title         String
  artist        String
  language_code String
  duration_ms   Int
  media_type    String          // 'html5' | 'youtube' | 'spotify'
  media_id      String
  lrclib_id     Int?
  created_at    DateTime        @default(now())
  lyrics        Lyrics?
  difficulty    SongDifficulty?
}

model Lyrics {
  id         String   @id @default(uuid())
  song_id    String   @unique
  words      Json     // LyricWord[]
  lines      Json     // LyricLine[]
  created_at DateTime @default(now())
  song       Song     @relation(fields: [song_id], references: [id], onDelete: Cascade)
}

model SongDifficulty {
  song_id          String   @id
  vocab_cefr       String   // A1–C2
  audio_speed_wpm  Float
  grammar_score    Float    // 1–10 (async, from Claude)
  composite_level  String   // A1–C2 display label
  computed_at      DateTime @default(now())
  song             Song     @relation(fields: [song_id], references: [id], onDelete: Cascade)
}
```

**Sprint 2 additions:** `srs_cards`, `review_logs`, `vocab_cache`  
**Sprint 3 additions:** `language_profiles`, `user_language_profiles`, `word_frequencies`

---

## LRCLIB API Route

**Endpoint:** `GET /api/lyrics?track_name=Papaoutai&artist_name=Stromae&duration=233`

Proxies to `https://lrclib.net/api/get`. Free, no API key, ~3M songs.

**Response:**
```json
{
  "syncedLyrics": "[00:15.23]Hello world",
  "plainLyrics": "Hello world",
  "trackName": "Papaoutai",
  "artistName": "Stromae",
  "duration": 233
}
```

**Error codes:**
- 400 — missing `track_name` or `artist_name`
- 404 — LRCLIB returned 404 (song not found)
- 502 — LRCLIB returned non-404 error, or network failure

Cache: 24h via `next: { revalidate: 86400 }` on the fetch call.

---

## Testing

```bash
npm test                              # all 33 tests
npx jest LRCParser --no-coverage      # single suite
npx jest --no-coverage --watch        # watch mode
```

**Test environment notes:**
- Default: `jsdom` (configured in `jest.config.ts`)
- API route tests: add `/** @jest-environment node */` at top of file (NextRequest requires Web API globals)
- `requestAnimationFrame` is polyfilled as `setTimeout(cb, 16)` in `jest.setup.ts`
- `HTMLAudioElement` is mocked globally in `jest.setup.ts`

**Test suites:**

| Suite | Tests | Notes |
|---|---|---|
| LRCParser | 11 | Timestamp parsing, line/word interpolation, edge cases |
| SyncEngine | 8 | binarySearch, subscriber pattern, de-duplication |
| HTML5AudioAdapter | 8 | Bridge lifecycle, seek, event delegation |
| GET /api/lyrics | 6 | 400/404/502 errors, success, duration forwarding |

---

## Sprint Roadmap

| Sprint | Status | Goal |
|---|---|---|
| 1 — Foundation | **Complete** | Play song, sync word highlights, tap-to-seek |
| 2 — Learning Layer | Planned | Auth, AI word analysis (Claude), SRS deck + FSRS review |
| 3 — Multi-Language & Script | Planned | Japanese/Arabic/Chinese, romanization, CEFR scoring, YouTube adapter |
| 4 — Polish & Scale | Planned | Spotify adapter, Framer Motion, bundle audit, production deploy |

---

## Future Architecture (Sprints 2–4)

**Python microservice (FastAPI + Claude Sonnet 4.6):**
- `POST /detect-language` — franc/langdetect
- `POST /tokenize` — spaCy, MeCab (Japanese), jieba (Chinese)
- `POST /romanize` — pykakasi, pypinyin, arabic-transliterator
- `POST /analyze-word` — Claude Sonnet 4.6: phonetics, meaning, slang, register
- `POST /score-difficulty` — 3-signal composite (CEFR + WPM + grammar)

**Adding a new language** (Sprint 3+ plugin pattern):
1. Insert row in `language_profiles` table
2. Register tokenizer adapter in Python service
3. No core TypeScript changes required

**Adding a new media provider:**
1. Implement `MediaBridge` interface
2. Register adapter — no changes to SyncEngine, stores, or UI

---

## Known Limitations (Sprint 1)

- **No auth** — demo page is public, no user sessions
- **No live DB queries in UI** — LRC is hardcoded in `page.tsx` demo; `src/lib/db.ts` singleton exists and the seed populates demo data, but no route handlers query the DB yet (Sprint 2 wires this up)
- **HTML5 audio only** — YouTube and Spotify adapters are Sprint 3
- **Latin script only** — romanization and non-Latin rendering are Sprint 3
- **ScrollArea + scrollIntoView** — auto-scroll works in most browsers but may need a native `overflow-y-auto` div fallback if `ScrollArea`'s custom viewport blocks `scrollIntoView` in edge cases
- **No song browse page** — navigating to `/player/demo` is the only working route; `/player/[songId]` with a real songId requires the DB to have data

---

## GitHub

Repository: https://github.com/TKamar/LingoBeat  
Branch strategy:
- `main` — stable, merges from sprint-1 after sprint review
- `sprint-1` — all Sprint 1 work merged here; currently ahead of main
- `task-N-*` — individual task branches, merged into sprint-1 after two-stage review
