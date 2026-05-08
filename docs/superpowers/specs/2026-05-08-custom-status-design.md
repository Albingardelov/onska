---
title: Custom status (free text) for fint + snusk
date: 2026-05-08
status: draft
---

## Goal

Allow users to keep the existing predefined status pills, but also set a **custom free-text status**, usable in both **fint** and **snusk**.

Constraints:

- Existing status keys and translations must remain unchanged.
- No hardcoded strings: use `next-intl` (`messages/sv.json` + `messages/en.json`).
- Keep a single “current status” in `profiles.status` (matches current app behavior).

## Current behavior (baseline)

- Predefined status keys are defined in `src/lib/statuses.ts`.
- Status selection UI is rendered in `src/components/home/StatusPills.tsx`.
- The chosen status is persisted to `profiles.status` via `useAuth().updateStatus()` in `src/contexts/AuthContext.tsx`.
- Partner status on `HomePage` is currently shown only when `isValidStatusKey(partner.status)` is true (i.e. only predefined keys).

## Proposed data model

Continue to store status in `profiles.status` as a nullable string, but support two formats:

- **Predefined key**: one of `StatusKey` values (e.g. `nyfiken`)
- **Custom free text**: stored with prefix `custom:` (e.g. `custom:Vill bara ligga nära en stund`)

This prefix avoids ambiguity if a user types a string identical to a predefined key.

### Helper parsing (app-side)

Introduce helpers:

- `isCustomStatus(value: string | null | undefined): boolean`
- `getCustomStatusText(value: string): string | null` (returns text after `custom:`)
- `serializeCustomStatus(text: string): string` (returns `custom:${text}`)

## UI/UX design

### Status selection (own profile)

Keep existing pills exactly as today. Add a small “custom status” flow:

- Add a pill labeled **“Egen…”**.
- Tapping “Egen…” toggles a compact inline form below the pills:
  - Text input (single line)
  - Actions: **Spara**, **Avbryt**, **Rensa**

Behavior:

- **Spara**:
  - Trim whitespace
  - Validate non-empty
  - Enforce max length (recommend 80 chars)
  - Persist `profiles.status = custom:<text>`
- **Rensa** sets `profiles.status = null`
- If current status is custom, show a pill for the current custom text (truncated with ellipsis if needed). Tapping it opens the form prefilled for quick edits.

### Display (partner profile)

Partner’s status should display when it is either:

- A valid predefined key → show translated label as today
- A custom status (`custom:`) → show the custom text

## Notifications

`updateStatus` triggers `/api/send-status-notification` with `status_label`.

Update label resolution to:

- If predefined key → continue using localized label (via `next-intl` would be ideal; keep current behavior if needed).
- If custom → send the custom text (without the `custom:` prefix).

Note: currently this label lookup is hardcoded Swedish in `STATUS_LABELS_SV`. This change should not expand scope beyond what’s needed, but custom status must not send `custom:` as label.

## i18n additions

Add keys under a suitable namespace (recommended `statuses` or `common`) in both `messages/sv.json` and `messages/en.json`:

- `custom_open` (“Egen…” / “Custom…”)
- `custom_placeholder` (“Skriv din status…” / “Write your status…”)
- `custom_save` (“Spara” / “Save”)
- `custom_cancel` (“Avbryt” / “Cancel”)
- `custom_clear` (“Rensa” / “Clear”)
- `custom_error_empty` (optional)
- `custom_error_too_long` (optional)

## Validation & edge cases

- Empty/whitespace-only input → show inline error, do not save.
- Length over limit → show inline error, do not save.
- If `profiles.status` contains an unknown non-key string without `custom:` prefix:
  - Treat as “custom” for display (defensive), or treat as hidden. Recommended: display it as-is to avoid losing user data.

## Success criteria

- Users can set and clear a custom status in both modes.
- Predefined statuses work exactly as before.
- Partner status display works for both predefined and custom.
- All UI strings are translated in SV+EN.
- No hardcoded colors; use theme variables via MUI `sx`.
