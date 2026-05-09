# LingoBeat Sprint 3 — Action Plan (Source of Truth)

> **Last updated:** 2026-05-09  
> **Branch strategy:** One feature branch per task group. Never commit directly to `main` or `sprint-3`.  
> **Status:** PLANNING COMPLETE — Ready for implementation  
> **HTML Previews:** `docs/previews/01-onboarding.html` through `04-cloze-review.html`  
> **Implementation Plan:** `docs/superpowers/plans/2026-05-09-sprint3-ux-overhaul.md`

---

## Vision

Transform LingoBeat from a functional prototype into a **Duolingo-caliber learning experience** — gamified, high-energy, animated, and mobile-first. Every screen should feel like it *wants* to be used.

**Design mandate:**
- Framer Motion transitions on every navigation event (already installed, zero usage in Sprint 2)
- XP economy: earn points for word analysis, deck saves, and review ratings
- Daily streak tracking: derived from `ReviewLog` history, visible on every screen
- CEFR word coloring in the player (A1=slate, A2=blue, B1=yellow, B2=orange, C1=red, C2=purple)
- Lyric cloze review: show the lyric line with a blank `___`, 4-choice answers from adjacent words

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| XP + Streak storage | Derived from `ReviewLog` at query time | No new DB tables; always in sync with review history |
| User preferences | `UserPreference` model in Prisma | Extends User without bloating the User model |
| Language list | Hardcoded in `src/lib/languages.ts` | 7 languages, no DB table needed |
| CEFR annotation | Python service endpoint `/annotate-cefr` | Reuses existing strategy pattern; runs at import time |
| Cloze distractors | Adjacent words from same `Lyrics.words` array | No external API; always contextually relevant |
| Navigation | Next.js App Router + Framer Motion `AnimatePresence` | No React Router needed; preserves server components |
| Bottom nav | Fixed-position React component in root layout | Consistent across all mobile screens |

---

## Branch Strategy

```
sprint-2 (base)
└── sprint-3 (integration branch — merge targets only)
    ├── feature/sprint3-app-shell          Task 1 — Bottom nav + page transitions
    ├── feature/sprint3-onboarding         Task 2 — Language selection + goal setting
    ├── feature/sprint3-gamification-api   Task 3+6 — Stats API + XP/streak engine
    ├── feature/sprint3-home-dashboard     Task 4 — Home with StreakRing + XPBar
    ├── feature/sprint3-discovery          Task 5 — Song discovery with filters
    ├── feature/sprint3-cloze-review       Task 7 — Lyric cloze review session
    ├── feature/sprint3-cefr-annotation    Task 8 — CEFR word coloring in player
    ├── feature/sprint3-player-polish      Task 9 — Framer Motion springs + karaoke
    └── feature/sprint3-profile            Task 10 — User profile page
```

**Rules:**
1. Always branch off `sprint-3`, never off `main`
2. Open PR to `sprint-3` when each feature branch is complete
3. Merge `sprint-3` → `main` only when all Sprint 3 tasks pass
4. Never force-push to `sprint-3` or `main`

---

## Milestone Overview

| # | Task | Branch | Status | Tests |
|---|---|---|---|---|
| 1 | App Shell + Navigation | `feature/sprint3-app-shell` | ⬜ TODO | BottomNav renders, active route highlights |
| 2 | Language Onboarding Flow | `feature/sprint3-onboarding` | ⬜ TODO | 7 languages shown, preference saved |
| 3 | User Stats API | `feature/sprint3-gamification-api` | ⬜ TODO | streak + XP derived correctly |
| 4 | Home Dashboard | `feature/sprint3-home-dashboard` | ⬜ TODO | Stats displayed, songs listed |
| 5 | Song Discovery Screen | `feature/sprint3-discovery` | ⬜ TODO | Language + level filters work |
| 6 | Gamification Layer | `feature/sprint3-gamification-api` | ⬜ TODO | XP awarded on review submit |
| 7 | Lyric Cloze Review | `feature/sprint3-cloze-review` | ⬜ TODO | Correct/wrong flow, XP awarded |
| 8 | CEFR Word Annotation | `feature/sprint3-cefr-annotation` | ⬜ TODO | Words colored by level in player |
| 9 | Player UX Polish | `feature/sprint3-player-polish` | ⬜ TODO | Springs, karaoke, page transitions |
| 10 | User Profile Page | `feature/sprint3-profile` | ⬜ TODO | Heatmap, stats, language list |

---

## Task 1: App Shell + Navigation

**Branch:** `feature/sprint3-app-shell`  
**HTML Preview:** n/a (referenced in `02-home-dashboard.html` footer nav)

### What We're Building
- `BottomNav` component: 5 tabs (Home, Discover, Player, Deck, Profile)
- Root layout wraps all pages in `<AnimatePresence>` for page transitions
- Each page gets an `<motion.div>` entry animation (fade + slide up, 200ms)
- `UserPreference` Prisma model for storing onboarding answers

### Files
| Action | File |
|---|---|
| Create | `src/components/BottomNav.tsx` |
| Create | `src/components/PageTransition.tsx` |
| Modify | `src/app/layout.tsx` — add BottomNav + AnimatePresence |
| Create | `prisma/migrations/..._user_preferences` |
| Modify | `prisma/schema.prisma` — add UserPreference model |

### UserPreference Schema
```prisma
model UserPreference {
  id              String   @id @default(uuid())
  user_id         String   @unique
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  target_language String   @default("fr")
  daily_goal_xp   Int      @default(20)
  onboarding_done Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}
```

### API
- `GET /api/user/preferences` — returns `{ target_language, daily_goal_xp, onboarding_done }`
- `PATCH /api/user/preferences` — updates any subset of fields

### Tests
- BottomNav renders with correct 5 tabs
- Active tab highlights for current pathname
- Preferences API: GET returns defaults for new user, PATCH updates correctly

---

## Task 2: Language Onboarding Flow

**Branch:** `feature/sprint3-onboarding`  
**HTML Preview:** `docs/previews/01-onboarding.html`

### What We're Building
- `/onboarding` page: 3-step wizard
  - Step 1: Pick target language (7 cards in 4+3 grid)
  - Step 2: Set daily goal (10 / 20 / 30 / 50 XP — tile buttons)
  - Step 3: "Let's go!" — saves preferences, redirects to `/`
- Middleware: redirect unauthenticated users away from `/onboarding`
- Post-login redirect: if `onboarding_done = false`, redirect to `/onboarding` from home

### Languages
```typescript
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
]
```

### Files
| Action | File |
|---|---|
| Create | `src/lib/languages.ts` |
| Create | `src/app/(onboarding)/onboarding/page.tsx` |
| Create | `src/app/(onboarding)/onboarding/LanguageStep.tsx` |
| Create | `src/app/(onboarding)/onboarding/GoalStep.tsx` |
| Modify | `src/middleware.ts` — add `/onboarding` to protected paths |
| Create | `src/app/api/user/preferences/route.ts` |

### Tests
- All 7 languages render
- Cannot proceed without selecting a language
- Preferences saved correctly on completion
- Redirected to `/` after completion

---

## Task 3: User Stats API

**Branch:** `feature/sprint3-gamification-api`  
**Shares branch with Task 6**

### What We're Building
- `GET /api/user/stats` — returns streak, XP, word count, level
- All values **derived from ReviewLog** — no new DB columns

### Stats Calculation Logic
```typescript
// XP: sum of rating values from ReviewLog
// Again=1, Hard=2, Good=3, Easy=4
const XP_MAP = { 1: 1, 2: 2, 3: 3, 4: 4 }
const totalXP = reviewLogs.reduce((sum, r) => sum + (XP_MAP[r.rating] ?? 0), 0)

// Streak: count consecutive days with at least 1 review, going back from today
// A "day" is UTC calendar date from reviewed_at

// Level: XP thresholds — level = floor(sqrt(totalXP / 10))
// Level 1 = 10 XP, Level 4 = 160 XP, Level 10 = 1000 XP

// Words: distinct SrsCard count for user
```

### Response Shape
```typescript
interface UserStats {
  streak_days: number
  total_xp: number
  level: number
  xp_to_next_level: number
  total_words: number
  today_xp: number
  daily_goal_xp: number
}
```

### Files
| Action | File |
|---|---|
| Create | `src/lib/engine/UserStatsEngine.ts` |
| Create | `src/app/api/user/stats/route.ts` |
| Create | `__tests__/app/api/user/stats.test.ts` |
| Create | `__tests__/lib/engine/UserStatsEngine.test.ts` |

### Tests
- Streak: 0 days for no reviews, 3 days for reviews on 3 consecutive days
- XP: sums ratings correctly, all 4 ratings tested
- Level thresholds: tested at boundary values
- Today XP: only counts reviews from today's UTC date

---

## Task 4: Home Dashboard

**Branch:** `feature/sprint3-home-dashboard`  
**HTML Preview:** `docs/previews/02-home-dashboard.html`

### What We're Building
- `/` home page (replaces any existing placeholder)
- `StreakRing` component — animated SVG ring showing current streak
- `XPBar` component — level progress bar with level badge
- `DailyGoalCard` component — progress bar for today's XP vs goal
- Featured songs horizontal scroll — top 4 songs from DB
- "Continue" card — last played song (from `ReviewLog` or first song)
- Greeting: "Bonjour/Bonsoir/Good morning" based on time of day

### Components
| Component | Description |
|---|---|
| `StreakRing` | SVG circle with `stroke-dashoffset` animation, flame icon center |
| `XPBar` | Linear progress bar, level badge left, XP numbers right |
| `DailyGoalCard` | Progress bar + motivational label, links to `/review` |
| `FeaturedSongs` | Horizontal scroll of `SongCard` tiles with language chip |
| `SongCard` | Song title, artist, language flag, "Play" button |

### Files
| Action | File |
|---|---|
| Create | `src/app/(home)/page.tsx` |
| Create | `src/components/stats/StreakRing.tsx` |
| Create | `src/components/stats/XPBar.tsx` |
| Create | `src/components/home/DailyGoalCard.tsx` |
| Create | `src/components/home/FeaturedSongs.tsx` |
| Create | `src/components/home/SongCard.tsx` |
| Modify | `src/app/api/songs/route.ts` — add `GET /api/songs?lang=fr&limit=4` |

---

## Task 5: Song Discovery Screen

**Branch:** `feature/sprint3-discovery`

### What We're Building
- `/discover` page — song grid with language + CEFR level filters
- `FilterBar` component — pill buttons for languages, CEFR level chips
- `SongGrid` — 2-column responsive grid of `SongCard` components
- `GET /api/songs` — supports `?lang=fr&level=B1&limit=20&cursor=<id>` pagination

### Filter State
- Language filter: multi-select, stored in URL params (`?lang=fr&lang=de`)
- Level filter: single-select (`?level=B1`)
- Cursor pagination for infinite scroll

### Files
| Action | File |
|---|---|
| Create | `src/app/(discover)/discover/page.tsx` |
| Create | `src/components/discover/FilterBar.tsx` |
| Create | `src/components/discover/SongGrid.tsx` |
| Create | `src/app/api/songs/route.ts` |
| Create | `__tests__/app/api/songs.test.ts` |

### Tests
- Songs filtered by language
- Songs filtered by level (once CEFR annotation is done — Task 8)
- Pagination cursor works correctly
- Empty state when no songs match filter

---

## Task 6: Gamification Layer

**Branch:** `feature/sprint3-gamification-api` (same as Task 3)

### What We're Building
- XP awarded automatically when a review is submitted (in `/api/srs/review`)
- `AchievementEngine` — checks for unlocked badges after each review
- Achievement types: First Word (1 card), Streak Week (7 days), Century (100 words), Polyglot (2+ languages)
- `UserAchievement` Prisma model

### Schema Addition
```prisma
model UserAchievement {
  id           String   @id @default(uuid())
  user_id      String
  user         User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  achievement  String   // "first_word" | "streak_week" | "century" | "polyglot"
  unlocked_at  DateTime @default(now())

  @@unique([user_id, achievement])
}
```

### Files
| Action | File |
|---|---|
| Create | `src/lib/engine/AchievementEngine.ts` |
| Modify | `src/app/api/srs/review/route.ts` — call AchievementEngine after $transaction |
| Create | `__tests__/lib/engine/AchievementEngine.test.ts` |
| Modify | `prisma/schema.prisma` — add UserAchievement |

### Tests
- `first_word` unlocked after first review
- `streak_week` unlocked after 7 consecutive days
- `century` unlocked at 100 distinct words
- Duplicate achievement not created (upsert-style)

---

## Task 7: Lyric Cloze Review

**Branch:** `feature/sprint3-cloze-review`  
**HTML Preview:** `docs/previews/04-cloze-review.html`

### What We're Building
- New review mode: `/review/cloze` — separate from the existing FSRS flashcard session
- `ClozeSession` component — shows lyric line with blank, 4-choice answers
- `ClozeCard` type — derived from `SrsCard` + `Lyrics.words` context
- `GET /api/srs/cloze-cards` — returns due cards enriched with lyric context + distractors
- Distractors: 3 adjacent words from the same lyric line (same position ± 5 words)

### Cloze Card Generation
```typescript
interface ClozeCard {
  card_id: string
  word: string       // correct answer (the blank)
  lyric_line: string // e.g. "Dis-moi ___ on va"
  choices: string[]  // [correct, distractor1, distractor2, distractor3] shuffled
  song_title: string
}
```

### Scoring
- Correct on first try: +5 XP
- Correct after hint: +2 XP
- Wrong: +0 XP, FSRS rating = Again (1)
- Correct: FSRS rating = Good (3)

### Files
| Action | File |
|---|---|
| Create | `src/app/(srs)/review/cloze/page.tsx` |
| Create | `src/app/(srs)/review/cloze/ClozeSession.tsx` |
| Create | `src/lib/engine/ClozeGenerator.ts` |
| Create | `src/app/api/srs/cloze-cards/route.ts` |
| Create | `__tests__/lib/engine/ClozeGenerator.test.ts` |
| Create | `__tests__/app/api/srs/cloze-cards.test.ts` |

### Tests
- Correct answer always in choices array
- Distractors are distinct from the correct answer
- Lyric line has `___` substituted at correct position
- XP awarded correctly for each outcome
- FSRS rating submitted on answer

---

## Task 8: CEFR Word Annotation

**Branch:** `feature/sprint3-cefr-annotation`

### What We're Building
- Python service endpoint `POST /annotate-cefr` — takes `{ words: string[], language: string }`, returns `{ word: string, cefr_level: string }[]`
- CEFR lookup uses Oxford 3000 / CEFR wordlist JSON bundled with the Python service
- `LyricWord.cefr_level` field already defined in TypeScript types — just needs population
- Import script (`scripts/import-song.ts`) calls `/annotate-cefr` after parsing LRC
- Player `WordToken` component reads `cefr_level` and applies CSS color class

### CEFR Color Mapping
```typescript
export const CEFR_COLORS: Record<string, string> = {
  A1: 'text-slate-400',
  A2: 'text-blue-400',
  B1: 'text-yellow-400',
  B2: 'text-orange-400',
  C1: 'text-red-400',
  C2: 'text-purple-400',
}
```

### Files
| Action | File |
|---|---|
| Create | `python-service/providers/cefr_annotator.py` |
| Modify | `python-service/main.py` — add `POST /annotate-cefr` route |
| Create | `python-service/data/cefr_wordlist.json` — Oxford 3000 CEFR levels |
| Modify | `src/components/WordToken.tsx` — apply CEFR color |
| Modify | `scripts/import-song.ts` — call `/annotate-cefr` after parseLRC |

### Tests
- Common A1 words classified correctly (e.g., "le", "je", "et")
- B1/B2 words from CEFR list recognized
- Unknown words return `null` (no crash)
- WordToken renders correct color class for each level

---

## Task 9: Player UX Polish

**Branch:** `feature/sprint3-player-polish`  
**HTML Preview:** `docs/previews/03-player.html`

### What We're Building
- Framer Motion springs on `WordPopover` open/close (scale + opacity)
- Active (playing) lyric word: blue glow + slight scale, animated with `useMotionValue`
- Page-level entry animation for `/player/[songId]`
- Seek bar animation: smooth progress with `motion.div` width transform
- Karaoke mode toggle: highlights the entire current line, not just the word

### Animations
```typescript
// WordPopover spring
const spring = { type: 'spring', damping: 20, stiffness: 300 }
<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>

// Active word pulse
<motion.span animate={{ scale: isActive ? 1.05 : 1, opacity: isActive ? 1 : 0.6 }} transition={{ duration: 0.15 }}>

// Seek bar
<motion.div style={{ width: useTransform(progress, [0, 1], ['0%', '100%']) }}>
```

### Files
| Action | File |
|---|---|
| Modify | `src/components/WordPopover.tsx` — Framer Motion spring |
| Modify | `src/components/WordToken.tsx` — active word animation |
| Modify | `src/components/LyricsView.tsx` — karaoke line highlight |
| Modify | `src/app/(player)/player/[songId]/page.tsx` — page entry animation |

### Tests
- WordPopover renders with motion wrapper
- Active word token has correct CSS state
- No visual regression in existing snapshot tests (if any)

---

## Task 10: User Profile Page

**Branch:** `feature/sprint3-profile`

### What We're Building
- `/profile` page — user's stats, language breakdown, achievements, 30-day activity heatmap
- `ActivityHeatmap` component — 30-day grid of review activity (CSS Grid, no external lib)
- Language cards — for each language the user has reviewed, show word count + streak
- Achievement badges — rendered from `UserAchievement` records
- Edit name + avatar color (stored in `UserPreference`)

### Components
| Component | Description |
|---|---|
| `ActivityHeatmap` | 30-day calendar grid, day intensity = XP earned that day |
| `LanguageCard` | Flag + language name, word count, last review date |
| `AchievementBadge` | Icon + label + unlock date |
| `ProfileHeader` | Avatar (initials + color), display name, edit button |

### Files
| Action | File |
|---|---|
| Create | `src/app/(profile)/profile/page.tsx` |
| Create | `src/components/profile/ActivityHeatmap.tsx` |
| Create | `src/components/profile/LanguageCard.tsx` |
| Create | `src/components/profile/AchievementBadge.tsx` |
| Create | `src/components/profile/ProfileHeader.tsx` |
| Modify | `src/middleware.ts` — protect `/profile` |
| Modify | `src/app/api/user/preferences/route.ts` — add name + avatar_color fields |

### Tests
- Heatmap renders 30 cells
- Language cards shown for each language with reviews
- Achievement badges shown for unlocked achievements
- Edit name form submits correctly

---

## API Surface (Sprint 3 New Endpoints)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/user/stats` | required | Streak, XP, level, word count |
| GET | `/api/user/preferences` | required | target_language, daily_goal_xp, onboarding_done |
| PATCH | `/api/user/preferences` | required | Update any preference field |
| GET | `/api/songs` | none | Song list with ?lang, ?level, ?limit, ?cursor filters |
| GET | `/api/srs/cloze-cards` | required | Due SRS cards enriched with lyric context + distractors |

---

## Framer Motion Patterns (Reference)

All animations use `framer-motion` v12.38.0 (already installed).

```typescript
// Page entry — add to every page root
<motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

// Card reveal (staggered list)
<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>

// Popover spring
<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
  transition={{ type: 'spring', damping: 20, stiffness: 300 }}>

// AnimatePresence (in root layout, wraps {children})
<AnimatePresence mode="wait">{children}</AnimatePresence>
```

---

## XP Economy (Reference)

| Action | XP |
|---|---|
| Word analysis (click word) | +1 |
| Save word to deck | +2 |
| Review: Again | +1 |
| Review: Hard | +2 |
| Review: Good | +3 |
| Review: Easy | +4 |
| Cloze: Correct first try | +5 |
| Cloze: Correct after hint | +2 |
| Daily login | +1 |

---

## Test Baseline

Sprint 2 ended with **71 tests, 0 failures**. Sprint 3 must not regress this. Each task adds its own tests; the final count should be **120+ tests**.

```powershell
cd C:\Projects\LingoBeat\lingobeat
npm test
```

---

## Resume Instructions

> "Sprint 3 planning is complete. HTML previews are in `docs/previews/`. The full implementation plan is at `docs/superpowers/plans/2026-05-09-sprint3-ux-overhaul.md`. This action plan is at `docs/sprint3_action_plan.md`. Start with Task 1 on branch `feature/sprint3-app-shell`. Base branch is `sprint-3` (branched from `sprint-2` after merging `feature/local-dev-infra`)."
