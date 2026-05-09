# LingoBeat Sprint 2 — Development Progress

> **Last updated:** 2026-05-09  
> **Branch:** `feature/sprint2-ui` merged → `sprint-2`; `feature/local-dev-infra` pushed  
> **GitHub:** [github.com/TKamar/LingoBeat](https://github.com/TKamar/LingoBeat)  
> **Status:** ✅ SPRINT 2 + LOCAL DEV INFRA COMPLETE — 71 tests passing, 0 TypeScript errors

---

## What We Built (Sprint 2)

The complete **learning layer** for LingoBeat:

- Google OAuth sign-in via NextAuth.js v5
- Click any lyric word → AI word analysis card (IPA, meaning, register, examples) inline between lyrics
- Two provider tiers: **Pro** (Claude Haiku) and **Free** (phonemizer + MyMemory, no API keys needed)
- Toggle between Pro/Free in the player header pill + profile settings
- Save words to a personal spaced-repetition (SRS) deck
- `/deck` page — 2-column rich card grid with Due/Scheduled badges
- `/review` — FSRS flashcard session with Again/Hard/Good/Easy rating

---

## Architecture

```
Next.js (port 3000)
  ├── /api/auth/[...nextauth]   — Google OAuth (NextAuth v5 + Prisma adapter)
  ├── /api/vocab/analyze        — proxy to Python service, per-user provider, 90-day cache
  ├── /api/user/settings        — GET/PATCH analysis_provider preference  
  ├── /api/srs/cards            — save/list SRS cards
  └── /api/srs/review           — submit FSRS rating (atomic $transaction)

Python FastAPI (port 8000) — Strategy + Registry pattern
  ├── POST /analyze-word
  ├── GET  /health / /providers
  └── Providers: haiku (Claude Haiku 4.5), sonnet (Claude Sonnet 4.6), free (phonemizer + MyMemory)

PostgreSQL (port 5433) — Docker
```

---

## All Tasks Complete ✅

| Task | Description | Key commits |
|------|-------------|-------------|
| 1 | DB Schema (SRS, VocabCache, NextAuth, analysis_provider) | `2579134`, `e069d83`, `0ef8541` |
| 2 | SRSScheduler (ts-fsrs v5 wrapper) | `b8f5fac`, `6febb81` |
| 3 | Authentication (NextAuth v5 Google OAuth) | `8ecf12e`, `0ef8541` |
| 4 | Python FastAPI microservice (pluggable providers) | `7c593ea`, `aee81b7` |
| 5 | vocab/analyze + user/settings APIs | `37f7843`, `bf85a8e`, `c0f3056` |
| 6 | SRS cards + review APIs | `4b501c9`, `3bc93fa` |
| 7 | WordPopover + ProviderToggle + player wiring | `45e4d33` |
| 8 | useSRSStore + /deck page | `006f6f0` |
| 9 | /review page + ReviewSession | `f19b771` |

---

## Running the App

```powershell
cd C:\Projects\LingoBeat\lingobeat

# 1. Start Docker (PostgreSQL + Python service)
docker compose up -d

# 2. Verify Python service
curl http://localhost:8000/health
# Expected: {"status":"ok","providers":[{"name":"haiku","tier":"pro"},{"name":"sonnet","tier":"pro"},{"name":"free","tier":"free"}]}

# 3. Start Next.js
npm run dev

# 4. Open http://localhost:3000/player/demo
```

## Required `.env` (in `lingobeat/.env`)

```env
DATABASE_URL="postgresql://lingobeat:lingobeat@127.0.0.1:5433/lingobeat"
AUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="<from Google Cloud Console>"
GOOGLE_CLIENT_SECRET="<from Google Cloud Console>"
ANTHROPIC_API_KEY="sk-ant-..."
PYTHON_SERVICE_URL="http://localhost:8000"
ANALYSIS_PROVIDER="haiku"
```

**Google OAuth setup:** Create OAuth 2.0 credentials at https://console.cloud.google.com  
Redirect URI: `http://localhost:3000/api/auth/callback/google`

---

## End-to-End Flow (Manual Test)

1. `docker compose up -d && npm run dev`
2. `/login` → sign in with Google
3. `/player/demo` → play song → tap "Dis-moi" → inline card expands with IPA + meaning
4. "Save to deck" → "✓ Saved to deck"
5. Toggle "Pro → Free" pill in player header
6. Tap another word → phonemizer IPA + MyMemory meaning (may show amber "Limited analysis" banner)
7. `/deck` → card grid with "Due now" badge
8. "Review N due →" → flashcard session → rate → "All done!"
9. `/deck` → card shows "Scheduled"

---

## Test Baseline

```powershell
cd C:\Projects\LingoBeat\lingobeat
npm test
```

Expected: **71 tests, 10 suites, 0 failures**

---

## Key Technical Constraints

| Constraint | Detail |
|---|---|
| Prisma 7 | Generator `"prisma-client"`, no `url` in datasource, import from `@/generated/prisma/client` |
| NextAuth v5 | `const session = await auth()` in server components; `session?.user?.id` is user ID |
| VocabCache | `context` defaults to `''` (not NULL) — PostgreSQL `NULL != NULL` breaks unique constraint |
| VocabCache | Uses `findFirst` + `expires_at: { gt: new Date() }` to filter stale entries |
| VocabCache | Uses `upsert` (not `create`) to handle concurrent cache-miss race conditions |
| SrsCard word | Lowercased at app layer before insert (`word.toLowerCase().trim()`) |
| SRS review | Uses `$transaction([srsCard.update, reviewLog.create])` — atomic, no partial state |
| SRSScheduler | `fromJSON` rehydrates `due` and `last_review` from string to `Date` after JSON.parse |
| ts-fsrs v5 | `fsrs().repeat(card, now)[Rating.X]` — ALL ratings (including Again) increment reps to 1 |
| WordPopover | Inline between lyric lines (not fixed/absolute) — lives in `LyricsView` after the matching line |
| ProviderToggle | Only renders for signed-in users (`useSession`); calls PATCH `/api/user/settings` |
| SessionProvider | Added via `src/components/Providers.tsx` in root layout |
| shadcn/ui | Uses `@base-ui/react` (NOT `@radix-ui`) |
| Python service | Uses `AsyncAnthropic`; API key validated lazily at `analyze()` call time |
| providers.ts | Shared `VALID_PROVIDERS` constant imported by both analyze and settings routes |

---

## File Map (Sprint 2 new/modified)

```
lingobeat/
├── prisma/
│   ├── schema.prisma            ✅ SRS, VocabCache, NextAuth, analysis_provider
│   └── seed.ts                  ✅ SRS seed card for dis-moi
├── src/
│   ├── auth.ts                  ✅ NextAuth v5 + Google + Prisma adapter
│   ├── middleware.ts             ✅ protects /deck, /review
│   ├── types/next-auth.d.ts     ✅ extends Session.user with id
│   ├── lib/
│   │   ├── providers.ts         ✅ shared VALID_PROVIDERS constant
│   │   ├── engine/
│   │   │   └── SRSScheduler.ts  ✅ ts-fsrs wrapper with date rehydration
│   │   └── stores/
│   │       └── useSRSStore.ts   ✅ Zustand store for deck state
│   ├── components/
│   │   ├── Providers.tsx        ✅ SessionProvider wrapper
│   │   ├── WordPopover.tsx      ✅ inline analysis card (is_partial banner, Save button)
│   │   ├── ProviderToggle.tsx   ✅ Pro/Free pill toggle
│   │   ├── WordToken.tsx        ✅ added onTap prop
│   │   └── LyricsView.tsx       ✅ renders WordPopover inline between lines
│   └── app/
│       ├── layout.tsx           ✅ wrapped in Providers (SessionProvider)
│       ├── login/page.tsx       ✅ Google sign-in server action
│       ├── api/
│       │   ├── auth/[...nextauth]/route.ts  ✅
│       │   ├── vocab/analyze/route.ts       ✅ per-user provider, 90d cache, upsert
│       │   ├── user/settings/route.ts       ✅ GET/PATCH analysis_provider
│       │   └── srs/
│       │       ├── cards/route.ts           ✅ GET due, POST upsert
│       │       └── review/route.ts          ✅ POST FSRS rating, $transaction
│       ├── (player)/player/[songId]/
│       │   ├── LyricsViewLoader.tsx         ✅ wires word tap → WordPopover + ProviderToggle
│       │   └── page.tsx                     ✅ added language_code to DEMO
│       └── (srs)/
│           ├── deck/page.tsx               ✅ 2-col rich grid, due/scheduled
│           └── review/
│               ├── page.tsx               ✅ auth guard, fetch due cards
│               └── ReviewSession.tsx      ✅ 4-button FSRS session
└── python-service/               ✅ (all files from Sprint 2)
```

---

## Local Dev Infrastructure (feature/local-dev-infra)

Built on top of Sprint 2, this branch adds everything needed to run the app locally without Google OAuth:

| Item | Detail |
|---|---|
| `role` field on User | `"user"` / `"pro"` / `"admin"` — gates provider access |
| 3 demo users | `user@test.dev` (free), `pro@test.dev` (haiku), `admin@test.dev` (all) |
| 4 demo songs | Papaoutai, Je veux, 99 Luftballons, Despacito — real lrclib.io lyrics |
| Dev login endpoint | `GET /api/dev/login-as?email=<email>` — creates a real DB session, disabled in prod |
| Role-based provider caps | PATCH `/api/user/settings` enforces `user→free`, `pro→haiku/free`, `admin→all` |
| DB-driven player | `/player/demo` and `/player/<uuid>` load song+lyrics from DB |
| Song import script | `npx tsx scripts/import-song.ts --title X --artist Y --lang fr --audio URL` |
| `docs/LOCAL_SETUP.md` | Full local dev guide |

**To start from scratch:**
```powershell
docker compose up -d
npx prisma migrate deploy
npx prisma db seed
npm run dev
# Login: http://localhost:3000/api/dev/login-as?email=pro@test.dev
```

---

## Remaining Considerations

- **ProviderToggle Option C** (profile/settings menu) — secondary access point, not yet built. Only the player header pill (Option A) is implemented.
- **No song title in deck** — `context_song` is stored as a song UUID; deck shows generic label without the actual title (requires DB join to `Song`, deferred to Sprint 3).
- **Review lyric context** — flashcard shows `___` without the surrounding lyric line (SrsCard doesn't store full lyric context). Sprint 3 enhancement.
- **Admin UI** — `/admin` is protected but no admin page exists yet. Sprint 3 or later.

---

## Resume Instructions

If picking up this work in a future session:

> "Sprint 2 of LingoBeat is complete (71 tests, 0 TS errors). `feature/sprint2-ui` has been merged into `sprint-2`. Local dev infrastructure is on `feature/local-dev-infra` (role field, dev login, demo users/songs, DB-driven player, song import script). Next step: merge `feature/local-dev-infra` into `sprint-2`, then begin Sprint 3. See `docs/superpowers/specs/` for Sprint 3 design context and `docs/LOCAL_SETUP.md` for running the app locally."
