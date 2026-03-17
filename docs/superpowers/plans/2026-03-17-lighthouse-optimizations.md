# Lighthouse Optimizations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Lighthouse failures to reach Accessibility 100, SEO 100, and improved Performance scores.

**Architecture:** Three independent phases — (1) theme-level contrast fixes, (2) layout refactor to enable server-side metadata, (3) bundle size reduction via browserslist + dynamic imports. Each phase is self-contained and can be committed independently.

**Tech Stack:** Next.js 15 App Router, MUI v7, TypeScript. No test suite — verification is done by building and checking in browser/Lighthouse.

**Spec:** `docs/superpowers/specs/2026-03-17-lighthouse-optimizations-design.md`

**Note:** Fix 1 (calendar contrast) is already done. Start from Task 1.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/themes.ts` | Modify | Fix 2: snusk outlined button contrast, Fix 3: fint error color, Fix 4: snusk tab selected color |
| `src/app/(app)/AuthGuard.tsx` | Create | Fix 5: client component with auth logic (extracted from layout) |
| `src/app/(app)/layout.tsx` | Rewrite | Fix 5: server component that exports metadata |
| `.browserslistrc` | Create | Fix 6: target modern browsers, remove legacy polyfills |
| `src/views/OnboardingPage.tsx` | Modify | Fix 7: dynamic imports for qrcode.react and jsqr (note: spec mistakenly listed PairingPage — the QR libs live in OnboardingPage) |

---

## Task 1: Theme contrast fixes

**Spec:** Fixes 2, 3, 4
**Files:**
- Modify: `src/lib/themes.ts`

### What to change

**Fix 2 — snusk outlined buttons:** In `snuskTheme`, `MuiButton.styleOverrides`, add an `outlinedPrimary` key that sets `color: '#F5E4E8'`. This makes outlined primary buttons use the light text color instead of `primary.main` (#C41230) which fails contrast on dark backgrounds.

**Fix 3 — fint error color:** In `fintTheme`, change `error: { main: '#E53935' }` to `error: { main: '#C62828' }`. The darker red has 4.98:1 contrast on `#FDF6F8` vs the current 4.03:1.

**Fix 4 — snusk tab selected color:** In `snuskTheme`, add `MuiTab` to the `components` section with a `styleOverrides.root` that targets `.Mui-selected` and sets `color: '#F5E4E8'`. This overrides MUI's default behavior of using `primary.main` (#C41230) for the selected tab.

- [ ] **Step 1: Open `src/lib/themes.ts` and apply Fix 3**

In `fintTheme`, change:
```ts
error: { main: '#E53935' },
```
To:
```ts
error: { main: '#C62828' },
```

- [ ] **Step 2: Apply Fix 2 — snusk outlined button contrast**

In `snuskTheme`, find the existing `MuiButton` component override:
```ts
MuiButton: {
  defaultProps: { disableElevation: true },
  styleOverrides: {
    root: { borderRadius: 8, padding: '11px 22px', fontSize: '0.95rem', letterSpacing: '-0.01em' },
  },
},
```
Add `outlinedPrimary` to `styleOverrides`:
```ts
MuiButton: {
  defaultProps: { disableElevation: true },
  styleOverrides: {
    root: { borderRadius: 8, padding: '11px 22px', fontSize: '0.95rem', letterSpacing: '-0.01em' },
    outlinedPrimary: { color: '#F5E4E8' },
  },
},
```

- [ ] **Step 3: Apply Fix 4 — snusk tab selected color**

In `snuskTheme.components`, add a new `MuiTab` entry (after `MuiBottomNavigationAction`):
```ts
MuiTab: {
  styleOverrides: {
    root: {
      '&.Mui-selected': { color: '#F5E4E8' },
    },
  },
},
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```
Expected: Build completes with no TypeScript errors.

- [ ] **Step 5: Manual check**
Open the app in browser, switch to snusk mode:
- Go to `/settings` — "Svenska" and "Export"-buttons should have light text when not selected
- Go to `/settings` in light mode — "Delete my account" button should be visible (darker red)
- Go to `/onskningar` in snusk mode — "Till mig" tab should show white text when selected

- [ ] **Step 6: Commit**

```bash
git add src/lib/themes.ts
git commit -m "fix: accessibility contrast — outlined buttons, error color, tab selected"
```

---

## Task 2: SEO meta description — layout split

**Spec:** Fix 5
**Files:**
- Create: `src/app/(app)/AuthGuard.tsx`
- Modify: `src/app/(app)/layout.tsx`

### What to do

The current `(app)/layout.tsx` is `'use client'` because it uses auth hooks. This prevents Next.js from outputting metadata to the HTML head. Solution: extract the client logic into `AuthGuard.tsx`, then rewrite `layout.tsx` as a server component that exports metadata.

- [ ] **Step 1: Create `src/app/(app)/AuthGuard.tsx`**

This is the entire existing content of `(app)/layout.tsx`, turned into a named export component:

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { Navbar } from '@/src/components/Navbar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login')
      else if (!profile?.partner_id) router.replace('/pairing')
    }
  }, [user, profile, loading, router])

  if (loading || !user || !profile?.partner_id) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
        <CircularProgress color="primary" />
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" height="100dvh" bgcolor="background.default">
      <Box component="main" flex={1} overflow="auto" sx={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        {children}
      </Box>
      <Navbar />
    </Box>
  )
}
```

- [ ] **Step 2: Rewrite `src/app/(app)/layout.tsx`**

Replace the entire file content with:

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

Note: No `'use client'` directive — this is intentionally a server component.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: Build completes with no errors. If you see "You are attempting to export metadata from a component marked with 'use client'", check that `layout.tsx` does NOT have `'use client'` at the top.

- [ ] **Step 4: Manual check**

Open the app, navigate to `/` — should still show the home page after login. Auth redirect to `/login` should still work when not logged in. The loading spinner should still appear while auth resolves.

- [ ] **Step 5: Check metadata in HTML**

In browser DevTools, open the Elements tab and search for `<meta name="description"` in `<head>`. It should show `content="Turn wishes into moments"`.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/AuthGuard.tsx src/app/(app)/layout.tsx
git commit -m "fix: split app layout to server component for SEO metadata"
```

---

## Task 3: Remove legacy JavaScript polyfills

**Spec:** Fix 6
**Files:**
- Create: `.browserslistrc`

- [ ] **Step 1: Create `.browserslistrc` at project root**

```
last 2 Chrome versions
last 2 Firefox versions
last 2 Safari versions
last 2 Edge versions
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```
Expected: Build completes. The output should show slightly smaller JS chunks compared to before.

- [ ] **Step 3: Commit**

```bash
git add .browserslistrc
git commit -m "perf: target modern browsers to remove legacy JS polyfills"
```

---

## Task 4: Dynamic imports for heavy QR libraries

**Spec:** Fix 7
**Files:**
- Modify: `src/views/OnboardingPage.tsx`

### What to change

`qrcode.react` and `jsqr` are statically imported in `OnboardingPage.tsx` (lines 17–18). These only matter during the onboarding flow (new users only). Replace with lazy loading:

- `QRCodeSVG` → `next/dynamic` so it's code-split into a separate chunk
- `jsqr` → dynamic `import()` inside a ref, loaded only when the QR scanner starts

- [ ] **Step 1: Replace `QRCodeSVG` import with dynamic import**

Remove line 17:
```ts
import { QRCodeSVG } from 'qrcode.react'
```

Add at the top of the file (after `'use client'`, before other imports):
```ts
import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })
```

- [ ] **Step 2: Replace jsqr static import with a ref-based lazy loader**

Remove line 18:
```ts
import jsQR from 'jsqr'
```

Inside the `OnboardingPage` function body, add a ref to hold the loaded library (place it near the other refs):
```ts
const jsQRRef = useRef<((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null>(null)
```

- [ ] **Step 3: Load jsqr lazily when scanning starts**

Find the `startScanner` function (or the useEffect/callback that opens the camera). Add the dynamic import at the start of that function, before the camera code:

```ts
// Load jsqr lazily on first scan
if (!jsQRRef.current) {
  const mod = await import('jsqr')
  jsQRRef.current = mod.default
}
```

Note: `startScanner` already uses `async/await` (it calls `navigator.mediaDevices.getUserMedia`), so this fits naturally.

- [ ] **Step 4: Update `scanFrame` to use the ref**

Find the line in `scanFrame` that calls `jsQR(...)`:
```ts
const result = jsQR(imageData.data, imageData.width, imageData.height)
```

Replace with:
```ts
const result = jsQRRef.current ? jsQRRef.current(imageData.data, imageData.width, imageData.height) : null
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```
Expected: Build completes. You should now see a separate chunk for `qrcode.react` in the build output instead of it being bundled into the main chunk.

- [ ] **Step 6: Manual check**

Open the app and go through the onboarding flow (or test on `/pairing`). The QR code should still display. The QR scanner should still scan a code. If jsqr loads slightly later, the first few animation frames will skip scanning — this is acceptable (imperceptible to users).

- [ ] **Step 7: Commit**

```bash
git add src/views/OnboardingPage.tsx
git commit -m "perf: lazy load qrcode.react and jsqr in OnboardingPage"
```

---

## Final verification

- [ ] Run `npm run build` — confirm no errors
- [ ] Deploy to Vercel (or test locally with `npm start`)
- [ ] Run Lighthouse on home, calendar, settings, and önskningar pages
- [ ] Verify: Accessibility = 100 on all pages
- [ ] Verify: SEO = 100 on all pages (meta description present in HTML)
- [ ] Verify: Performance improved vs baseline (avg 78 → target 85+)
