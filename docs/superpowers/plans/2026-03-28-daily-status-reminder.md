# Daily Status Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-reset user status at 23:59 each day and send a push notification at 11:00 to users who haven't set their status yet.

**Architecture:** Two Vercel Cron Jobs trigger two Next.js API routes on a daily schedule. Both routes are secured with `CRON_SECRET`. The reset route nulls all non-null statuses. The reminder route fetches users with no status + a valid push subscription and sends each a push notification.

**Tech Stack:** Next.js 15 API routes, Vercel Cron Jobs, web-push, Supabase service-role client.

---

### Task 1: Add vercel.json with cron schedule

**Files:**
- Create: `vercel.json` (repo root)

- [ ] **Step 1: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/reset-statuses",
      "schedule": "59 22 * * *"
    },
    {
      "path": "/api/send-status-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

> `59 22 * * *` = 22:59 UTC = 23:59 CET (off by 1h during CEST, becomes 00:59)
> `0 10 * * *`  = 10:00 UTC = 11:00 CET (off by 1h during CEST, becomes 12:00)

- [ ] **Step 2: Add CRON_SECRET to environment**

Add to `.env.local`:
```
CRON_SECRET=<generate a random secret, e.g. openssl rand -hex 32>
```

Also add `CRON_SECRET` to Vercel project environment variables (Vercel Dashboard → Settings → Environment Variables).

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when invoking cron routes.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel cron schedule for status reset and daily reminder"
```

---

### Task 2: Create reset-statuses API route

Runs at 22:59 UTC. Sets `status = null` for all profiles where status is not already null.

**Files:**
- Create: `src/app/api/reset-statuses/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error, count } = await supabase
    .from('profiles')
    .update({ status: null })
    .not('status', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, reset: count })
}
```

- [ ] **Step 2: Verify locally (optional)**

```bash
curl -X POST http://localhost:3000/api/reset-statuses \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

Expected: `{"success":true,"reset":<n>}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reset-statuses/route.ts
git commit -m "feat: add reset-statuses cron API route"
```

---

### Task 3: Create send-status-reminders API route

Runs at 10:00 UTC. Finds all users with `status IS NULL` and a valid `push_subscription`, fetches their partner's name, sends a personalised push.

**Files:**
- Create: `src/app/api/send-status-reminders/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    webpush.setVapidDetails(
      'mailto:noreply@onska.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )
  } catch (e) {
    return NextResponse.json({ error: 'VAPID init failed', detail: String(e) }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Fetch users without status who have a push subscription and a partner
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, push_subscription, partner_id')
    .is('status', null)
    .not('push_subscription', 'is', null)
    .not('partner_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!users?.length) return NextResponse.json({ success: true, sent: 0 })

  // Fetch partner names in one query
  const partnerIds = users.map(u => u.partner_id)
  const { data: partners } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', partnerIds)

  const partnerMap = Object.fromEntries((partners ?? []).map(p => [p.id, p.name]))

  let sent = 0
  await Promise.all(users.map(async (user) => {
    const partnerName = partnerMap[user.partner_id] ?? 'din partner'
    try {
      await webpush.sendNotification(
        JSON.parse(user.push_subscription),
        JSON.stringify({
          title: 'Hur mår du idag? 💛',
          body: `Berätta för ${partnerName} hur du känner dig just nu`,
          icon: '/icon.svg',
          url: '/',
        })
      )
      sent++
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 410 || status === 404) {
        await supabase.from('profiles').update({ push_subscription: null }).eq('id', user.id)
      }
    }
  }))

  return NextResponse.json({ success: true, sent })
}
```

- [ ] **Step 2: Verify locally (optional)**

```bash
curl -X POST http://localhost:3000/api/send-status-reminders \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

Expected: `{"success":true,"sent":<n>}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/send-status-reminders/route.ts
git commit -m "feat: add send-status-reminders cron API route"
```
