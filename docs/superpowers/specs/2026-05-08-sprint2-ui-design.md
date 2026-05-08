# Sprint 2 UI Design Spec — Learning Layer

**Date:** 2026-05-08
**Status:** Approved — proceeding to implementation

---

## Overview

Four UI components completing the Sprint 2 learning layer. All decisions were validated visually via the brainstorming visual companion before implementation.

---

## 1. WordPopover — Inline Card (Option B)

**Pattern:** When a user taps a word in the lyrics, an analysis card expands inline between the lyric lines, pushing content down. The tapped word stays visible in context above the card.

**Layout:**
- Word and IPA on one row (word left, IPA right in serif font)
- Meaning on next line
- Register label (informal / neutral / formal / slang)
- "Save to deck" button (blue pill, only shown when signed in)
- Dismiss by tapping the word again or elsewhere

**is_partial handling:** When `is_partial: true` (free provider returned no MyMemory result), show an amber banner: "Limited analysis — switch to Pro for full details."

**Player behavior:** Player keeps playing. No overlay. No modal.

**Component:** `src/components/WordPopover.tsx` (client component, `'use client'`)

---

## 2. Provider Toggle — Player Header + Profile Settings (Options A + C)

**Pattern:** The Pro/Free toggle appears in two places:

**A — Player Header pill** (always visible while on the player page):
- Small pill button top-right of the player page, next to the song title area
- Shows "Pro ✦" (blue dot) or "Free" (grey dot) with current mode
- Clicking switches mode immediately (PATCH `/api/user/settings`) and re-fetches open word card if any
- Only rendered when user is signed in (useSession check)

**C — Profile/Settings dropdown** (for settings-minded users):
- Same toggle, accessible from a profile icon or settings menu
- Labels include "Analysis Mode" section header, with Pro and Free as selectable options with descriptions
- This is a secondary access point; primary is the player header pill

**Component:** `src/components/ProviderToggle.tsx` (client component)

---

## 3. Deck Page — Rich Card Grid (Option B)

**URL:** `/deck`

**Pattern:** 2-column card grid. Each card shows:
- IPA in serif font (top, blue)
- Word (large, bold, white)
- Meaning (muted)
- Source song (♪ Song name, small grey)
- Due/Scheduled badge (blue pill for due, grey pill for scheduled)

**Header:** "My Deck" title + "Review N due →" button (links to `/review`) if any cards are due.

**Empty state:** "No words saved yet. Tap any word in the player to save it here."

**Due cards** have a `border-blue-700` border to visually highlight them; not-due cards have `border-slate-700` with reduced opacity.

**Component:** `src/app/(srs)/deck/page.tsx` (server component)

---

## 4. Review Session — Lyric Context Card (Option B)

**URL:** `/review`

**Pattern:** Shows the original song lyric line with the target word blanked out as `___` (highlighted in blue). Below that, reveals the word + IPA + meaning + register when "Show answer" is tapped.

**Layout per card:**
1. Song attribution: `♪ Papaoutai — Stromae` (small, grey)
2. Lyric context block: `___ où on va` (with `___` as a highlighted blue span)
3. Word + IPA + meaning + register (revealed after "Show answer")
4. Full FSRS 4-button rating: **Again** (red) / **Hard** (amber) / **Good** (green) / **Easy** (blue)

**Progress indicator:** "2 / 5 cards" at top.

**Session end:** "All done!" screen with "Back to deck" button.

**Components:**
- `src/app/(srs)/review/page.tsx` (server component — fetches due cards, auth guard)
- `src/app/(srs)/review/ReviewSession.tsx` (client component — interactive session)

---

## Data Flow

```
Player tap → WordToken.onTap → LyricsViewLoader.selectedWord state
  → WordPopover renders inline → fetches /api/vocab/analyze
  → shows analysis (IPA, meaning, register, examples)
  → "Save" → POST /api/srs/cards → card in deck

ProviderToggle (player header) → PATCH /api/user/settings
  → next analyze call uses new provider
  → if word card open: re-fetches with new provider

/deck (server) → GET srsCard where user_id → render grid
  → "Review N due" → /review

/review (server) → GET due cards → ReviewSession (client)
  → Show answer → rate → POST /api/srs/review
  → next card or "All done"
```

---

## Constraints

- All client components use `useSession()` from `next-auth/react`; player page must be wrapped in `SessionProvider`
- ProviderToggle only renders for signed-in users
- Inline card (WordPopover) does NOT use a modal or bottom sheet — it pushes lyric content down
- `is_partial: true` triggers amber banner in WordPopover, NOT an error state
- Review session takes at most 20 due cards per session (server-side `take: 20`)
