# Lighthouse Optimization Design

**Date:** 2026-03-17
**Goal:** Improve Lighthouse scores across all 12 pages (6 light, 6 dark)
**Current scores:** Performance avg 78, Accessibility avg 98, SEO 90, Best Practices 100
**Target:** Accessibility 100, SEO 100, Performance improved

**Phase 1 status:** Fix 1 (calendar contrast) is already applied. Fixes 2–4 remain.

---

## Phase 1: Accessibility → 100

### Fix 1: Calendar past-date contrast (ALREADY DONE ✅)
**File:** `src/views/CalendarPage.tsx`
**Issue:** Past days used `opacity: 0.35` on the cell container, making date numbers render at ~2.23:1 contrast.
**Fix applied:** Removed opacity from container. Added `isPast ? '#767676' : 'text.primary'` as Typography color.
**Result:** #767676 on #FDF6F8 = 4.54:1 ✅ / #767676 on #080204 = 5.16:1 ✅

### Fix 2: Settings outlined buttons — dark mode
**File:** `src/lib/themes.ts` (snuskTheme)
**Issue:** Outlined primary buttons use `primary.main` (#C41230) as text color on `#12040A` background → 1.94:1 ❌
**Affected elements:** "🇸🇪 Svenska" and "Export my data" buttons in SettingsPage
**Fix:** Add `MuiButton` styleOverride in snuskTheme for the outlined+primary variant to use `#F5E4E8` (text.primary) as text color. Border color can remain crimson.

### Fix 3: Settings "Delete"-button — light mode
**File:** `src/lib/themes.ts` (fintTheme)
**Issue:** `error.main = #E53935` on `#FDF6F8` background → 4.03:1 ❌ (WCAG AA requires 4.5:1)
**Fix:** Change fintTheme `error.main` from `#E53935` to `#C62828` → contrast 4.98:1 ✅

### Fix 4: Önskningar tab selected text — dark mode
**File:** `src/lib/themes.ts` (snuskTheme)
**Issue:** Active MUI Tab uses `primary.main` (#C41230) as text color on `background.paper` (#12040A) → 1.94:1 ❌
**Affected element:** "Till mig" tab in OrdersPage
**Fix:** Add `MuiTabs` and/or `MuiTab` styleOverride in snuskTheme so the selected tab text color is `#F5E4E8`.

---

## Phase 2: SEO → 100

### Fix 5: Meta description missing on all pages
**Issue:** `src/app/(app)/layout.tsx` is `'use client'` (needs auth hooks). Next.js 15 only outputs metadata from server components. Root `layout.tsx` exports description but the per-route metadata doesn't appear in rendered HTML because the nearest wrapping layout is a client component.

**Fix:** Split `(app)/layout.tsx` into two files:

**File 1: `src/app/(app)/AuthGuard.tsx`** — new file, client component
Contains: the existing `'use client'` auth logic (useEffect redirect, loading spinner, layout Box structure with Navbar).

```tsx
'use client'
// All existing content from (app)/layout.tsx goes here
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // ... existing useEffect, loading check, Box/Navbar JSX
}
```

**File 2: `src/app/(app)/layout.tsx`** — rewritten as server component (no 'use client')
Contains: metadata export + renders AuthGuard.

```tsx
import type { Metadata } from 'next'
import { AuthGuard } from './AuthGuard'

export const metadata: Metadata = {
  description: 'Turn wishes into moments',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
```

---

## Phase 3: Performance — quick wins

### Fix 6: Remove legacy JavaScript polyfills (~11KB)
**File:** `.browserslistrc` (new file at project root)
**Issue:** Next.js transpiles for old browsers and injects unnecessary polyfills.
**Fix:** Create `.browserslistrc` with modern browser targets:
```
last 2 Chrome versions
last 2 Firefox versions
last 2 Safari versions
last 2 Edge versions
```
**Note:** This drops support for browsers older than ~2 years. Acceptable for a couples app with a modern mobile-first audience.

### Fix 7: Dynamic imports for PairingPage heavy libraries
**File:** `src/views/PairingPage.tsx`
**Issue:** `qrcode.react` (~40KB) and `jsqr` (~180KB) are statically imported and bundled into the shared JS chunk, loaded on every page even though they're only used in PairingPage.
**Fix:**
- Replace `import { QRCodeSVG } from 'qrcode.react'` with `next/dynamic`: `const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })`
- Replace the static `import jsQR from 'jsqr'` with a dynamic `import('jsqr')` inside the camera scan callback function (not at module level)

---

## Out of scope

- SSR migration (Supabase SSR + server components rewrite) — separate initiative
- Render-blocking CSS — Next.js internals, not addressable from app code
- LCP on data-dependent pages — bound by Supabase query time, not code
- Suspense wrappers for client components — Suspense only streams HTML for async server components; without SSR it does not reduce TBT for client component pages

---

## Files touched

| File | Change |
|------|--------|
| `src/views/CalendarPage.tsx` | ✅ Already done |
| `src/lib/themes.ts` | Fix 2, 3, 4 |
| `src/app/(app)/layout.tsx` | Fix 5 — rewrite as server component |
| `src/app/(app)/AuthGuard.tsx` | Fix 5 — new file, client component |
| `.browserslistrc` | Fix 6 — new file |
| `src/views/PairingPage.tsx` | Fix 7 — dynamic imports |
