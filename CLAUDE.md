# CLAUDE.md — Önska

Couples app where partners offer and order services from each other in two modes: **fint** (refined/light) and **snusk** (cheeky/dark).

## Commands
```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint
```
No test suite.

## Critical Rules
- **All `src/views/`** must be `'use client'`. Route files in `src/app/` are server-only thin wrappers.
- **No hardcoded strings.** Use `next-intl`. Translation files: `messages/sv.json` + `messages/en.json` — always update both.
- **No `any`.** Types live in `src/types/index.ts`.
- **Theming via `ModeContext`.** Use MUI `sx` + theme variables. Never hardcode colors.
- **Service-role key only in API routes** (`src/app/api/`). Use anon client everywhere else.

## Architecture
```
src/app/          → thin route wrappers (server)
src/views/        → page logic + UI (client) — core work happens here
src/components/   → reusable UI (Header, Navbar, SwipeToDelete, home/*)
src/contexts/     → AuthContext, ModeContext, LocaleContext
src/lib/          → supabase, themes, statuses, notifications
```

## Key Routes
| Route | View |
|---|---|
| `/` | `HomePage.tsx` — emotional hub, booking via bottom sheet |
| `/onskningar` | `OrdersPage.tsx` — incoming/outgoing orders |
| `/kalender` | `CalendarPage.tsx` — calendar + snusk opt-in per day |
| `/services` | `MyServicesPage.tsx` — manage own services |
| `/settings` | `SettingsPage.tsx` |

## Non-Obvious Behaviors

**`service_availability` = snusk opt-in, not blocking.**
A row means the user is *open* for that service on that date. Fint services are always available — no rows needed. CalendarPage only loads snusk services.

**Order state machine:**
```
pending → accepted   (receiver accepts + optional response_note)
pending → declined   (receiver declines OR auto-expired)
accepted → completed (receiver archives)
accepted → declined  (receiver changes mind)
```
Auto-expiry: on OrdersPage load, pending orders with `expires_at < now()` are set to `declined`.

**`expires_at` calculation (set at order creation):**
- Date + time → `${date}T${time}:00`
- Date only → `${date}T23:59:59`
- No date → `null`

**Mode affects:** theme, visible services, status pills, button copy ("Önska" vs "Sugen på"), service count labels ("omtankar" vs "fantasier").

**Realtime:** `orders` table published. `profiles` + `service_availability` may need manual enablement in Supabase Dashboard → Database → Replication.

## State / Context
- `useAuth()` → `{ user, profile, partner, loading, signIn, signOut, refreshProfile, updateStatus, pairWithPartner }`
- `ModeContext` → `'fint' | 'snusk'`, persisted as `onska-mode` in localStorage
- `LocaleContext` → `'sv' | 'en'`, persisted as `locale` in localStorage

**LocalStorage keys in use:** `onska-mode`, `locale`, `modeHintSeen`, `snuskOptInHintSeen`, `couply_onboarding_seen`, `couply_consent_seen`, `couply_pairing_code_prefill`

## Database
- `profiles`: `id, name, partner_id, pairing_code, status, push_subscription`
- `services`: `id, user_id, title, description, mode (fint|snusk), active`
- `service_availability`: `user_id, service_id, date` — snusk opt-in rows only
- `orders`: `id, from_user_id, to_user_id, service_id, status, expires_at, mode, note, response_note`
- RPC: `pair_with_partner(partner_code text)` — mutually sets `partner_id`

## Status Keys
- **Fint:** `behover_omtanke`, `vill_vara_nara`, `lugn_kvall`, `pa_bra_humor`
- **Snusk:** `kanner_sig_vild`, `nyfiken`, `laddad`, `behover_distraktion`

## API Routes
- `POST /api/send-notification` — order push notification to partner
- `POST /api/send-ping` — "tänker på dig" ping `{ from_user_id, to_user_id }`
- `POST /api/delete-account` — requires `Authorization: Bearer <token>`

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY              # server-only
SUPABASE_SERVICE_ROLE_KEY      # server-only
```
