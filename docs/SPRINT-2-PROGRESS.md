# LingoBeat Sprint 2 — Development Progress

> **Last updated:** 2026-05-08  
> **Branch:** `sprint-2` on [github.com/TKamar/LingoBeat](https://github.com/TKamar/LingoBeat)  
> **Status:** 4 of 9 tasks complete — paused after Task 4

---

## What We Are Building (Sprint 2 Goal)

Add the **learning layer** to LingoBeat:
- Google OAuth sign-in via NextAuth.js v5
- Click any lyric word → AI analysis popover (IPA, meaning, register, examples)
- Two provider tiers: **Pro** (Claude Haiku — paid) and **Free** (phonemizer + MyMemory — no API keys)
- Save words to a personal spaced-repetition (SRS) deck
- Review due cards with Again / Hard / Good / Easy ratings (ts-fsrs algorithm)
- Per-user provider preference stored in DB; toggle in the player UI

---

## Architecture Overview

```
Next.js (port 3000)
  ├── /api/auth/[...nextauth]   — Google OAuth (NextAuth v5 + Prisma adapter)
  ├── /api/vocab/analyze        — proxy to Python service, per-user provider, 90-day cache
  ├── /api/user/settings        — GET/PATCH analysis_provider preference
  ├── /api/srs/cards            — save/list SRS cards
  └── /api/srs/review           — submit FSRS rating

Python FastAPI (port 8000) — pluggable provider architecture
  ├── POST /analyze-word        — dispatches to registered provider
  ├── GET  /health              — lists all providers
  └── Providers: haiku (Claude), sonnet (Claude), free (phonemizer + MyMemory)

PostgreSQL (port 5433) — Docker, container: lingobeat-postgres-1
```

---

## Progress: Tasks Completed ✅

### Task 1: DB Schema Extension ✅
**Commits:** `2579134`, `e069d83`  
**Files:** `prisma/schema.prisma`, `prisma/seed.ts`, migration files

Added to schema:
- `User.analysis_provider String @default("haiku")` + `emailVerified`, `image` for NextAuth
- NextAuth adapter tables: `Account`, `Session`, `VerificationToken`
- `UserLanguageProfile` — per-user language state
- `SrsCard` with `@@unique([user_id, language_code, word])` and `@@index([user_id, next_review_at])`
- `ReviewLog` with BigInt autoincrement ID
- `VocabCache` with per-provider unique key `@@unique([language_code, word, context, provider])`, 90-day TTL via `dbgenerated`, `@@index([expires_at])`

Migration applied: `sprint2-learning-layer` + `sprint2-add-srs-vocabcache-indexes` + `add-user-emailverified-image`

Seed updated with demo SRS card for `dis-moi` (fixed ID `a1b2c3d4-0000-0000-0000-000000000010`).

---

### Task 2: SRS Scheduler ✅
**Commits:** `b8f5fac`, `cd0cb25`, `6febb81`  
**Files:** `src/lib/engine/SRSScheduler.ts`, `__tests__/lib/engine/SRSScheduler.test.ts`

`SRSScheduler` class wrapping ts-fsrs v5:
- `createCard()` — new blank FSRS card
- `schedule(card, rating)` — returns `{ card, nextReview }` (ratings 1–4: Again/Hard/Good/Easy)
- `fromJSON(state)` — restores card from DB JSON, returns new card if state empty/corrupt

8 tests passing. TypeScript cast fixed: `Rating.Again | Rating.Hard | Rating.Good | Rating.Easy` to exclude `Rating.Manual = 0`.

---

### Task 3: Authentication ✅
**Commits:** `8ecf12e`, `0ef8541`  
**Files:** `src/auth.ts`, `src/middleware.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`, `src/types/next-auth.d.ts`

- NextAuth v5 with Google OAuth, Prisma adapter, database session strategy
- Session callback injects `user.id` into the session
- Middleware protects `/deck` and `/review` — redirects to `/login` when unauthenticated
- Login page: server component with Server Action calling `signIn('google')`
- `src/types/next-auth.d.ts` extends `Session.user` with `id: string`
- `.env.example` uses `AUTH_SECRET` (v5 canonical name)
- User model fixed: added `emailVerified DateTime?` and `image String?` for NextAuth adapter

**To complete auth setup:** Google Cloud Console OAuth 2.0 credentials needed. Redirect URI: `http://localhost:3000/api/auth/callback/google`. Add to `.env`: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

---

### Task 4: Python FastAPI Microservice ✅
**Commits:** `7c593ea`, `aee81b7`  
**Files:** `python-service/` (10 new files) + `docker-compose.yml` + `.env.example`

Provider architecture (Strategy + Registry pattern):
- `providers/base.py` — `WordAnalysis` Pydantic model + `WordAnalysisProvider` ABC
- `providers/registry.py` — `ProviderRegistry` singleton
- `providers/claude.py` — `ClaudeProvider` (async, lazy API key); `haiku_provider` + `sonnet_provider`
- `providers/free.py` — `FreeProvider` (phonemizer IPA + MyMemory translation, never raises)
- `routers/analyze.py` — `POST /analyze-word` with 400/502 error handling
- `main.py` — registers all 3 providers, `/health`, `/providers` endpoints
- `Dockerfile` — `python:3.12-slim` + `espeak-ng`

**Running:** `docker compose up python-service -d`  
**Verify:** `curl http://localhost:8000/health`  
Expected: `{"status":"ok","providers":[{"name":"haiku","tier":"pro"},{"name":"sonnet","tier":"pro"},{"name":"free","tier":"free"}]}`

---

## Remaining Tasks 🔲

### Task 5: Word Analysis API + User Settings API
**Files to create:**
- `src/app/api/vocab/analyze/route.ts` — reads user's `analysis_provider` from DB, checks per-provider cache, calls Python service, caches result
- `src/app/api/user/settings/route.ts` — GET/PATCH `analysis_provider` preference

**Tests:**
- `__tests__/app/api/vocab/analyze.test.ts` (5 tests)
- `__tests__/app/api/user/settings.test.ts` (4 tests)

---

### Task 6: SRS Cards API
**Files to create:**
- `src/app/api/srs/cards/route.ts` — GET (due cards for user), POST (upsert card)
- `src/app/api/srs/review/route.ts` — POST (submit FSRS rating, update card state)

**Tests:**
- `__tests__/app/api/srs/cards.test.ts` (3 tests)
- `__tests__/app/api/srs/review.test.ts` (4 tests)

---

### Task 7: WordPopover + ProviderToggle Components
**Files to create/modify:**
- `src/components/WordPopover.tsx` — slide-up panel, IPA/meaning/examples, amber banner when `is_partial: true`, Save button
- `src/components/ProviderToggle.tsx` — Free/Pro pill toggle, calls PATCH /api/user/settings
- **Modify:** `src/components/WordToken.tsx` — add `onTap` prop
- **Modify:** `src/components/LyricsView.tsx` — add `languageCode` + `onWordTap` props
- **Modify:** `src/app/(player)/player/[songId]/LyricsViewLoader.tsx` — wire popover + toggle

**Tests:**
- `__tests__/components/WordPopover.test.tsx` (6 tests)

---

### Task 8: useSRSStore + /deck Page
**Files to create:**
- `src/lib/stores/useSRSStore.ts` — Zustand store for deck state
- `src/app/(srs)/deck/page.tsx` — authenticated server component, lists cards with Due/Scheduled badges

---

### Task 9: /review Page (FSRS Session)
**Files to create:**
- `src/app/(srs)/review/ReviewSession.tsx` — client component with card flip + Again/Hard/Good/Easy buttons
- `src/app/(srs)/review/page.tsx` — server component, fetches due cards, renders ReviewSession

---

## How to Resume Development

### 1. Environment setup

```bash
# Start Docker services
cd C:\Projects\LingoBeat\lingobeat
docker compose up -d

# Verify DB is running
docker exec lingobeat-postgres-1 psql -U lingobeat -d lingobeat -c "\dt"

# Verify Python service
curl http://localhost:8000/health

# Start Next.js
npm run dev
```

### 2. Required `.env` values (in `lingobeat/.env`)

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

### 3. Git workflow

- Branch: `sprint-2`
- Push to GitHub after each task: `git push origin sprint-2`
- Full plan file: `C:\Users\TK\.claude\plans\act-as-a-senior-distributed-conway.md`

### 4. Resume instruction for AI assistant

> "Resume Sprint 2 development on LingoBeat. See `docs/SPRINT-2-PROGRESS.md` for current state. Tasks 1–4 are complete and pushed to `sprint-2` branch on GitHub. Continue from Task 5 using subagent-driven development with two-stage review per task."

### 5. Test baseline

```bash
cd C:\Projects\LingoBeat\lingobeat
npm test
```

Expected: **41 tests passing** (5 test suites) before starting Task 5.

---

## Key Technical Constraints to Remember

| Constraint | Detail |
|---|---|
| Prisma 7 | Generator `"prisma-client"`, no `url` in datasource, import from `@/generated/prisma/client`, `new PrismaClient({ adapter })` |
| NextAuth v5 | `const session = await auth()` in server components; `session?.user?.id` is user ID |
| VocabCache | `context` defaults to `''` (not NULL) — PostgreSQL `NULL != NULL` breaks unique constraint |
| SrsCard word | Must be lowercased at app layer before insert (collation is case-sensitive) |
| ts-fsrs v5 | `fsrs().repeat(card, now)[Rating.Again].card.reps === 1` for all ratings |
| shadcn/ui | Uses `@base-ui/react` (NOT `@radix-ui`) |
| Python service | Uses `AsyncAnthropic` (non-blocking); API key validated lazily at `analyze()` call |

---

## File Map (Sprint 2 new/modified files)

```
lingobeat/
├── prisma/
│   ├── schema.prisma          ✅ extended with SRS, VocabCache, NextAuth tables
│   └── seed.ts                ✅ added SRS card seed
├── src/
│   ├── auth.ts                ✅ NextAuth v5 config
│   ├── middleware.ts           ✅ protects /deck, /review
│   ├── types/
│   │   └── next-auth.d.ts     ✅ extends Session.user with id
│   ├── lib/
│   │   └── engine/
│   │       └── SRSScheduler.ts ✅ ts-fsrs wrapper
│   └── app/
│       ├── api/
│       │   ├── auth/[...nextauth]/route.ts  ✅
│       │   ├── vocab/analyze/route.ts       🔲 Task 5
│       │   ├── user/settings/route.ts       🔲 Task 5
│       │   └── srs/
│       │       ├── cards/route.ts           🔲 Task 6
│       │       └── review/route.ts          🔲 Task 6
│       ├── login/page.tsx     ✅
│       └── (srs)/
│           ├── deck/page.tsx               🔲 Task 8
│           └── review/
│               ├── page.tsx                🔲 Task 9
│               └── ReviewSession.tsx       🔲 Task 9
├── components/
│   ├── WordPopover.tsx         🔲 Task 7
│   └── ProviderToggle.tsx      🔲 Task 7
└── python-service/             ✅ Task 4 (all files)
```
