# Partner Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each user set a current mood/status (mode-aware fint/snusk options) that their partner sees live in the home page hero block.

**Architecture:** Add a nullable `status` column to `profiles`. AuthContext exposes `updateStatus()`. HomePage hero displays partner's status and a tappable chip lets the user set their own. Status options are hardcoded constants (not DB-driven) — mode-aware and translated sv/en. Real-time partner status updates via a dedicated separate `useEffect` in HomePage.

**Tech Stack:** Next.js 15, React 19, TypeScript, MUI 7, Supabase, next-intl

---

## Files

| File | Action | Purpose |
|------|--------|---------|
| `supabase-schema.sql` | Modify | Document new column |
| `src/types/index.ts` | Modify | Add `status` to Profile |
| `src/lib/statuses.ts` | Create | Status key constants + helpers |
| `messages/sv.json` | Modify | Status label strings |
| `messages/en.json` | Modify | Status label strings |
| `src/contexts/AuthContext.tsx` | Modify | Add `updateStatus()` |
| `src/views/HomePage.tsx` | Modify | Show partner status in hero + own status picker + realtime |

---

## Task 1: Database — add `status` column

**Files:** Supabase SQL editor + `supabase-schema.sql`

- [ ] Run in Supabase SQL editor:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text DEFAULT NULL;
```

- [ ] In `supabase-schema.sql`, add `status text` to the profiles table definition.

- [ ] Commit:
```bash
git add supabase-schema.sql
git commit -m "feat: add status column to profiles"
```

---

## Task 2: Status constants + translations

**Files:**
- Create: `src/lib/statuses.ts`
- Modify: `messages/sv.json`
- Modify: `messages/en.json`

- [ ] Create `src/lib/statuses.ts`:
```ts
export const FINT_STATUSES = [
  'behover_omtanke',
  'vill_vara_nara',
  'lugn_kvall',
  'pa_bra_humor',
] as const

export const SNUSK_STATUSES = [
  'kanner_sig_vild',
  'nyfiken',
  'laddad',
  'behover_distraktion',
] as const

export type StatusKey =
  | (typeof FINT_STATUSES)[number]
  | (typeof SNUSK_STATUSES)[number]

export const ALL_STATUS_KEYS: readonly string[] = [...FINT_STATUSES, ...SNUSK_STATUSES]

export function getStatusesForMode(mode: 'fint' | 'snusk') {
  return mode === 'snusk' ? SNUSK_STATUSES : FINT_STATUSES
}

/** Returns true if value is a known StatusKey — use before passing to useTranslations */
export function isValidStatusKey(value: string | null | undefined): value is StatusKey {
  return !!value && ALL_STATUS_KEYS.includes(value)
}
```

- [ ] Add to `messages/sv.json` under a new `"statuses"` key:
```json
"statuses": {
  "behover_omtanke": "Behöver omtanke",
  "vill_vara_nara": "Vill vara nära",
  "lugn_kvall": "Lugn kväll",
  "pa_bra_humor": "På bra humör",
  "kanner_sig_vild": "Känner sig vild",
  "nyfiken": "Nyfiken",
  "laddad": "Laddad",
  "behover_distraktion": "Behöver distraheras",
  "set_status": "Sätt din status",
  "clear_status": "Rensa status",
  "your_status": "Din status"
}
```

- [ ] Add to `messages/en.json` under `"statuses"`:
```json
"statuses": {
  "behover_omtanke": "Needs affection",
  "vill_vara_nara": "Want to be close",
  "lugn_kvall": "Quiet evening",
  "pa_bra_humor": "In a good mood",
  "kanner_sig_vild": "Feeling wild",
  "nyfiken": "Curious",
  "laddad": "Charged up",
  "behover_distraktion": "Needs distraction",
  "set_status": "Set your status",
  "clear_status": "Clear status",
  "your_status": "Your status"
}
```

- [ ] Commit:
```bash
git add src/lib/statuses.ts messages/sv.json messages/en.json
git commit -m "feat: status constants and translations"
```

---

## Task 3: Types + AuthContext

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/contexts/AuthContext.tsx`

- [ ] Add `status` to Profile in `src/types/index.ts`:
```ts
export interface Profile {
  id: string
  name: string
  partner_id: string | null
  pairing_code: string
  status: string | null
  created_at: string
}
```

- [ ] Add `updateStatus` to `AuthContextType` in `src/contexts/AuthContext.tsx`:
```ts
updateStatus: (status: string | null) => Promise<void>
```

- [ ] Implement `updateStatus` inside `AuthProvider`. Check for errors and only update local state on success:
```ts
async function updateStatus(status: string | null) {
  if (!user) return
  const { error } = await supabase.from('profiles').update({ status }).eq('id', user.id)
  if (!error) {
    setProfile(prev => prev ? { ...prev, status } : prev)
  }
}
```

- [ ] Add `updateStatus` to the Provider value object in the return statement.

- [ ] Commit:
```bash
git add src/types/index.ts src/contexts/AuthContext.tsx
git commit -m "feat: add updateStatus to AuthContext"
```

---

## Task 4: Display + set status in HomePage

**Files:**
- Modify: `src/views/HomePage.tsx`

This task adds two things:
1. Partner's current status shown in the hero block (if set)
2. Own-status picker below the hero (tappable chips)

- [ ] Add these imports at the top of `HomePage.tsx`:
```ts
import Chip from '@mui/material/Chip'
import { getStatusesForMode, isValidStatusKey } from '../lib/statuses'
import type { StatusKey } from '../lib/statuses'
```

- [ ] Update the `useAuth()` destructure to include `updateStatus`:
```ts
const { profile, partner, user, updateStatus } = useAuth()
```

- [ ] Add local state and translations hook near top of component:
```ts
const [statusOpen, setStatusOpen] = useState(false)
const ts = useTranslations('statuses')
```

- [ ] Inside the hero block, after the availability chip, add partner status display. Use `isValidStatusKey` to guard against unknown DB values:
```tsx
{isValidStatusKey(partner?.status) && (
  <Box display="flex" alignItems="center" gap={0.8} mt={0.8}
    sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
    <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.8 }}>
      <Icon icon="mdi:heart-pulse" />
    </Box>
    <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85 }}>
      {ts(partner!.status as StatusKey)}
    </Typography>
  </Box>
)}
```

- [ ] After the closing tag of the hero block (outside it), add the own-status section. Use `isValidStatusKey` to guard here too:
```tsx
{/* Own status */}
<Box px={2.5} pt={1.5} display="flex" alignItems="center" gap={1} flexWrap="wrap">
  <Typography variant="caption" color="text.secondary">{ts('your_status')}:</Typography>
  {isValidStatusKey(profile?.status) ? (
    <>
      <Chip
        label={ts(profile!.status as StatusKey)}
        size="small"
        color="primary"
        variant="outlined"
        onClick={() => setStatusOpen(s => !s)}
      />
      <Chip
        label={ts('clear_status')}
        size="small"
        variant="outlined"
        onClick={() => updateStatus(null)}
        sx={{ color: 'text.disabled', borderColor: 'divider' }}
      />
    </>
  ) : (
    <Chip
      label={ts('set_status')}
      size="small"
      variant="outlined"
      onClick={() => setStatusOpen(s => !s)}
      sx={{ color: 'text.secondary', borderColor: 'divider' }}
    />
  )}
</Box>

{statusOpen && (
  <Box px={2.5} pt={1} display="flex" gap={1} flexWrap="wrap">
    {getStatusesForMode(mode).map(key => (
      <Chip
        key={key}
        label={ts(key)}
        size="small"
        variant={profile?.status === key ? 'filled' : 'outlined'}
        color={profile?.status === key ? 'primary' : 'default'}
        onClick={() => { updateStatus(key); setStatusOpen(false) }}
      />
    ))}
  </Box>
)}
```

- [ ] Commit:
```bash
git add src/views/HomePage.tsx
git commit -m "feat: partner status in hero, own status picker on home page"
```

---

## Task 5: Real-time partner status updates

**Files:**
- Modify: `src/views/HomePage.tsx`

Add a **separate** `useEffect` (do NOT merge into the existing `home-availability` channel `useEffect`). This keeps cleanup logic isolated and avoids two `return` statements in one effect.

- [ ] Update the `useAuth()` destructure to also include `refreshProfile`:
```ts
const { profile, partner, user, updateStatus, refreshProfile } = useAuth()
```

- [ ] Add `import type { Profile } from '../types'` if not already imported in `HomePage.tsx`.

- [ ] Add a new `useEffect` after the existing realtime effect:
```ts
useEffect(() => {
  if (!partner?.id) return

  const channel = supabase
    .channel('partner-profile-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${partner.id}`,
    }, () => {
      refreshProfile()
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [partner?.id])
```

Note: `refreshProfile()` re-fetches both own profile and partner from Supabase. The payload is not used directly since `setPartner` is private to AuthProvider.

- [ ] Commit:
```bash
git add src/views/HomePage.tsx
git commit -m "feat: real-time partner status updates"
```

---

## Done

The feature is complete when:
- You can tap "Sätt din status" on the home page and pick from mode-appropriate options
- Partner sees your status live in the hero block without refreshing
- Clearing status removes it from the UI
- Swedish and English both work correctly
- Switching fint/snusk shows different status options
- Unknown/stale status values in DB do not crash the app
