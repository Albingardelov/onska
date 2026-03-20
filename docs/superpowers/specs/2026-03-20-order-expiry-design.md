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
- `expires_at` = selected date + selected time, e.g. `2026-03-20T21:30:00` in local time stored as UTC.
- No expiry if left null.

## UI — Time Picker

- Appears in `HomePage.tsx` after a date is selected.
- Horizontal row of time chips: `18:00 19:00 20:00 21:00 22:00 23:00`.
- Selecting a time sets `expires_at`; deselecting clears it.
- If date is cleared, `expires_at` is also cleared.
- On the order card in `OrdersPage.tsx`: show `⏰ Giltig till 21:30` if `expires_at` is set and order is still pending.

## Auto-Decline Logic

Location: `loadOrders` in both `OrdersPage.tsx` and `HomePage.tsx`.

On every load (initial + silent realtime reload):
1. Find all locally loaded orders where `status === 'pending'` and `expires_at !== null` and `expires_at < new Date()`.
2. Batch-update those orders to `status: 'declined'` in Supabase.
3. Update local state to reflect the change.

Silent — no animation, no notification triggered.

## Types

Add `expires_at: string | null` to the `Order` interface in `src/types/index.ts`.

## Translation Strings

Add to both `messages/sv.json` and `messages/en.json`:
- `orders.expires_at_label` — e.g. `"Giltig till"` / `"Valid until"`
- `home.pick_time` — section label, e.g. `"Välj tid"` / `"Pick a time"`

## Approaches Considered

- **Client-side (chosen):** Auto-decline runs when either user loads orders. Simple, no backend config. Suitable for a couples app.
- **pg_cron:** Scheduled SQL job every 5 min. More reliable but requires Supabase configuration.
- **Hybrid:** Unnecessary complexity for this use case.
