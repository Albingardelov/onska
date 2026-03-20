# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
npm start        # Run production server
```

No test suite is configured.

## Architecture

**Önska** is a couples app where partners can offer and order services from each other. Services are categorized as *fint* (refined) or *snusk* (cheeky), toggled via a light/dark mode switch.

**Stack:** Next.js 15 App Router, React 19, TypeScript, MUI 7, Supabase (PostgreSQL + Realtime + Auth), next-intl (sv/en).

### File structure

Routes (thin) → `src/views/` (page logic) → `src/components/` (reusable UI) → `src/contexts/` → Supabase. All views are `'use client'`. Root `layout.tsx` is server-side (SEO metadata, fonts).

```
src/
├── app/                     # Thin route wrappers
│   ├── layout.tsx           # Server: SEO metadata, fonts, providers
│   ├── (app)/layout.tsx     # Server wrapper → AuthGuard client
│   ├── api/                 # send-notification, send-service-notification, delete-account
│   ├── login/, pairing/
│   └── (app)/               # Protected routes: /, /onskningar, /kalender, /services, /settings
├── views/                   # Page-level client components (logic + rendering)
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── OnboardingPage.tsx   # 3-step slide-animated wizard, QR generation (lazy-loaded)
│   ├── PairingPage.tsx
│   ├── OrdersPage.tsx
│   ├── CalendarPage.tsx
│   ├── MyServicesPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── Header.tsx           # Sticky AppBar: title, partner name, ModeToggle, settings, logout
│   ├── ModeToggle.tsx       # Icon button fint/snusk toggle
│   ├── Navbar.tsx           # Bottom navigation (5 tabs)
│   ├── Providers.tsx        # All context providers
│   └── SwipeToDelete.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── ModeContext.tsx
│   └── LocaleContext.tsx
├── lib/
│   ├── supabase.ts          # Anon client (service-role only in API routes)
│   ├── themes.ts            # fintTheme (light/pink), snuskTheme (dark)
│   ├── statuses.ts          # Status key constants + helpers
│   └── notifications.ts    # Push subscription logic
└── types/index.ts
```

### Route structure

- `/` → `HomePage.tsx` — browse partner's services, place orders, set own status
- `/onskningar` → `OrdersPage.tsx` — manage incoming/outgoing orders
- `/kalender` → `CalendarPage.tsx` — calendar, block services per day
- `/services` → `MyServicesPage.tsx` — manage own services (note: CLAUDE.md had `/mina-tjanster` but route is `/services`)
- `/settings` → `SettingsPage.tsx` — account, language, GDPR export/delete
- `/login` → `LoginPage.tsx` — sign in / sign up / forgot password
- `/pairing` → `OnboardingPage.tsx` / `PairingPage.tsx` — onboarding wizard + partner pairing
- `/(app)/layout.tsx` — auth guard; redirects unauthenticated → `/login`, unpaired → `/pairing`

---

## State management

### AuthContext (`src/contexts/AuthContext.tsx`)

**State:** `user`, `session`, `profile: Profile | null`, `partner: Profile | null`, `loading`

**Functions:**
- `signIn(email, password)` → `Promise<string | null>` (error or null)
- `signUp(email, password, name)` → generates 6-char uppercase alphanumeric pairing_code, inserts profile
- `signOut()`
- `pairWithPartner(code)` → calls `supabase.rpc('pair_with_partner', { partner_code: code.toUpperCase() })`
- `refreshProfile()` → re-fetches profile + partner from DB
- `updateStatus(status: string | null)` → writes to `profiles.status`

**Lifecycle:** on mount gets session, subscribes to `onAuthStateChange`, on user: fetchProfile + subscribeToPush

### ModeContext — `onska-mode` in localStorage, values: `'fint' | 'snusk'`
### LocaleContext — `locale` in localStorage, values: `'sv' | 'en'`

**LocalStorage keys in use:** `onska-mode`, `locale`, `modeHintSeen`, `couply_onboarding_seen`, `couply_consent_seen`, `couply_pairing_code_prefill`

---

## Data types (`src/types/index.ts`)

```typescript
type Mode = 'fint' | 'snusk'
type OrderStatus = 'pending' | 'accepted' | 'declined' | 'completed'

interface Profile {
  id: string                    // uuid, FK auth.users
  name: string
  partner_id: string | null
  pairing_code: string          // 6 uppercase alphanumeric
  status: string | null         // StatusKey or null
  push_subscription?: string    // JSON-stringified PushSubscription
  created_at: string
}

interface Service {
  id: string
  user_id: string
  title: string
  description: string | null
  mode: Mode
  active: boolean
  created_at: string
}

interface ServiceAvailability {
  user_id: string
  service_id: string
  date: string                  // YYYY-MM-DD
}

interface Order {
  id: string
  from_user_id: string
  to_user_id: string
  service_id: string
  date: string | null           // YYYY-MM-DD
  status: OrderStatus
  note: string | null           // wisher's optional message
  response_note: string | null  // receiver's optional response (e.g. "kl 19")
  expires_at: string | null     // ISO timestamp
  mode: Mode
  created_at: string
  service?: Service             // joined
  from_profile?: Profile        // joined
  to_profile?: Profile          // joined
}
```

---

## Database (Supabase)

Schema file: `supabase-schema.sql`. Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, partner link, status, push subscription |
| `services` | Services offered by users (fint/snusk, active flag) |
| `service_availability` | Per-service blocked dates (user_id + service_id + date PK) |
| `orders` | Orders placed between partners |
| `availability` | **Deprecated**, unused |

**RLS:** Only paired partners see each other's data. Each table has select/insert/update/delete policies enforcing `auth.uid()` ownership.

**Realtime publication:** `orders` table confirmed. `profiles` and `service_availability` may need manual enablement in Supabase Dashboard (Database → Replication).

**RPC:** `pair_with_partner(partner_code text)` — sets `partner_id` on both users mutually.

---

## Status system (`src/lib/statuses.ts`)

Users set a mood visible to their partner. Stored in `profiles.status`.

| Mode | Keys |
|------|------|
| fint | `behover_omtanke`, `vill_vara_nara`, `lugn_kvall`, `pa_bra_humor` |
| snusk | `kanner_sig_vild`, `nyfiken`, `laddad`, `behover_distraktion` |

- User clicks status pills on HomePage → `updateStatus(key|null)` in AuthContext
- Clicking active status deselects it (sets null)
- Partner's status shown in hero section of HomePage with heart-pulse icon
- Real-time: HomePage subscribes to `profiles` changes for `partner.id` → calls `refreshProfile()`

---

## Order state machine

```
pending → accepted   (receiver clicks "Ja, gärna!" + optional response_note)
pending → declined   (receiver clicks decline, OR auto-expired)
accepted → completed (receiver archives)
accepted → declined  (receiver changes mind)
```

**Auto-expiry:** On OrdersPage load, pending orders with `expires_at < now()` are auto-updated to `declined`. UI shows "Missad" label for these.

**expires_at calculation** (set at order creation):
- Date + time selected → `${date}T${time}:00` ISO
- Date only → `${date}T23:59:59` ISO
- No date → `null`

---

## Views — key sections

### HomePage.tsx
1. Hero banner — greeting, partner's availability today, partner's status
2. Status pills — user's own mood (filtered by current mode)
3. Notification prompt — one-time banner (`modeHintSeen`)
4. Planned orders — accepted orders user has created
5. Partner services grid — partner's active services for current mode; blocked services visually indicated
6. Date picker — horizontal scroll, 14-day range, "no specific date" option
7. Time picker — 08:00–23:00 grid, past times on today disabled
8. Note field — optional message
9. Submit button + success toast (3.2s fade)

**Realtime subscriptions:**
- `home-availability` → `service_availability` changes → reloads today's blocked services
- `partner-profile-updates` → partner `profiles` UPDATE → `refreshProfile()`

### OrdersPage.tsx
- Tab 0: Incoming (to_user_id = user) — active section + history grouped by week
- Tab 1: Outgoing (from_user_id = user) — same layout, swipe-to-delete in history
- Consent banner (shown once, `couply_consent_seen`)
- Realtime: subscribes to `orders` changes → reloads

### CalendarPage.tsx
- Month navigation with day grid (Mon–Sun)
- Blue dot = accepted order on that day; orange dot = blocked service on that day
- Click day → panel with that day's orders + per-service toggle switches
- Toggling a service inserts/deletes from `service_availability`
- Upcoming section shows future accepted orders

### MyServicesPage.tsx
- Add service form (title + description, mode-aware)
- Service list with delete (SwipeToDelete)
- Notification prompt

### SettingsPage.tsx
- Account info (read-only: name, email)
- Language toggle (sv/en)
- GDPR: Export data as JSON (`couply-data-YYYY-MM-DD.json`) + Delete account (dialog → POST `/api/delete-account`)
- Sign out

---

## API routes

**POST `/api/send-notification/`**
Body: `{ record: { to_user_id, from_user_id, service_id, mode, status? } }`
- Fetches recipient's `push_subscription`, sender name, service title
- Sends web-push via `web-push` + VAPID
- If `status='accepted'`: "Ny önskan intressant!" else "Ny önskan från din partner"
- On 410/404: nulls out `push_subscription` in DB

**POST `/api/send-service-notification/`**
Body: `{ record: { user_id, title, mode } }`
- Notifies partner when a service is added (currently unused in UI, intended for DB trigger)

**POST `/api/delete-account/`**
- Requires `Authorization: Bearer <token>`
- Unlinks partner, cascading deletes all user data, deletes auth user

---

## Push notifications

- `public/sw.js` — service worker: install (skipWaiting), activate (claim), handles `push` events, shows notification, on click navigates to `event.data.url`
- `src/lib/notifications.ts` — `subscribeToPush()`: requests permission, creates PushSubscription, saves JSON to `profiles.push_subscription`
- VAPID keys: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client) + `VAPID_PRIVATE_KEY` (server)

---

## Theming

Two MUI themes in `src/lib/themes.ts`: `fintTheme` (light, pink) and `snuskTheme` (dark). Driven by `ModeContext`. Mode affects: theme colors, visible services, status pills, button labels ("Önska" vs "Sugen på"), service count labels ("omtankar" vs "fantasier"), notification icons.

---

## Translations

Files: `messages/sv.json` and `messages/en.json` — keep in sync. Key namespaces: `common`, `nav`, `header`, `login`, `onboarding`, `pairing`, `home`, `orders`, `calendar`, `services`, `settings`, `statuses`.

---

## UX patterns

- **QR pairing** — QR encodes `${origin}/pairing?code=XXXX`; scanning saves code to `couply_pairing_code_prefill` (survives login redirect)
- **Onboarding** — 3-step wizard for new users; `couply_onboarding_seen` skips to pairing form for returning users
- **Consent banner** in `/onskningar` — dismissed via `couply_consent_seen`
- **Haptic + confetti** — plays on accept order
- **SwipeToDelete** — swipe left to delete in order history

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY              # server-only
SUPABASE_SERVICE_ROLE_KEY      # server-only
```
