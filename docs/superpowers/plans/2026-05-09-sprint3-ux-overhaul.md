# Sprint 3 UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform LingoBeat into a Duolingo-caliber gamified learning experience with bottom navigation, page transitions, XP economy, daily streaks, CEFR word coloring, lyric cloze review, and a full user profile.

**Architecture overview:** Framer Motion v12 (already installed) for all animations; XP + streak derived from existing `ReviewLog` table at query time (no new DB columns); CEFR annotation via Python service extension; all new UI uses existing shadcn/ui + Tailwind conventions from Sprint 2.

**Tech Stack:** Next.js 15, Prisma 7, NextAuth v5, Framer Motion 12.38.0, ts-fsrs v5, Tailwind CSS, Python FastAPI, TypeScript

**Branch Strategy:**
- Base: `sprint-3` (branched from `sprint-2` after merging `feature/local-dev-infra`)
- One feature branch per task group — branch off `sprint-3`, PR back to `sprint-3`
- See `docs/sprint3_action_plan.md` for full branch map

---

## Critical Constraints (read before every task)

| Constraint | Detail |
|---|---|
| Prisma 7 | `import from '@/generated/prisma/client'`, `new PrismaClient({ adapter })`, no `url` in datasource |
| NextAuth v5 | `const session = await auth()` in server components; `session?.user?.id` is user ID |
| Edge Runtime | Middleware CANNOT import `db` / Prisma. Auth check only in middleware. Role checks in server components. |
| Framer Motion 12 | Already in `package.json`. Import: `import { motion, AnimatePresence } from 'framer-motion'` |
| shadcn/ui | Uses `@base-ui/react` (NOT `@radix-ui`) |
| Next.js 15 params | `params` is a `Promise<{ ... }>` — must `await params` before destructuring |
| CEFR colors | A1=slate-400, A2=blue-400, B1=yellow-400, B2=orange-400, C1=red-400, C2=purple-400 |

---

### Task 1: App Shell — Bottom Navigation + Page Transitions + UserPreference Schema

**Branch:** `feature/sprint3-app-shell`

**Files:**
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/PageTransition.tsx`
- Create: `src/app/api/user/preferences/route.ts`
- Modify: `src/app/layout.tsx`
- Modify: `prisma/schema.prisma`
- Create: `__tests__/components/BottomNav.test.tsx`
- Create: `__tests__/app/api/user/preferences.test.ts`

- [ ] **Step 1: Create git branch**

```powershell
cd C:\Projects\LingoBeat\lingobeat
git checkout sprint-3
git pull
git checkout -b feature/sprint3-app-shell
```

Expected: now on `feature/sprint3-app-shell`.

- [ ] **Step 2: Add UserPreference model to schema**

In `prisma/schema.prisma`, after the `User` model, add:

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

Also add the reverse relation to the `User` model:
```prisma
  preference        UserPreference?
```

- [ ] **Step 3: Run migration**

```powershell
npx prisma migrate dev --name add-user-preferences
```

Expected: migration file created, Prisma client regenerated.

- [ ] **Step 4: Write failing tests for BottomNav**

Create `__tests__/components/BottomNav.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/BottomNav'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

describe('BottomNav', () => {
  it('renders all 5 navigation tabs', () => {
    (usePathname as jest.Mock).mockReturnValue('/')
    render(<BottomNav />)
    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Discover')).toBeInTheDocument()
    expect(screen.getByLabelText('Player')).toBeInTheDocument()
    expect(screen.getByLabelText('Deck')).toBeInTheDocument()
    expect(screen.getByLabelText('Profile')).toBeInTheDocument()
  })

  it('marks the active tab based on current pathname', () => {
    (usePathname as jest.Mock).mockReturnValue('/deck')
    render(<BottomNav />)
    const deckTab = screen.getByLabelText('Deck')
    expect(deckTab.closest('[data-active="true"]')).not.toBeNull()
  })

  it('does not mark other tabs as active when on /deck', () => {
    (usePathname as jest.Mock).mockReturnValue('/deck')
    render(<BottomNav />)
    const homeTab = screen.getByLabelText('Home')
    expect(homeTab.closest('[data-active="true"]')).toBeNull()
  })
})
```

- [ ] **Step 5: Run tests to verify they fail**

```powershell
npx jest __tests__/components/BottomNav.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/BottomNav'`.

- [ ] **Step 6: Implement BottomNav**

Create `src/components/BottomNav.tsx`:

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Music2, BookOpen, User } from 'lucide-react'

const TABS = [
  { href: '/',          label: 'Home',     Icon: Home },
  { href: '/discover',  label: 'Discover', Icon: Compass },
  { href: '/player',    label: 'Player',   Icon: Music2 },
  { href: '/deck',      label: 'Deck',     Icon: BookOpen },
  { href: '/profile',   label: 'Profile',  Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-t border-slate-800">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              data-active={isActive}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 7: Implement PageTransition wrapper**

Create `src/components/PageTransition.tsx`:

```typescript
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex-1"
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 8: Write failing tests for preferences API**

Create `__tests__/app/api/user/preferences.test.ts`:

```typescript
import { GET, PATCH } from '@/app/api/user/preferences/route'
import { auth } from '@/auth'
import { db } from '@/lib/db'

jest.mock('@/auth')
jest.mock('@/lib/db', () => ({
  db: {
    userPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockDb = db as jest.Mocked<typeof db>

describe('GET /api/user/preferences', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/user/preferences'))
    expect(res.status).toBe(401)
  })

  it('returns defaults when no preference exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.userPreference.findUnique = jest.fn().mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/user/preferences'))
    const body = await res.json()
    expect(body.target_language).toBe('fr')
    expect(body.daily_goal_xp).toBe(20)
    expect(body.onboarding_done).toBe(false)
  })

  it('returns saved preference when it exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.userPreference.findUnique = jest.fn().mockResolvedValue({
      target_language: 'es',
      daily_goal_xp: 30,
      onboarding_done: true,
    })
    const res = await GET(new Request('http://localhost/api/user/preferences'))
    const body = await res.json()
    expect(body.target_language).toBe('es')
    expect(body.onboarding_done).toBe(true)
  })
})

describe('PATCH /api/user/preferences', () => {
  it('updates preference and returns updated record', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.userPreference.upsert = jest.fn().mockResolvedValue({
      target_language: 'ja',
      daily_goal_xp: 20,
      onboarding_done: false,
    })
    const req = new Request('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ target_language: 'ja' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.target_language).toBe('ja')
  })
})
```

- [ ] **Step 9: Run tests to verify they fail**

```powershell
npx jest __tests__/app/api/user/preferences.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 10: Implement preferences API route**

Create `src/app/api/user/preferences/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const DEFAULTS = { target_language: 'fr', daily_goal_xp: 20, onboarding_done: false }

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pref = await db.userPreference.findUnique({
    where: { user_id: session.user.id },
    select: { target_language: true, daily_goal_xp: true, onboarding_done: true },
  })
  return NextResponse.json(pref ?? DEFAULTS)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const allowed = ['target_language', 'daily_goal_xp', 'onboarding_done']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const pref = await db.userPreference.upsert({
    where: { user_id: session.user.id },
    update: data,
    create: { user_id: session.user.id, ...DEFAULTS, ...data },
    select: { target_language: true, daily_goal_xp: true, onboarding_done: true },
  })
  return NextResponse.json(pref)
}
```

- [ ] **Step 11: Update root layout with BottomNav + AnimatePresence**

Read `src/app/layout.tsx`, then add BottomNav and AnimatePresence:

```typescript
// Add to imports:
import { BottomNav } from '@/components/BottomNav'
import { AnimatePresence } from 'framer-motion'

// Wrap children inside <Providers>:
<body className="...">
  <Providers>
    <AnimatePresence mode="wait">
      <div className="min-h-screen pb-16">
        {children}
      </div>
    </AnimatePresence>
    <BottomNav />
  </Providers>
</body>
```

- [ ] **Step 12: Run all tests**

```powershell
npx jest --no-coverage
```

Expected: All prior tests pass + new tests pass.

- [ ] **Step 13: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations src/components/BottomNav.tsx src/components/PageTransition.tsx src/app/api/user/preferences/route.ts src/app/layout.tsx __tests__/components/BottomNav.test.tsx __tests__/app/api/user/preferences.test.ts
git commit -m "feat(shell): bottom nav, page transitions, UserPreference schema + API"
```

---

### Task 2: Language Onboarding Flow

**Branch:** `feature/sprint3-onboarding` (branch off `feature/sprint3-app-shell` or `sprint-3`)

**Files:**
- Create: `src/lib/languages.ts`
- Create: `src/app/(onboarding)/onboarding/page.tsx`
- Create: `src/app/(onboarding)/onboarding/LanguageStep.tsx`
- Create: `src/app/(onboarding)/onboarding/GoalStep.tsx`
- Modify: `src/middleware.ts`
- Create: `__tests__/app/onboarding/LanguageStep.test.tsx`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-onboarding
```

- [ ] **Step 2: Create language constants**

Create `src/lib/languages.ts`:

```typescript
export const LANGUAGES = [
  { code: 'en', name: 'English',  flag: '🇬🇧' },
  { code: 'es', name: 'Spanish',  flag: '🇪🇸' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian',  flag: '🇷🇺' },
  { code: 'fr', name: 'French',   flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic',   flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese',  flag: '🇨🇳' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const
```

- [ ] **Step 3: Write failing tests for LanguageStep**

Create `__tests__/app/onboarding/LanguageStep.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageStep } from '@/app/(onboarding)/onboarding/LanguageStep'

describe('LanguageStep', () => {
  it('renders all 7 language cards', () => {
    render(<LanguageStep selected={null} onSelect={jest.fn()} />)
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Spanish')).toBeInTheDocument()
    expect(screen.getByText('Japanese')).toBeInTheDocument()
    expect(screen.getByText('Russian')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
    expect(screen.getByText('Arabic')).toBeInTheDocument()
    expect(screen.getByText('Chinese')).toBeInTheDocument()
  })

  it('calls onSelect with language code when a card is clicked', () => {
    const onSelect = jest.fn()
    render(<LanguageStep selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('French'))
    expect(onSelect).toHaveBeenCalledWith('fr')
  })

  it('shows selected state for the chosen language', () => {
    render(<LanguageStep selected="fr" onSelect={jest.fn()} />)
    const frenchCard = screen.getByText('French').closest('[data-selected]')
    expect(frenchCard).toHaveAttribute('data-selected', 'true')
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

```powershell
npx jest __tests__/app/onboarding/LanguageStep.test.tsx --no-coverage
```

Expected: FAIL.

- [ ] **Step 5: Implement LanguageStep**

Create `src/app/(onboarding)/onboarding/LanguageStep.tsx`:

```typescript
'use client'
import { motion } from 'framer-motion'
import { LANGUAGES, LanguageCode } from '@/lib/languages'

interface Props {
  selected: LanguageCode | null
  onSelect: (code: LanguageCode) => void
}

export function LanguageStep({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3 w-full">
      {LANGUAGES.map((lang, i) => (
        <motion.button
          key={lang.code}
          data-selected={selected === lang.code}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(lang.code)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
            selected === lang.code
              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          } ${i >= 4 ? 'col-start-auto' : ''}`}
        >
          <span className="text-3xl">{lang.flag}</span>
          <span className="text-sm font-medium text-slate-200">{lang.name}</span>
          {selected === lang.code && (
            <span className="text-blue-400 text-xs">✓</span>
          )}
        </motion.button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Implement GoalStep**

Create `src/app/(onboarding)/onboarding/GoalStep.tsx`:

```typescript
'use client'
import { motion } from 'framer-motion'
import { DAILY_GOAL_OPTIONS } from '@/lib/languages'

interface Props {
  selected: number
  onSelect: (xp: number) => void
}

const GOAL_LABELS: Record<number, string> = {
  10: 'Casual',
  20: 'Regular',
  30: 'Serious',
  50: 'Intense',
}

export function GoalStep({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {DAILY_GOAL_OPTIONS.map((xp, i) => (
        <motion.button
          key={xp}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => onSelect(xp)}
          className={`flex flex-col items-center gap-1 p-5 rounded-2xl border transition-all ${
            selected === xp
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <span className="text-2xl font-bold text-slate-100">{xp} XP</span>
          <span className="text-sm text-slate-400">{GOAL_LABELS[xp]}</span>
        </motion.button>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Implement onboarding page**

Create `src/app/(onboarding)/onboarding/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LanguageStep } from './LanguageStep'
import { GoalStep } from './GoalStep'
import type { LanguageCode } from '@/lib/languages'

const STEPS = ['language', 'goal', 'done'] as const

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState<LanguageCode | null>(null)
  const [goal, setGoal] = useState(20)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleFinish() {
    setSaving(true)
    await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_language: language, daily_goal_xp: goal, onboarding_done: true }),
    })
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      {/* Step dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-blue-400' : 'bg-slate-700'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="lang" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-slate-100 mb-2 text-center">What do you want to learn?</h1>
            <p className="text-slate-400 text-center mb-8">Pick your target language</p>
            <LanguageStep selected={language} onSelect={setLanguage} />
            <button
              disabled={!language}
              onClick={() => setStep(1)}
              className="mt-8 w-full py-3 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 transition-opacity"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="goal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-slate-100 mb-2 text-center">Set your daily goal</h1>
            <p className="text-slate-400 text-center mb-8">How much do you want to practice?</p>
            <GoalStep selected={goal} onSelect={setGoal} />
            <button
              onClick={handleFinish}
              disabled={saving}
              className="mt-8 w-full py-3 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40"
            >
              {saving ? 'Saving...' : "Let's go! 🚀"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
```

- [ ] **Step 8: Add /onboarding to middleware protections**

Read `src/middleware.ts`, then update the matcher to include `/onboarding`:

```typescript
export const config = {
  matcher: ['/deck/:path*', '/review/:path*', '/admin/:path*', '/onboarding/:path*', '/profile/:path*'],
}
```

- [ ] **Step 9: Run tests**

```powershell
npx jest __tests__/app/onboarding --no-coverage
```

Expected: all new tests pass.

- [ ] **Step 10: Commit**

```powershell
git add src/lib/languages.ts "src/app/(onboarding)" src/middleware.ts __tests__/app/onboarding
git commit -m "feat(onboarding): 7-language selection, daily goal setting, 3-step wizard"
```

---

### Task 3: User Stats API + UserStatsEngine

**Branch:** `feature/sprint3-gamification-api`

**Files:**
- Create: `src/lib/engine/UserStatsEngine.ts`
- Create: `src/app/api/user/stats/route.ts`
- Create: `__tests__/lib/engine/UserStatsEngine.test.ts`
- Create: `__tests__/app/api/user/stats.test.ts`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-gamification-api
```

- [ ] **Step 2: Write failing tests for UserStatsEngine**

Create `__tests__/lib/engine/UserStatsEngine.test.ts`:

```typescript
import { computeStreak, computeXP, computeLevel, computeTodayXP } from '@/lib/engine/UserStatsEngine'

const day = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(12, 0, 0, 0) // noon UTC to avoid timezone edge cases
  return d
}

describe('computeXP', () => {
  it('returns 0 for empty log', () => expect(computeXP([])).toBe(0))
  it('sums ratings correctly: Again=1, Hard=2, Good=3, Easy=4', () => {
    const logs = [{ rating: 1 }, { rating: 2 }, { rating: 3 }, { rating: 4 }] as any
    expect(computeXP(logs)).toBe(10)
  })
})

describe('computeStreak', () => {
  it('returns 0 for no reviews', () => expect(computeStreak([])).toBe(0))

  it('returns 1 for reviews only today', () => {
    const logs = [{ reviewed_at: day(0) }] as any
    expect(computeStreak(logs)).toBe(1)
  })

  it('returns 3 for reviews on 3 consecutive days', () => {
    const logs = [
      { reviewed_at: day(0) },
      { reviewed_at: day(1) },
      { reviewed_at: day(2) },
    ] as any
    expect(computeStreak(logs)).toBe(3)
  })

  it('breaks streak if a day is missed', () => {
    const logs = [
      { reviewed_at: day(0) },
      { reviewed_at: day(2) }, // day 1 is missing
    ] as any
    expect(computeStreak(logs)).toBe(1)
  })
})

describe('computeLevel', () => {
  it('level 1 at 0 XP', () => expect(computeLevel(0).level).toBe(1))
  it('level 2 at 10 XP', () => expect(computeLevel(10).level).toBe(2))
  it('level 4 at 90 XP', () => expect(computeLevel(90).level).toBe(4))
})

describe('computeTodayXP', () => {
  it('counts only reviews from today', () => {
    const logs = [
      { reviewed_at: day(0), rating: 3 },
      { reviewed_at: day(1), rating: 4 }, // yesterday — excluded
    ] as any
    expect(computeTodayXP(logs)).toBe(3)
  })
})
```

- [ ] **Step 3: Run to verify failure**

```powershell
npx jest __tests__/lib/engine/UserStatsEngine.test.ts --no-coverage
```

Expected: FAIL.

- [ ] **Step 4: Implement UserStatsEngine**

Create `src/lib/engine/UserStatsEngine.ts`:

```typescript
const XP_MAP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4 }

interface ReviewLogMinimal {
  reviewed_at: Date
  rating: number
}

export function computeXP(logs: ReviewLogMinimal[]): number {
  return logs.reduce((sum, r) => sum + (XP_MAP[r.rating] ?? 0), 0)
}

export function computeTodayXP(logs: ReviewLogMinimal[]): number {
  const todayStr = new Date().toISOString().slice(0, 10)
  return logs
    .filter(r => new Date(r.reviewed_at).toISOString().slice(0, 10) === todayStr)
    .reduce((sum, r) => sum + (XP_MAP[r.rating] ?? 0), 0)
}

export function computeStreak(logs: ReviewLogMinimal[]): number {
  if (logs.length === 0) return 0

  const uniqueDays = [...new Set(
    logs.map(r => new Date(r.reviewed_at).toISOString().slice(0, 10))
  )].sort().reverse()

  const today = new Date().toISOString().slice(0, 10)
  if (uniqueDays[0] !== today) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function computeLevel(xp: number): { level: number; xpToNext: number } {
  // Level thresholds: 1=0, 2=10, 3=40, 4=90, 5=160, n=((n-1)^2)*10
  let level = 1
  while (xp >= level * level * 10) level++
  const xpToNext = level * level * 10 - xp
  return { level, xpToNext }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```powershell
npx jest __tests__/lib/engine/UserStatsEngine.test.ts --no-coverage
```

Expected: All pass.

- [ ] **Step 6: Write failing tests for stats API**

Create `__tests__/app/api/user/stats.test.ts`:

```typescript
import { GET } from '@/app/api/user/stats/route'
import { auth } from '@/auth'
import { db } from '@/lib/db'

jest.mock('@/auth')
jest.mock('@/lib/db', () => ({
  db: {
    reviewLog: { findMany: jest.fn() },
    srsCard: { count: jest.fn() },
    userPreference: { findUnique: jest.fn() },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockDb = db as jest.Mocked<typeof db>

describe('GET /api/user/stats', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/user/stats'))
    expect(res.status).toBe(401)
  })

  it('returns stats for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.reviewLog.findMany = jest.fn().mockResolvedValue([
      { reviewed_at: new Date(), rating: 3 },
      { reviewed_at: new Date(), rating: 4 },
    ])
    mockDb.srsCard.count = jest.fn().mockResolvedValue(5)
    mockDb.userPreference.findUnique = jest.fn().mockResolvedValue({ daily_goal_xp: 20 })

    const res = await GET(new Request('http://localhost/api/user/stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('streak_days')
    expect(body).toHaveProperty('total_xp')
    expect(body).toHaveProperty('level')
    expect(body).toHaveProperty('total_words', 5)
    expect(body.today_xp).toBe(7) // 3+4
  })
})
```

- [ ] **Step 7: Implement stats API route**

Create `src/app/api/user/stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { computeXP, computeStreak, computeLevel, computeTodayXP } from '@/lib/engine/UserStatsEngine'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [logs, totalWords, pref] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: session.user.id },
      select: { reviewed_at: true, rating: true },
      orderBy: { reviewed_at: 'desc' },
    }),
    db.srsCard.count({ where: { user_id: session.user.id } }),
    db.userPreference.findUnique({
      where: { user_id: session.user.id },
      select: { daily_goal_xp: true },
    }),
  ])

  const totalXP = computeXP(logs)
  const { level, xpToNext } = computeLevel(totalXP)

  return NextResponse.json({
    streak_days: computeStreak(logs),
    total_xp: totalXP,
    today_xp: computeTodayXP(logs),
    level,
    xp_to_next_level: xpToNext,
    total_words: totalWords,
    daily_goal_xp: pref?.daily_goal_xp ?? 20,
  })
}
```

- [ ] **Step 8: Run all tests**

```powershell
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/engine/UserStatsEngine.ts src/app/api/user/stats/route.ts __tests__/lib/engine/UserStatsEngine.test.ts __tests__/app/api/user/stats.test.ts
git commit -m "feat(api): user stats endpoint — streak, XP, level derived from ReviewLog"
```

---

### Task 4: Home Dashboard

**Branch:** `feature/sprint3-home-dashboard`

**Files:**
- Create: `src/app/(home)/page.tsx`
- Create: `src/components/stats/StreakRing.tsx`
- Create: `src/components/stats/XPBar.tsx`
- Create: `src/components/home/DailyGoalCard.tsx`
- Create: `src/components/home/FeaturedSongs.tsx`
- Create: `src/components/home/SongCard.tsx`
- Create: `src/app/api/songs/route.ts`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-home-dashboard
```

- [ ] **Step 2: Implement StreakRing component**

Create `src/components/stats/StreakRing.tsx`:

```typescript
'use client'
import { motion } from 'framer-motion'

interface Props {
  streak: number
  size?: number
}

export function StreakRing({ streak, size = 80 }: Props) {
  const r = (size / 2) * 0.75
  const circumference = 2 * Math.PI * r
  const maxStreak = Math.max(streak, 7) // ring fills at 7 days
  const fillRatio = Math.min(streak / maxStreak, 1)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="#f97316"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - fillRatio) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-lg font-bold text-slate-100" style={{ marginTop: `-${size * 0.6}px` }}>
        🔥 {streak}
      </span>
      <span className="text-xs text-slate-400">day streak</span>
    </div>
  )
}
```

- [ ] **Step 3: Implement XPBar component**

Create `src/components/stats/XPBar.tsx`:

```typescript
'use client'
import { motion } from 'framer-motion'

interface Props {
  level: number
  xpToNext: number
  totalXP: number
}

export function XPBar({ level, xpToNext, totalXP }: Props) {
  const levelXP = level * level * 10
  const prevLevelXP = (level - 1) * (level - 1) * 10
  const progress = (totalXP - prevLevelXP) / (levelXP - prevLevelXP)

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
        <span className="text-xs font-bold text-blue-400">{level}</span>
      </div>
      <div className="flex-1">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0">{xpToNext} XP</span>
    </div>
  )
}
```

- [ ] **Step 4: Implement SongCard**

Create `src/components/home/SongCard.tsx`:

```typescript
import Link from 'next/link'

interface Props {
  id: string
  title: string
  artist: string
  language_code: string
}

const FLAG: Record<string, string> = {
  fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', ja: '🇯🇵', en: '🇬🇧', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳',
}

export function SongCard({ id, title, artist, language_code }: Props) {
  return (
    <Link href={`/player/${id}`} className="flex-shrink-0 w-40 rounded-2xl bg-slate-800 border border-slate-700 p-4 hover:border-slate-500 transition-colors">
      <div className="text-2xl mb-2">{FLAG[language_code] ?? '🎵'}</div>
      <p className="text-sm font-semibold text-slate-100 truncate">{title}</p>
      <p className="text-xs text-slate-400 truncate">{artist}</p>
    </Link>
  )
}
```

- [ ] **Step 5: Implement songs API**

Create `src/app/api/songs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lang = searchParams.get('lang')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const cursor = searchParams.get('cursor')

  const songs = await db.song.findMany({
    where: lang ? { language_code: lang } : undefined,
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { created_at: 'desc' },
    select: { id: true, title: true, artist: true, language_code: true },
  })

  return NextResponse.json({
    songs,
    nextCursor: songs.length === limit ? songs[songs.length - 1].id : null,
  })
}
```

- [ ] **Step 6: Implement home page**

Create `src/app/(home)/page.tsx`:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { computeXP, computeStreak, computeLevel, computeTodayXP } from '@/lib/engine/UserStatsEngine'
import { StreakRing } from '@/components/stats/StreakRing'
import { XPBar } from '@/components/stats/XPBar'
import { SongCard } from '@/components/home/SongCard'
import { PageTransition } from '@/components/PageTransition'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Bonsoir'
  if (h < 12) return 'Bonjour'
  if (h < 17) return 'Bon après-midi'
  return 'Bonsoir'
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [logs, pref, songs] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: session.user.id },
      select: { reviewed_at: true, rating: true },
      orderBy: { reviewed_at: 'desc' },
    }),
    db.userPreference.findUnique({
      where: { user_id: session.user.id },
      select: { target_language: true, daily_goal_xp: true, onboarding_done: true },
    }),
    db.song.findMany({ take: 6, orderBy: { created_at: 'desc' }, select: { id: true, title: true, artist: true, language_code: true } }),
  ])

  if (!pref?.onboarding_done) redirect('/onboarding')

  const totalXP = computeXP(logs)
  const todayXP = computeTodayXP(logs)
  const streak = computeStreak(logs)
  const { level, xpToNext } = computeLevel(totalXP)
  const dailyGoal = pref?.daily_goal_xp ?? 20
  const goalPct = Math.min(Math.round((todayXP / dailyGoal) * 100), 100)

  const name = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <PageTransition>
      <main className="min-h-screen bg-slate-950 pb-20 px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-400 text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-slate-100">{name} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-400">{name[0].toUpperCase()}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-start gap-4 mb-8">
          <StreakRing streak={streak} size={80} />
          <div className="flex-1 flex flex-col gap-3">
            <XPBar level={level} xpToNext={xpToNext} totalXP={totalXP} />
            <div className="text-sm text-slate-400">
              Today: <span className="text-slate-200 font-medium">{todayXP} / {dailyGoal} XP</span>
              <span className="ml-2 text-xs text-slate-600">({goalPct}%)</span>
            </div>
          </div>
        </div>

        {/* Songs */}
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Featured Songs</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
          {songs.map(s => <SongCard key={s.id} {...s} />)}
        </div>
      </main>
    </PageTransition>
  )
}
```

- [ ] **Step 7: Run full test suite**

```powershell
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 8: Commit**

```powershell
git add "src/app/(home)" src/components/stats src/components/home src/app/api/songs
git commit -m "feat(home): dashboard with StreakRing, XPBar, featured songs"
```

---

### Task 5: Song Discovery Screen

**Branch:** `feature/sprint3-discovery`

**Files:**
- Create: `src/app/(discover)/discover/page.tsx`
- Create: `src/components/discover/FilterBar.tsx`
- Create: `src/components/discover/SongGrid.tsx`
- Modify: `src/app/api/songs/route.ts` (add level filter)
- Create: `__tests__/app/api/songs.test.ts`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-discovery
```

- [ ] **Step 2: Write failing tests for songs API**

Create `__tests__/app/api/songs.test.ts`:

```typescript
import { GET } from '@/app/api/songs/route'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: { song: { findMany: jest.fn() } },
}))

const mockDb = db as jest.Mocked<typeof db>

const SONGS = [
  { id: '1', title: 'Papaoutai', artist: 'Stromae', language_code: 'fr' },
  { id: '2', title: '99 Luftballons', artist: 'Nena', language_code: 'de' },
]

describe('GET /api/songs', () => {
  it('returns all songs with no filter', async () => {
    mockDb.song.findMany = jest.fn().mockResolvedValue(SONGS)
    const res = await GET(new Request('http://localhost/api/songs'))
    const body = await res.json()
    expect(body.songs).toHaveLength(2)
  })

  it('filters by language', async () => {
    mockDb.song.findMany = jest.fn().mockResolvedValue([SONGS[0]])
    const res = await GET(new Request('http://localhost/api/songs?lang=fr'))
    const body = await res.json()
    expect(body.songs).toHaveLength(1)
    expect(body.songs[0].language_code).toBe('fr')
  })

  it('returns nextCursor when more songs exist', async () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, title: 'Song', artist: 'A', language_code: 'fr' }))
    mockDb.song.findMany = jest.fn().mockResolvedValue(many)
    const res = await GET(new Request('http://localhost/api/songs?limit=20'))
    const body = await res.json()
    expect(body.nextCursor).toBe('19')
  })
})
```

- [ ] **Step 3: Run tests to verify failure**

```powershell
npx jest __tests__/app/api/songs.test.ts --no-coverage
```

- [ ] **Step 4: Implement FilterBar**

Create `src/components/discover/FilterBar.tsx`:

```typescript
'use client'
import { LANGUAGES } from '@/lib/languages'

interface Props {
  selectedLang: string | null
  onLangChange: (lang: string | null) => void
}

export function FilterBar({ selectedLang, onLangChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onLangChange(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedLang === null ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        All
      </button>
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => onLangChange(l.code)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedLang === l.code ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {l.flag} {l.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Implement discovery page**

Create `src/app/(discover)/discover/page.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { FilterBar } from '@/components/discover/FilterBar'
import { SongCard } from '@/components/home/SongCard'
import { PageTransition } from '@/components/PageTransition'

interface Song { id: string; title: string; artist: string; language_code: string }

export default function DiscoverPage() {
  const [lang, setLang] = useState<string | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = lang ? `/api/songs?lang=${lang}&limit=20` : '/api/songs?limit=20'
    fetch(url)
      .then(r => r.json())
      .then(d => { setSongs(d.songs); setLoading(false) })
  }, [lang])

  return (
    <PageTransition>
      <main className="min-h-screen bg-slate-950 pb-20 px-5 pt-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Discover</h1>
        <FilterBar selectedLang={lang} onLangChange={setLang} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse" />
              ))
            : songs.length === 0
            ? <p className="col-span-2 text-slate-400 text-center py-12">No songs found</p>
            : songs.map(s => <SongCard key={s.id} {...s} />)
          }
        </div>
      </main>
    </PageTransition>
  )
}
```

- [ ] **Step 6: Run tests**

```powershell
npx jest __tests__/app/api/songs.test.ts --no-coverage
```

- [ ] **Step 7: Commit**

```powershell
git add "src/app/(discover)" src/components/discover src/app/api/songs __tests__/app/api/songs.test.ts
git commit -m "feat(discover): song discovery screen with language filter + songs API"
```

---

### Task 6: Gamification — XP Awards + Achievement Engine

**Branch:** `feature/sprint3-gamification-api` (continue from Task 3 branch)

**Files:**
- Create: `src/lib/engine/AchievementEngine.ts`
- Modify: `prisma/schema.prisma` — add UserAchievement
- Modify: `src/app/api/srs/review/route.ts`
- Create: `__tests__/lib/engine/AchievementEngine.test.ts`

- [ ] **Step 1: Add UserAchievement to schema**

In `prisma/schema.prisma`, add after `UserPreference`:

```prisma
model UserAchievement {
  id           String   @id @default(uuid())
  user_id      String
  user         User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  achievement  String
  unlocked_at  DateTime @default(now())

  @@unique([user_id, achievement])
}
```

Add reverse relation to User model:
```prisma
  achievements  UserAchievement[]
```

- [ ] **Step 2: Run migration**

```powershell
npx prisma migrate dev --name add-user-achievements
```

- [ ] **Step 3: Write failing tests for AchievementEngine**

Create `__tests__/lib/engine/AchievementEngine.test.ts`:

```typescript
import { checkAchievements } from '@/lib/engine/AchievementEngine'

describe('checkAchievements', () => {
  const baseContext = { streakDays: 0, totalWords: 0, distinctLanguages: 1, reviewCount: 0 }

  it('returns first_word on first review', () => {
    const result = checkAchievements({ ...baseContext, reviewCount: 1, totalWords: 1 })
    expect(result).toContain('first_word')
  })

  it('returns streak_week at 7 day streak', () => {
    const result = checkAchievements({ ...baseContext, streakDays: 7 })
    expect(result).toContain('streak_week')
  })

  it('returns century at 100 words', () => {
    const result = checkAchievements({ ...baseContext, totalWords: 100 })
    expect(result).toContain('century')
  })

  it('returns polyglot at 2+ languages', () => {
    const result = checkAchievements({ ...baseContext, distinctLanguages: 2 })
    expect(result).toContain('polyglot')
  })

  it('returns no achievements for baseline user', () => {
    expect(checkAchievements(baseContext)).toHaveLength(0)
  })
})
```

- [ ] **Step 4: Run to verify failure**

```powershell
npx jest __tests__/lib/engine/AchievementEngine.test.ts --no-coverage
```

- [ ] **Step 5: Implement AchievementEngine**

Create `src/lib/engine/AchievementEngine.ts`:

```typescript
interface AchievementContext {
  streakDays: number
  totalWords: number
  distinctLanguages: number
  reviewCount: number
}

export function checkAchievements(ctx: AchievementContext): string[] {
  const earned: string[] = []
  if (ctx.reviewCount >= 1 && ctx.totalWords >= 1) earned.push('first_word')
  if (ctx.streakDays >= 7) earned.push('streak_week')
  if (ctx.totalWords >= 100) earned.push('century')
  if (ctx.distinctLanguages >= 2) earned.push('polyglot')
  return earned
}
```

- [ ] **Step 6: Wire into review API**

Read `src/app/api/srs/review/route.ts`, then add achievement checking after the `$transaction`:

```typescript
// After the $transaction, add:
import { computeStreak, computeXP } from '@/lib/engine/UserStatsEngine'
import { checkAchievements } from '@/lib/engine/AchievementEngine'

// After $transaction succeeds:
const [allLogs, wordCount, langs] = await Promise.all([
  db.reviewLog.findMany({ where: { user_id }, select: { reviewed_at: true, rating: true } }),
  db.srsCard.count({ where: { user_id } }),
  db.srsCard.findMany({ where: { user_id }, select: { language_code: true }, distinct: ['language_code'] }),
])
const earned = checkAchievements({
  streakDays: computeStreak(allLogs),
  totalWords: wordCount,
  distinctLanguages: langs.length,
  reviewCount: allLogs.length,
})
for (const achievement of earned) {
  await db.userAchievement.upsert({
    where: { user_id_achievement: { user_id, achievement } },
    update: {},
    create: { user_id, achievement },
  })
}
```

- [ ] **Step 7: Run all tests**

```powershell
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 8: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations src/lib/engine/AchievementEngine.ts "src/app/api/srs/review/route.ts" __tests__/lib/engine/AchievementEngine.test.ts
git commit -m "feat(gamification): AchievementEngine, UserAchievement schema, XP awards on review"
```

---

### Task 7: Lyric Cloze Review

**Branch:** `feature/sprint3-cloze-review`

**Files:**
- Create: `src/lib/engine/ClozeGenerator.ts`
- Create: `src/app/api/srs/cloze-cards/route.ts`
- Create: `src/app/(srs)/review/cloze/page.tsx`
- Create: `src/app/(srs)/review/cloze/ClozeSession.tsx`
- Create: `__tests__/lib/engine/ClozeGenerator.test.ts`
- Create: `__tests__/app/api/srs/cloze-cards.test.ts`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-cloze-review
```

- [ ] **Step 2: Write failing tests for ClozeGenerator**

Create `__tests__/lib/engine/ClozeGenerator.test.ts`:

```typescript
import { generateCloze } from '@/lib/engine/ClozeGenerator'

const WORDS = [
  { word: 'Dis-moi', startMs: 0 },
  { word: 'où', startMs: 500 },
  { word: 'on', startMs: 1000 },
  { word: 'va', startMs: 1500 },
  { word: 'La', startMs: 5000 },
  { word: 'la', startMs: 5500 },
]

const LINES = [
  { startMs: 0, endMs: 4000, text: 'Dis-moi où on va' },
  { startMs: 5000, endMs: 9000, text: 'La la la la' },
]

describe('generateCloze', () => {
  it('creates a cloze card with the target word blanked', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(card.lyric_line).toBe('Dis-moi ___ on va')
  })

  it('includes the correct answer in choices', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(card.choices).toContain('où')
  })

  it('returns exactly 4 choices', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(card.choices).toHaveLength(4)
  })

  it('all choices are distinct', () => {
    const card = generateCloze('où', WORDS, LINES)
    expect(new Set(card.choices).size).toBe(4)
  })
})
```

- [ ] **Step 3: Run to verify failure**

```powershell
npx jest __tests__/lib/engine/ClozeGenerator.test.ts --no-coverage
```

- [ ] **Step 4: Implement ClozeGenerator**

Create `src/lib/engine/ClozeGenerator.ts`:

```typescript
interface LyricWordMinimal { word: string; startMs: number }
interface LyricLineMinimal { startMs: number; endMs: number; text: string }

export interface ClozeCard {
  word: string
  lyric_line: string
  choices: string[]
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateCloze(
  targetWord: string,
  words: LyricWordMinimal[],
  lines: LyricLineMinimal[]
): ClozeCard {
  // Find the line containing the target word
  const targetWordLower = targetWord.toLowerCase()
  const wordObj = words.find(w => w.word.toLowerCase() === targetWordLower)
  const line = wordObj
    ? lines.find(l => l.startMs <= wordObj.startMs && wordObj.startMs <= l.endMs)
    : null

  const lyricText = line?.text ?? targetWord
  const lyric_line = lyricText.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '___')
    || lyricText.replace(targetWord, '___')

  // Find distractor words: adjacent words from all lyrics, not equal to target
  const others = words
    .map(w => w.word)
    .filter(w => w.toLowerCase() !== targetWordLower && w.length > 1)
  const unique = [...new Set(others)]

  // Pick 3 distractors from random selection
  const shuffled = shuffleArray(unique)
  const distractors = shuffled.slice(0, 3)

  // Pad with fallback if not enough
  while (distractors.length < 3) {
    distractors.push(`option${distractors.length}`)
  }

  const choices = shuffleArray([targetWord, ...distractors])

  return { word: targetWord, lyric_line, choices }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```powershell
npx jest __tests__/lib/engine/ClozeGenerator.test.ts --no-coverage
```

Expected: all pass.

- [ ] **Step 6: Implement cloze-cards API**

Create `src/app/api/srs/cloze-cards/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { generateCloze } from '@/lib/engine/ClozeGenerator'
import type { LyricWord, LyricLine } from '@/lib/engine/LRCParser'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const dueCards = await db.srsCard.findMany({
    where: { user_id: session.user.id, next_review_at: { lte: now } },
    take: 10,
  })

  const cards = await Promise.all(dueCards.map(async (card) => {
    if (!card.context_song) return null

    const lyrics = await db.lyrics.findUnique({ where: { song_id: card.context_song } })
    const song = await db.song.findUnique({ where: { id: card.context_song }, select: { title: true } })
    if (!lyrics) return null

    const words = lyrics.words as unknown as LyricWord[]
    const lines = lyrics.lines as unknown as LyricLine[]
    const cloze = generateCloze(card.word, words, lines)

    return {
      card_id: card.id,
      word: card.word,
      song_title: song?.title ?? 'Unknown',
      ...cloze,
    }
  }))

  return NextResponse.json({ cards: cards.filter(Boolean) })
}
```

- [ ] **Step 7: Implement ClozeSession component**

Create `src/app/(srs)/review/cloze/ClozeSession.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface ClozeCard {
  card_id: string
  word: string
  lyric_line: string
  choices: string[]
  song_title: string
}

interface Props {
  cards: ClozeCard[]
}

export function ClozeSession({ cards }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [xpTotal, setXpTotal] = useState(0)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const card = cards[index]

  async function handleAnswer(choice: string) {
    if (selected) return
    setSelected(choice)
    const correct = choice === card.word
    const xp = correct ? 5 : 0
    const rating = correct ? 3 : 1

    await fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.card_id, rating }),
    })

    setXpTotal(p => p + xp)

    setTimeout(() => {
      if (index + 1 >= cards.length) {
        setDone(true)
      } else {
        setIndex(i => i + 1)
        setSelected(null)
      }
    }, 1400)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-6 px-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-slate-100">Session complete!</h2>
        <p className="text-slate-400">You earned <span className="text-yellow-400 font-bold">+{xpTotal} XP</span></p>
        <button onClick={() => router.push('/deck')} className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-semibold">Back to Deck</button>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-950 px-6 pt-12 pb-20">
      {/* Progress */}
      <div className="w-full max-w-sm mb-8">
        <div className="h-1.5 bg-slate-800 rounded-full">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((index) / cards.length) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>{index + 1} / {cards.length}</span>
          <span className="text-yellow-400">⚡ {xpTotal} XP</span>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card.card_id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="w-full max-w-sm"
        >
          <p className="text-slate-400 text-sm mb-2 text-center">{card.song_title}</p>
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 text-center">
            <p className="text-xl text-slate-100 font-medium leading-relaxed">
              {card.lyric_line.split('___').map((part, i) => (
                <span key={i}>
                  {part}
                  {i === 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="inline-block w-16 h-0.5 bg-blue-400 mx-1 mb-1"
                    />
                  )}
                </span>
              ))}
            </p>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-2 gap-3">
            {card.choices.map((choice) => {
              const isCorrect = choice === card.word
              const isSelected = choice === selected
              let bg = 'bg-slate-800 border-slate-700 hover:border-slate-500'
              if (selected) {
                if (isCorrect) bg = 'bg-green-500/20 border-green-500'
                else if (isSelected) bg = 'bg-red-500/20 border-red-500'
                else bg = 'bg-slate-800/40 border-slate-800'
              }
              return (
                <motion.button
                  key={choice}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(choice)}
                  className={`p-4 rounded-2xl border text-slate-100 font-medium transition-all ${bg}`}
                >
                  {choice}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 8: Implement cloze review page**

Create `src/app/(srs)/review/cloze/page.tsx`:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ClozeSession } from './ClozeSession'

export default async function ClozeReviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/srs/cloze-cards`, {
    headers: { Cookie: '' }, // server-to-server, auth handled by session
    cache: 'no-store',
  })
  // Fallback: fetch directly from DB for server component
  const { db } = await import('@/lib/db')
  const { generateCloze } = await import('@/lib/engine/ClozeGenerator')
  const now = new Date()
  const dueCards = await db.srsCard.findMany({
    where: { user_id: session.user.id, next_review_at: { lte: now } },
    take: 10,
  })

  if (dueCards.length === 0) {
    redirect('/deck')
  }

  const cards = (await Promise.all(dueCards.map(async (card) => {
    if (!card.context_song) return null
    const lyrics = await db.lyrics.findUnique({ where: { song_id: card.context_song } })
    const song = await db.song.findUnique({ where: { id: card.context_song }, select: { title: true } })
    if (!lyrics) return null
    const { LyricWord, LyricLine } = {} as any
    const cloze = generateCloze(card.word, lyrics.words as any, lyrics.lines as any)
    return { card_id: card.id, word: card.word, song_title: song?.title ?? 'Unknown', ...cloze }
  }))).filter(Boolean) as any[]

  return <ClozeSession cards={cards} />
}
```

- [ ] **Step 9: Run all tests**

```powershell
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 10: Commit**

```powershell
git add src/lib/engine/ClozeGenerator.ts src/app/api/srs/cloze-cards "src/app/(srs)/review/cloze" __tests__/lib/engine/ClozeGenerator.test.ts
git commit -m "feat(cloze): lyric cloze review session with 4-choice answers and XP awards"
```

---

### Task 8: CEFR Word Annotation

**Branch:** `feature/sprint3-cefr-annotation`

**Files:**
- Create: `python-service/providers/cefr_annotator.py`
- Modify: `python-service/main.py`
- Modify: `src/components/WordToken.tsx`
- Modify: `scripts/import-song.ts`
- Create: `__tests__/components/WordToken.cefr.test.tsx`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-cefr-annotation
```

- [ ] **Step 2: Create CEFR wordlist data file**

Create `python-service/data/cefr_en.json` with a representative sample:

```json
{
  "a": "A1", "an": "A1", "the": "A1", "is": "A1", "are": "A1", "be": "A1",
  "have": "A1", "do": "A1", "say": "A1", "go": "A1", "get": "A1", "come": "A1",
  "good": "A1", "new": "A1", "first": "A1", "last": "A1", "long": "A1",
  "je": "A1", "tu": "A1", "il": "A1", "elle": "A1", "nous": "A1", "vous": "A1",
  "le": "A1", "la": "A1", "les": "A1", "un": "A1", "une": "A1", "des": "A1",
  "et": "A1", "est": "A1", "pas": "A1", "que": "A1", "mais": "A1",
  "dis": "A2", "moi": "A2", "veux": "A2", "tout": "A2", "plus": "A2",
  "savoir": "B1", "comprendre": "B1", "jamais": "B1", "pourquoi": "B1",
  "néanmoins": "C1", "davantage": "C1", "perspicace": "C2"
}
```

- [ ] **Step 3: Create CEFR annotator**

Create `python-service/providers/cefr_annotator.py`:

```python
from pathlib import Path
import json

_WORDLIST: dict[str, str] = {}

def _load_wordlist() -> None:
    global _WORDLIST
    if _WORDLIST:
        return
    data_dir = Path(__file__).parent.parent / "data"
    for path in data_dir.glob("cefr_*.json"):
        with open(path) as f:
            _WORDLIST.update(json.load(f))

def annotate_cefr(words: list[str], language: str) -> list[dict]:
    _load_wordlist()
    result = []
    for word in words:
        normalized = word.lower().strip(".,!?\"'")
        level = _WORDLIST.get(normalized)
        result.append({"word": word, "cefr_level": level})
    return result
```

- [ ] **Step 4: Add /annotate-cefr endpoint to Python service**

Read `python-service/main.py`, then add:

```python
from providers.cefr_annotator import annotate_cefr
from pydantic import BaseModel

class CEFRRequest(BaseModel):
    words: list[str]
    language: str = "fr"

@app.post("/annotate-cefr")
async def annotate_cefr_endpoint(req: CEFRRequest):
    return annotate_cefr(req.words, req.language)
```

- [ ] **Step 5: Add CEFR colors to WordToken**

Read `src/components/WordToken.tsx`, then update to apply CEFR color:

```typescript
const CEFR_COLORS: Record<string, string> = {
  A1: 'text-slate-400',
  A2: 'text-blue-400',
  B1: 'text-yellow-400',
  B2: 'text-orange-400',
  C1: 'text-red-400',
  C2: 'text-purple-400',
}

// In the component, update the className to include CEFR color:
const cefrColor = word.cefr_level ? CEFR_COLORS[word.cefr_level] : ''
```

- [ ] **Step 6: Update import-song.ts to call /annotate-cefr**

Read `scripts/import-song.ts`, then add after `parseLRC`:

```typescript
// After: const parsed = parseLRC(lrcContent)
// Add CEFR annotation:
let annotatedWords = parsed.words
try {
  const uniqueWords = [...new Set(parsed.words.map((w: any) => w.word))]
  const cefrRes = await fetch(`${process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000'}/annotate-cefr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: uniqueWords, language: lang }),
  })
  if (cefrRes.ok) {
    const cefrMap = Object.fromEntries(
      ((await cefrRes.json()) as { word: string; cefr_level: string | null }[])
        .map(({ word, cefr_level }) => [word.toLowerCase(), cefr_level])
    )
    annotatedWords = parsed.words.map((w: any) => ({
      ...w,
      cefr_level: cefrMap[w.word.toLowerCase()] ?? null,
    }))
    console.log(`✓ CEFR annotation applied`)
  }
} catch {
  console.log(`⚠ CEFR annotation unavailable — skipped`)
}
```

- [ ] **Step 7: Run full test suite**

```powershell
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 8: Commit**

```powershell
git add python-service/providers/cefr_annotator.py python-service/main.py python-service/data src/components/WordToken.tsx scripts/import-song.ts
git commit -m "feat(cefr): CEFR word annotation endpoint, color-coded WordToken, import-song integration"
```

---

### Task 9: Player UX Polish — Framer Motion Springs + Karaoke

**Branch:** `feature/sprint3-player-polish`

**Files:**
- Modify: `src/components/WordPopover.tsx`
- Modify: `src/components/WordToken.tsx`
- Modify: `src/components/LyricsView.tsx`
- Modify: `src/app/(player)/player/[songId]/page.tsx`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-player-polish
```

- [ ] **Step 2: Add Framer Motion spring to WordPopover**

Read `src/components/WordPopover.tsx`, then wrap the popover panel in:

```typescript
import { motion, AnimatePresence } from 'framer-motion'

// Wrap the popover content:
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: -4 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: -4 }}
      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
    >
      {/* existing popover content */}
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 3: Add active word animation to WordToken**

Read `src/components/WordToken.tsx`, then update the component to animate the active state:

```typescript
import { motion } from 'framer-motion'

// Replace the <span> wrapper with:
<motion.span
  animate={{
    scale: isActive ? 1.05 : 1,
    opacity: isActive ? 1 : 0.75,
  }}
  transition={{ duration: 0.12 }}
  // ...existing props
>
```

- [ ] **Step 4: Add karaoke line highlight to LyricsView**

Read `src/components/LyricsView.tsx`, then highlight the entire active line:

```typescript
// Add a data-active-line attribute to the line container:
<div
  key={line.startMs}
  data-active-line={isActiveLine}
  className={`transition-colors duration-200 ${isActiveLine ? 'bg-blue-500/5 rounded-xl px-2' : ''}`}
>
```

- [ ] **Step 5: Add page entry animation to player page**

Read `src/app/(player)/player/[songId]/page.tsx`, then wrap the return with `PageTransition`:

```typescript
import { PageTransition } from '@/components/PageTransition'

// Wrap the existing <main>:
return (
  <PageTransition>
    <main ...>
      {/* existing content */}
    </main>
  </PageTransition>
)
```

- [ ] **Step 6: Run full test suite**

```powershell
npx jest --no-coverage
```

Expected: all pass (animation changes don't break existing tests).

- [ ] **Step 7: Commit**

```powershell
git add src/components/WordPopover.tsx src/components/WordToken.tsx src/components/LyricsView.tsx "src/app/(player)/player/[songId]/page.tsx"
git commit -m "feat(player): Framer Motion springs on WordPopover, active word animation, karaoke line highlight"
```

---

### Task 10: User Profile Page

**Branch:** `feature/sprint3-profile`

**Files:**
- Create: `src/app/(profile)/profile/page.tsx`
- Create: `src/components/profile/ActivityHeatmap.tsx`
- Create: `src/components/profile/LanguageCard.tsx`
- Create: `src/components/profile/AchievementBadge.tsx`
- Create: `__tests__/components/profile/ActivityHeatmap.test.tsx`

- [ ] **Step 1: Create branch**

```powershell
git checkout sprint-3
git checkout -b feature/sprint3-profile
```

- [ ] **Step 2: Write failing tests for ActivityHeatmap**

Create `__tests__/components/profile/ActivityHeatmap.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'

describe('ActivityHeatmap', () => {
  it('renders 30 day cells', () => {
    render(<ActivityHeatmap dailyXP={{}} />)
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(30)
  })

  it('shows higher intensity for days with more XP', () => {
    const today = new Date().toISOString().slice(0, 10)
    const { container } = render(<ActivityHeatmap dailyXP={{ [today]: 15 }} />)
    const activeCells = container.querySelectorAll('[data-intensity="high"]')
    expect(activeCells.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run to verify failure**

```powershell
npx jest __tests__/components/profile/ActivityHeatmap.test.tsx --no-coverage
```

- [ ] **Step 4: Implement ActivityHeatmap**

Create `src/components/profile/ActivityHeatmap.tsx`:

```typescript
interface Props {
  dailyXP: Record<string, number>
}

function getDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function intensity(xp: number): 'none' | 'low' | 'medium' | 'high' {
  if (xp === 0) return 'none'
  if (xp < 5) return 'low'
  if (xp < 15) return 'medium'
  return 'high'
}

const COLORS = {
  none: 'bg-slate-800',
  low: 'bg-blue-900',
  medium: 'bg-blue-600',
  high: 'bg-blue-400',
}

export function ActivityHeatmap({ dailyXP }: Props) {
  const days = getDays(30)

  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map(day => {
        const xp = dailyXP[day] ?? 0
        const level = intensity(xp)
        return (
          <div
            key={day}
            role="cell"
            data-intensity={level}
            title={`${day}: ${xp} XP`}
            className={`w-6 h-6 rounded-sm ${COLORS[level]} transition-colors`}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Implement LanguageCard + AchievementBadge**

Create `src/components/profile/LanguageCard.tsx`:

```typescript
const FLAG: Record<string, string> = {
  fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', ja: '🇯🇵', en: '🇬🇧', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳',
}

interface Props { code: string; wordCount: number; lastReview: string }

export function LanguageCard({ code, wordCount, lastReview }: Props) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
      <span className="text-2xl">{FLAG[code] ?? '🌐'}</span>
      <div>
        <p className="font-semibold text-slate-100 capitalize">{code}</p>
        <p className="text-xs text-slate-400">{wordCount} words · last {lastReview}</p>
      </div>
    </div>
  )
}
```

Create `src/components/profile/AchievementBadge.tsx`:

```typescript
const ACHIEVEMENTS: Record<string, { emoji: string; label: string }> = {
  first_word:  { emoji: '🎯', label: 'First Word' },
  streak_week: { emoji: '🔥', label: 'Week Streak' },
  century:     { emoji: '💯', label: 'Century' },
  polyglot:    { emoji: '🌍', label: 'Polyglot' },
}

interface Props { achievement: string; unlockedAt: string }

export function AchievementBadge({ achievement, unlockedAt }: Props) {
  const meta = ACHIEVEMENTS[achievement] ?? { emoji: '🏆', label: achievement }
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl border border-slate-700">
      <span className="text-3xl">{meta.emoji}</span>
      <span className="text-xs font-medium text-slate-200">{meta.label}</span>
      <span className="text-[10px] text-slate-500">{unlockedAt}</span>
    </div>
  )
}
```

- [ ] **Step 6: Implement profile page**

Create `src/app/(profile)/profile/page.tsx`:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { computeXP, computeStreak, computeLevel } from '@/lib/engine/UserStatsEngine'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'
import { LanguageCard } from '@/components/profile/LanguageCard'
import { AchievementBadge } from '@/components/profile/AchievementBadge'
import { PageTransition } from '@/components/PageTransition'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [logs, achievements, cards] = await Promise.all([
    db.reviewLog.findMany({
      where: { user_id: userId },
      select: { reviewed_at: true, rating: true },
      orderBy: { reviewed_at: 'asc' },
    }),
    db.userAchievement.findMany({
      where: { user_id: userId },
      orderBy: { unlocked_at: 'asc' },
    }),
    db.srsCard.findMany({
      where: { user_id: userId },
      select: { language_code: true, created_at: true },
    }),
  ])

  const totalXP = computeXP(logs)
  const streak = computeStreak(logs)
  const { level } = computeLevel(totalXP)

  // Build daily XP map
  const dailyXP: Record<string, number> = {}
  for (const log of logs) {
    const day = new Date(log.reviewed_at).toISOString().slice(0, 10)
    dailyXP[day] = (dailyXP[day] ?? 0) + (log.rating ?? 0)
  }

  // Language breakdown
  const langMap = new Map<string, { count: number; last: Date }>()
  for (const card of cards) {
    const entry = langMap.get(card.language_code) ?? { count: 0, last: new Date(0) }
    entry.count++
    if (card.created_at > entry.last) entry.last = card.created_at
    langMap.set(card.language_code, entry)
  }

  const name = session.user.name ?? 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <PageTransition>
      <main className="min-h-screen bg-slate-950 pb-20 px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-400">{initials}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{name}</h1>
            <p className="text-sm text-slate-400">Level {level} · {streak} day streak</p>
          </div>
        </div>

        {/* Activity heatmap */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">30-Day Activity</h2>
        <ActivityHeatmap dailyXP={dailyXP} />

        {/* Languages */}
        {langMap.size > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-8">Languages</h2>
            <div className="flex flex-col gap-2">
              {[...langMap.entries()].map(([code, { count, last }]) => (
                <LanguageCard
                  key={code}
                  code={code}
                  wordCount={count}
                  lastReview={last.toLocaleDateString()}
                />
              ))}
            </div>
          </>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-8">Achievements</h2>
            <div className="grid grid-cols-4 gap-3">
              {achievements.map(a => (
                <AchievementBadge
                  key={a.id}
                  achievement={a.achievement}
                  unlockedAt={a.unlocked_at.toLocaleDateString()}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </PageTransition>
  )
}
```

- [ ] **Step 7: Run all tests**

```powershell
npx jest --no-coverage
```

Expected: all pass, 120+ total tests.

- [ ] **Step 8: Commit**

```powershell
git add "src/app/(profile)" src/components/profile __tests__/components/profile
git commit -m "feat(profile): user profile with activity heatmap, language cards, achievement badges"
```

---

## Final Verification

After all tasks are merged to `sprint-3`:

```powershell
# Full test suite
npm test
# Expected: 120+ tests, 0 failures

# Manual end-to-end flow
# 1. docker compose up -d && npm run dev
# 2. http://localhost:3000/api/dev/login-as?email=pro@test.dev
# 3. Should redirect to /onboarding (first login, onboarding_done=false)
# 4. Select French → 20 XP → "Let's go!" → redirects to /
# 5. Home shows streak ring, XP bar, featured songs
# 6. Bottom nav: tap Discover → filtered song grid
# 7. Tap a song → player with CEFR-colored words
# 8. Click a word → WordPopover with spring animation
# 9. Navigate to /deck → due cards shown
# 10. Review N due → /review/cloze → cloze session
# 11. Complete session → XP awarded, achievements checked
# 12. Navigate to /profile → heatmap, language cards, achievement badges
```

---

## Branch Merge Order

```
feature/sprint3-app-shell        → sprint-3
feature/sprint3-onboarding       → sprint-3
feature/sprint3-gamification-api → sprint-3
feature/sprint3-home-dashboard   → sprint-3
feature/sprint3-discovery        → sprint-3
feature/sprint3-cloze-review     → sprint-3
feature/sprint3-cefr-annotation  → sprint-3
feature/sprint3-player-polish    → sprint-3
feature/sprint3-profile          → sprint-3

sprint-3 → main (when all tasks complete + 120+ tests pass)
```
