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

### Route structure

- `/` — protected home page where you browse partner's services and place orders
- `/onskningar` — orders management (incoming/outgoing)
- `/kalender` — calendar availability
- `/mina-tjanster` — manage your own services
- `/settings` — account settings, language, GDPR export/delete
- `/login` — auth (sign up / sign in)
- `/pairing` — onboarding + partner pairing (3-step wizard for new users, pairing form for returning)
- `/(app)/layout.tsx` — auth guard; redirects unauthenticated users to `/login`, unpaired users to `/pairing`

### Key UX patterns

- **ModeToggle** (`src/components/ModeToggle.tsx`) — icon-only `IconButton` in the Header; toggles fint/snusk theme
- **Header** (`src/components/Header.tsx`) — sticky AppBar with page title, partner name subtitle, ModeToggle + settings + logout icons
- **Onboarding** — new users see 3-step slide-animated wizard on `/pairing`; returning unpaired users skip to step 3 (pairing form) via `localStorage` key `couply_onboarding_seen`
- **QR pairing** — step 3 shows a QR code encoding `${origin}/pairing?code=XXXX`; scanning auto-triggers pairing. The `?code=` param is saved to `localStorage` key `couply_pairing_code_prefill` so it survives a login redirect.
- **Consent banner** in `/onskningar` shown once, dismissed to `localStorage` key `couply_consent_seen`
- **LocalStorage keys in use:** `modeHintSeen`, `couply_onboarding_seen`, `couply_consent_seen`, `couply_pairing_code_prefill`

### Data layer

All data lives in Supabase. The schema is in `supabase-schema.sql`. Key tables: `profiles`, `services`, `availability`, `orders`, `service_availability`.

Row-Level Security (RLS) is the authorization layer — only paired partners can see each other's data. Use the anon Supabase client (`src/lib/supabase.ts`) for user-facing operations; the service-role client is only used server-side in API routes.

Real-time updates use `supabase.channel()` postgres_changes subscriptions. These are set up inside `useEffect` in view components and cleaned up on unmount.

### State management

Three React contexts in `src/contexts/`:
- `AuthContext` — session, profile, partner data, auth operations (sign in/up/out, pairing)
- `ModeContext` — fint/snusk theme toggle (persisted to `localStorage`)
- `LocaleContext` — language selection (sv/en)

All contexts are provided in `src/components/Providers.tsx`.

### Theming

Two MUI themes are defined in `src/lib/themes.ts`: `fintTheme` (light, pink) and `snuskTheme` (dark). The active theme is driven by `ModeContext`.

### Translations

Translation files are at `messages/sv.json` and `messages/en.json`. Both languages must be kept in sync when adding new strings.

### Push notifications

- `public/sw.js` — service worker that handles incoming push events
- `src/lib/notifications.ts` — client-side push subscription logic
- `src/app/api/send-notification/` — server API route that sends pushes via `web-push`
- VAPID keys required in environment (see `.env.example`)

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY              # server-only
SUPABASE_SERVICE_ROLE_KEY      # server-only
```
