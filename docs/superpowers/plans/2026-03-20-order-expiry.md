# Order Expiry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to pick a time when placing an order; if the partner hasn't accepted by that time the order is automatically declined.

**Architecture:** Add `expires_at timestamptz` to the `orders` table. Surface a time-chip picker in `HomePage` after a date is selected. On every `loadOrders` call in `OrdersPage`, batch-decline any pending orders whose `expires_at` is in the past.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, MUI 7, Supabase, next-intl (sv/en), date-fns, Iconify (`@iconify/react`).

**Spec:** `docs/superpowers/specs/2026-03-20-order-expiry-design.md`

---

## File Map

| File | Change |
|---|---|
| `supabase-schema.sql` | Document new column (comment + migration SQL) |
| `src/types/index.ts` | Add `expires_at: string \| null` to `Order` |
| `messages/sv.json` | Add `home.pick_time`, `orders.expires_at_label` |
| `messages/en.json` | Add `home.pick_time`, `orders.expires_at_label` |
| `src/views/HomePage.tsx` | Add `selectedTime` state, time-chip picker UI, set `expires_at` in `placeOrder` |
| `src/views/OrdersPage.tsx` | Auto-decline logic in `loadOrders`, expiry chip on pending order card |

---

## Task 1: Database migration

**Files:**
- Modify: `supabase-schema.sql`

> There is no migration runner in this project. Run the SQL directly in the Supabase SQL Editor.

- [ ] **Step 1: Add the column comment and migration snippet to supabase-schema.sql**

In `supabase-schema.sql`, add the following after the `orders` table `create table` block (around line 47, after the closing `);`):

```sql
-- Migration: add expires_at
-- Run this in Supabase SQL Editor if the column doesn't exist yet:
-- alter table public.orders add column expires_at timestamptz default null;
```

- [ ] **Step 2: Run the migration in Supabase**

In the Supabase dashboard → SQL Editor, run:

```sql
alter table public.orders add column expires_at timestamptz default null;
```

Verify: in Supabase Table Editor → `orders` table, the column `expires_at` appears with type `timestamptz`, nullable.

- [ ] **Step 3: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add expires_at column to orders (migration)"
```

---

## Task 2: Update Order type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `expires_at` to the Order interface**

In `src/types/index.ts`, inside the `Order` interface (currently ends around line 50), add after `response_note`:

```ts
expires_at: string | null
```

The full `Order` interface should look like:

```ts
export interface Order {
  id: string
  from_user_id: string
  to_user_id: string
  service_id: string
  date: string | null
  status: OrderStatus
  note: string | null
  response_note: string | null
  expires_at: string | null
  mode: Mode
  created_at: string
  service?: Service
  from_profile?: Profile
  to_profile?: Profile
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add expires_at to Order type"
```

---

## Task 3: Add translation strings

**Files:**
- Modify: `messages/sv.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add strings to sv.json**

In `messages/sv.json`, inside the `"home"` object, add after `"date_any"`:

```json
"pick_time": "Välj tid (valfritt)",
```

Inside the `"orders"` object, add after `"withdraw"`:

```json
"expires_at_label": "Giltig till",
```

- [ ] **Step 2: Add strings to en.json**

In `messages/en.json`, inside the `"home"` object, add after `"date_any"`:

```json
"pick_time": "Pick a time (optional)",
```

Inside the `"orders"` object, add after `"withdraw"`:

```json
"expires_at_label": "Valid until",
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add messages/sv.json messages/en.json
git commit -m "feat: add expires_at translation strings"
```

---

## Task 4: Time picker UI + expires_at in placeOrder

**Files:**
- Modify: `src/views/HomePage.tsx`

The time picker appears after a date is selected. It renders a horizontal row of chips for `18:00`–`23:00`. Chips whose time has already passed on today's date are disabled. Selecting a chip sets `selectedTime`; deselecting clears it. Clearing the date also clears `selectedTime`. `placeOrder` constructs `expires_at` from `selectedDate + selectedTime` using `.toISOString()`.

- [ ] **Step 1: Add `selectedTime` state**

Near the other `useState` declarations (around line 42), add:

```ts
const [selectedTime, setSelectedTime] = useState<string | null>(null)
```

- [ ] **Step 2: Clear selectedTime when date is cleared**

Find the `onClick` handler for the "no date" chip (around line 458):

```tsx
<Box onClick={() => setSelectedDate(null)} ...>
```

Change it to:

```tsx
<Box onClick={() => { setSelectedDate(null); setSelectedTime(null) }} ...>
```

Also update the per-day chip toggle (around line 477):

```tsx
onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
```

Change to:

```tsx
onClick={() => {
  setSelectedDate(prev => {
    if (prev === dateStr) { setSelectedTime(null); return null }
    return dateStr
  })
}}
```

- [ ] **Step 3: Add time picker UI after the date picker block**

Insert the time picker as a new sibling JSX block. In `HomePage.tsx`, around line 496, the date picker section ends with `)}` (closing `{selectedService && (<Box>...[date picker]...</Box>)}`). The `TextField` for the note is a separate `{selectedService && (...)}` block that starts at line 498. Insert the time picker **between** these two blocks (after the `)}` at line 496, before the `{selectedService && (` at line 498):

```tsx
// INSERT HERE — between the date picker block and the note TextField block
```

```tsx
{selectedService && selectedDate && (
  <Box>
    <SectionLabel>{t('pick_time')}</SectionLabel>
    <Box display="flex" gap={1} overflow="auto" pb={0.5}
      sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
      {['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map(time => {
        const selected = selectedTime === time
        const isPast = selectedDate === todayStr &&
          new Date(`${selectedDate}T${time}:00`) < new Date()
        return (
          <Box key={time}
            onClick={() => { if (!isPast) setSelectedTime(prev => prev === time ? null : time) }}
            sx={{
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              px: 1.5, py: 1.2, borderRadius: 2, minWidth: 60,
              border: '2px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              bgcolor: selected ? 'primary.main' : 'background.paper',
              color: isPast ? 'text.disabled' : selected ? 'primary.contrastText' : 'text.primary',
              cursor: isPast ? 'default' : 'pointer',
              opacity: isPast ? 0.4 : 1,
              transition: 'all 0.12s ease',
            }}>
            <Typography fontWeight={700} fontSize="0.85rem">{time}</Typography>
          </Box>
        )
      })}
    </Box>
  </Box>
)}
```

- [ ] **Step 4: Set expires_at in placeOrder**

Find `placeOrder` (around line 138). Change the `supabase.from('orders').insert(...)` call to include `expires_at`:

```ts
async function placeOrder() {
  if (!selectedService || !profile || !partner) return
  setOrdering(true)
  const title = selectedService.title
  const expires_at = selectedDate && selectedTime
    ? new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
    : null
  await supabase.from('orders').insert({
    from_user_id: profile.id, to_user_id: partner.id,
    service_id: selectedService.id, date: selectedDate,
    status: 'pending', note: note || null, mode,
    expires_at,
  })
  // ... rest of function unchanged
```

Also reset `selectedTime` when the order is sent. Find where `setSelectedDate(null)` is called after a successful order (around line 153):

```ts
setSelectedService(null); setSelectedDate(null); setNote('')
```

Change to:

```ts
setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setNote('')
```

- [ ] **Step 5: Verify in browser**

Run `npm run dev`. Open the home page:
1. Select a service → select today → time chips should appear with past times disabled.
2. Select a future date → all 6 time chips should be enabled.
3. Select a time → chip highlights.
4. Clear date → time chip selection clears.
5. Place an order with a time → check Supabase Table Editor that `expires_at` is a proper UTC timestamp.
6. Place an order without a time → `expires_at` should be `null`.

- [ ] **Step 6: Commit**

```bash
git add src/views/HomePage.tsx
git commit -m "feat: add time picker and expires_at to order placement"
```

---

## Task 5: Auto-decline + expiry display in OrdersPage

**Files:**
- Modify: `src/views/OrdersPage.tsx`

Auto-decline runs inside `loadOrders`. Expired orders are shown with a clock-alert chip instead of accept/decline buttons.

- [ ] **Step 1: Add auto-decline logic to loadOrders**

Find `loadOrders` in `src/views/OrdersPage.tsx` (around line 56). The full updated function should look like this:

```ts
async function loadOrders(silent = false) {
  if (!silent) setLoading(true)
  const { data: rawData } = await supabase.from('orders').select('*, service:services(*)')
    .eq(tab === 0 ? 'to_user_id' : 'from_user_id', profile!.id)
    .order('created_at', { ascending: false })
  let data = rawData

  // Auto-decline expired pending orders (tab 0 only — receiver can always decline;
  // restricting to tab 0 avoids RLS ambiguity for the sender)
  if (tab === 0) {
    const now = new Date()
    const expired = (data ?? []).filter(
      o => o.status === 'pending' && o.expires_at !== null && new Date(o.expires_at) < now
    )
    if (expired.length > 0) {
      const ids = expired.map(o => o.id)
      await supabase.from('orders').update({ status: 'declined' }).in('id', ids)
      data = (data ?? []).map(o =>
        ids.includes(o.id) ? { ...o, status: 'declined' as const } : o
      )
    }
  }

  setOrders(data ?? [])
  setLoading(false)
}
```

Note: `const { data: rawData }` + `let data = rawData` is required because TypeScript does not allow reassigning a `const` destructured binding. Auto-decline is scoped to `tab === 0` (incoming orders) because the receiver is always `to_user_id` and the `orders_update` RLS policy is guaranteed to allow the update. Running it on tab 1 (sender's view) could silently fail if the policy restricts updates by `from_user_id` on those rows.

- [ ] **Step 2: Add expires_at chip on the order card**

In the `renderOrder` function (around line 120), find where `order.response_note` is rendered:

```tsx
{order.response_note && (
  <Chip size="small" label={`⏰ ${order.response_note}`} color="success" variant="outlined" sx={{ mt: 1 }} />
)}
```

Add the expiry chip directly after this block:

```tsx
{order.expires_at && order.status === 'pending' && (
  <Chip
    size="small"
    icon={<Icon icon="mdi:clock-alert-outline" width={14} />}
    label={`${t('expires_at_label')} ${format(new Date(order.expires_at), 'HH:mm')}`}
    color="warning"
    variant="outlined"
    sx={{ mt: 1 }}
  />
)}
```

> **Note:** The `response_note` chip above also uses `⏰` as a hardcoded prefix. The expiry chip uses `mdi:clock-alert-outline` (via Iconify) to visually distinguish the two. They will appear on the same card when both are present — that's acceptable but worth being aware of.

- [ ] **Step 3: Verify in browser**

Run `npm run dev`.
1. Place an order with a time that is 1-2 minutes in the future.
2. Wait for the time to pass.
3. Open `/onskningar` — the order should automatically flip to "Inte nu" / "Not now" status.
4. On a pending order that has an expiry in the future, the `⏰ Giltig till 21:30`-style chip should be visible.

- [ ] **Step 4: Verify build passes**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/OrdersPage.tsx
git commit -m "feat: auto-decline expired orders and show expiry chip"
```

---

## Done

All tasks complete. The feature is live:
- Time picker appears on the order form after selecting a date.
- Past times are disabled on today's date.
- `expires_at` is stored as UTC in the database.
- On `/onskningar`, any pending order past its `expires_at` is silently declined on load.
- A warning chip shows the expiry time on pending orders that have one.
