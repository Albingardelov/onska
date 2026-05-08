# Custom status (free text) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small UI form to set a custom free-text status, while keeping the existing predefined status pills for both fint and snusk.

**Architecture:** Keep `profiles.status` as a single string (or null). Support predefined keys as-is, and encode custom statuses as `custom:<text>` so the app can reliably parse and display them.

**Tech Stack:** Next.js (App Router), React client components, MUI, `next-intl`, Supabase JS.

---

## File map (what changes where)

- Modify: `src/lib/statuses.ts` — add helpers for custom status parsing/serialization.
- Modify: `src/components/home/StatusPills.tsx` — add “Egen…” pill + inline input form + custom status pill.
- Modify: `src/components/home/HeroBanner.tsx` — display partner status for both predefined keys and custom statuses.
- Modify: `src/contexts/AuthContext.tsx` — ensure status notification label strips `custom:` prefix; keep predefined behavior.
- Modify: `messages/sv.json` — add UI strings for custom status.
- Modify: `messages/en.json` — add UI strings for custom status.

### Task 1: Add custom-status helpers

**Files:**
- Modify: `src/lib/statuses.ts`

- [ ] **Step 1: Add constants + helpers**

Add:
- `CUSTOM_STATUS_PREFIX = 'custom:' as const`
- `isCustomStatus(value)`
- `getCustomStatusText(value)`
- `serializeCustomStatus(text)`
- `getDisplayStatusLabel(status, tStatuses)` helper (optional) to centralize display.

- [ ] **Step 2: Quick type check**

Run: `npm run lint`
Expected: no new TS/ESLint errors related to `statuses.ts`.

### Task 2: Update StatusPills UI (own status)

**Files:**
- Modify: `src/components/home/StatusPills.tsx`
- Modify: `messages/sv.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add translations**

Under `statuses`, add:
- `custom_open`
- `custom_placeholder`
- `custom_save`
- `custom_cancel`
- `custom_clear`
- `custom_error_empty`
- `custom_error_too_long`

- [ ] **Step 2: Add “Egen…” pill**

Render an extra pill at the end of the existing pill list that toggles the inline form.

- [ ] **Step 3: Add inline form**

Implement a compact `TextField` + buttons using MUI, with:
- local state: `open`, `value`, `error`, `saving`
- validation: trim, non-empty, max length (80)
- save: `onUpdate(serializeCustomStatus(trimmed))`
- clear: `onUpdate(null)`

- [ ] **Step 4: Show current custom status pill (if active)**

If `profile.status` is custom, show a pill with the custom text (ellipsis) that opens the form prefilled.

- [ ] **Step 5: Manual UI sanity**

Run: `npm run dev`
Check:
- Selecting predefined pills still works as before
- “Egen…” opens input
- Save sets status; pill appears; can edit; can clear

### Task 3: Display partner status for custom values

**Files:**
- Modify: `src/components/home/HeroBanner.tsx`
- Modify: `src/lib/statuses.ts` (if adding display helper)

- [ ] **Step 1: Replace `isValidStatusKey`-only rendering**

Update banner to show:
- predefined key: `ts(key)`
- custom: the stripped custom text

- [ ] **Step 2: Manual check**

With two accounts (or by setting `partner.status` in DB), verify partner custom status shows.

### Task 4: Ensure status notifications don’t include `custom:`

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Strip custom prefix for `status_label`**

When sending `/api/send-status-notification`, ensure:
- predefined key uses existing label mapping fallback
- custom sends the raw custom text

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no new errors.

### Task 5: Final verification

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS

