# Önska

A couples app where partners offer and request acts of care or intimacy from each other — built as a personal project to explore real-time product design and full-stack development.

**Live:** [onska.vercel.app](https://onska.vercel.app)

---

## What it does

Partners pair up and each create a list of services they're willing to offer. The other partner can then browse and place orders — with an optional note, date, and time. Orders flow through a simple state machine: pending → accepted → completed (or declined at any step).

The app has two distinct modes toggled by the user:

- **Fint** — acts of care and quality time (light theme)
- **Snusk** — a more intimate mode with a separate opt-in calendar and darker theme

Both modes share the same underlying architecture but render different content, copy, and visual identity.

---

## Features

- Partner pairing via generated codes
- Service catalog per user, scoped by mode
- Order flow with notes, expiry, and response messages
- Opt-in calendar for snusk availability (per service, per day)
- Real-time order updates via Supabase Realtime
- Push notifications (Web Push / VAPID) for new orders and pings
- "Thinking of you" ping — a lightweight non-order signal
- Status indicators so partners can signal how they're feeling
- Swedish/English localisation via `next-intl`
- Mobile-first, installable as a PWA

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | Material UI + custom theming |
| Backend | Supabase (Postgres, Auth, Realtime) |
| Push | Web Push API + VAPID |
| i18n | next-intl |
| Deploy | Vercel |

---

## Architecture notes

The app is split into thin server route wrappers (`src/app/`) and client-side view components (`src/views/`). Shared UI lives in `src/components/`, and context providers (`AuthContext`, `ModeContext`, `LocaleContext`) handle global state without a dedicated state library.

Database access follows a strict boundary: the Supabase service-role key is only used in API routes. All client-side code uses the anon key with Row Level Security.

---

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env.local` with Supabase and VAPID credentials. See `.env.example` if present.
