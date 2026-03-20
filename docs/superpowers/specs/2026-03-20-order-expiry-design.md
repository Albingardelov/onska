# Order Expiry Design

**Date:** 2026-03-20

## Summary

When placing an order, the user can optionally select a time on the chosen date. If that time passes without the partner accepting, the order is automatically declined.

## Database

Add `expires_at timestamptz` (nullable) to the `orders` table.

```sql
alter table public.orders add column expires_at timestamptz default null;
```

- Existing `date` field (date only) is kept — it shows which day the service is requested.
- `expires_at` is constructed on the client as:
  ```ts
  expires_at = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
  ```
  This ensures the local datetime is always serialised as UTC before being stored.
- No expiry if left null (no time selected).

## UI — Time Picker

- Appears in `HomePage.tsx` after a date is selected.
- Fixed horizontal row of time chips: `18:00 19:00 20:00 21:00 22:00 23:00`.
  - The list ends at 23:00 because the order is tied to a specific date (midnight boundary).
  - If the selected date is today, chips whose time has already passed are disabled (greyed out, not clickable).
- Selecting a time sets `expires_at`; deselecting or clearing the date also clears `expires_at`.
- On the order card in `OrdersPage.tsx`, show `⏰ Giltig till 21:30` as a separate Chip when `status === 'pending'` and `expires_at` is non-null. This is a distinct element from `response_note` (which also uses ⏰ as a prefix today — consider changing one of them to avoid visual collision; out of scope for this spec but worth noting for the implementing dev).

## Auto-Decline Logic

Location: `loadOrders` in `OrdersPage.tsx` only.

`loadData` in `HomePage.tsx` only queries `accepted` orders so it never has visibility over pending orders — auto-decline logic does not belong there.

On every `loadOrders` call (initial + silent realtime reload):
1. From the currently loaded orders (one side at a time depending on active tab), find all where `status === 'pending'` and `expires_at !== null` and `expires_at < new Date()`.
2. Batch-update those orders to `status: 'declined'` in Supabase. This is idempotent — if both users trigger it simultaneously on the same order it is harmless.
3. Update local state to reflect the change.

Note: `loadOrders` uses `select('*, service:services(*)')` which already covers `expires_at` once the column is added — no query change needed.

Silent — no animation, no push notification triggered.

## Types

Add `expires_at: string | null` to the `Order` interface in `src/types/index.ts`.

## Translation Strings

Add to both `messages/sv.json` and `messages/en.json`:
- `home.pick_time` — section label, e.g. `"Välj tid"` / `"Pick a time"`
- `orders.expires_at_label` — e.g. `"Giltig till"` / `"Valid until"`

## Approaches Considered

- **Client-side (chosen):** Auto-decline runs when either user loads orders. Simple, no backend config. Suitable for a couples app.
- **pg_cron:** Scheduled SQL job every 5 min. More reliable but requires Supabase configuration.
- **Hybrid:** Unnecessary complexity for this use case.
