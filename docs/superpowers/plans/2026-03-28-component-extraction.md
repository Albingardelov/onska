# Component Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break up HomePage.tsx (608 lines) and OrdersPage.tsx (409 lines) into focused components and a shared hook, without changing any behavior.

**Architecture:** Extract pure rendering components that receive props from the parent view. Keep data fetching and state in the view files. One shared hook (`useNotificationPermission`) replaces duplicated notification logic in 3 files.

**Tech Stack:** React 19, TypeScript, MUI 7, next-intl.

---

## File map

**Create:**
- `src/hooks/useNotificationPermission.ts` — notification permission state + enable logic
- `src/components/home/HeroBanner.tsx` — gradient hero with partner availability + status
- `src/components/home/StatusPills.tsx` — own mood status pill row
- `src/components/home/ServiceGrid.tsx` — partner service cards grid
- `src/components/home/DatePicker.tsx` — horizontal date scroll strip
- `src/components/home/TimePicker.tsx` — time slot grid
- `src/components/orders/OrderCard.tsx` — single order card with all actions

**Modify:**
- `src/views/HomePage.tsx` — use extracted components
- `src/views/OrdersPage.tsx` — use OrderCard
- `src/views/MyServicesPage.tsx` — use hook
- `src/views/SettingsPage.tsx` — use hook

---

### Task 1: `useNotificationPermission` hook

Replaces identical 3-file duplication: state + useEffect + enableNotifications.

**Files:**
- Create: `src/hooks/useNotificationPermission.ts`
- Modify: `src/views/HomePage.tsx`
- Modify: `src/views/MyServicesPage.tsx`
- Modify: `src/views/SettingsPage.tsx`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useNotificationPermission.ts
import { useState, useEffect } from 'react'
import { subscribeToPush } from '../lib/notifications'

type NotifStatus = 'unknown' | 'granted' | 'denied' | 'unsupported'

function readPermission(): NotifStatus {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return 'unknown'
}

export function useNotificationPermission(userId: string | undefined) {
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('unknown')
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    setNotifStatus(readPermission())
  }, [])

  async function enableNotifications() {
    if (!userId) return
    setActivating(true)
    await subscribeToPush(userId)
    setNotifStatus(readPermission())
    setActivating(false)
  }

  return { notifStatus, activating, enableNotifications }
}
```

- [ ] **Step 2: Update HomePage.tsx**

Remove these lines (around line 51-52, 57-60, 138-143):
```ts
const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
const [activatingNotif, setActivatingNotif] = useState(false)
```
```ts
useEffect(() => {
  if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
  setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
}, [])
```
```ts
async function enableNotifications() {
  setActivatingNotif(true)
  await subscribeToPush(user!.id)
  setNotifStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
  setActivatingNotif(false)
}
```

Add after existing imports:
```ts
import { useNotificationPermission } from '../hooks/useNotificationPermission'
```

Add inside `HomePage()` after the existing `useAuth` destructuring line:
```ts
const { notifStatus, activating: activatingNotif, enableNotifications } = useNotificationPermission(user?.id)
```

Remove the `subscribeToPush` import from HomePage (no longer needed directly).

- [ ] **Step 3: Update MyServicesPage.tsx**

Remove these lines (around line 13, 23-24, 26-29, 31-36):
```ts
import { subscribeToPush } from '../lib/notifications'
```
```ts
const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
const [activating, setActivating] = useState(false)
```
```ts
useEffect(() => {
  if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
  setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
}, [])
```
```ts
async function enableNotifications() {
  setActivating(true)
  await subscribeToPush(user!.id)
  setNotifStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
  setActivating(false)
}
```

Add import:
```ts
import { useNotificationPermission } from '../hooks/useNotificationPermission'
```

Add inside `MyServicesPage()`:
```ts
const { notifStatus, activating, enableNotifications } = useNotificationPermission(user?.id)
```

- [ ] **Step 4: Update SettingsPage.tsx**

Remove these lines (around line 14, 32-42):
```ts
import { subscribeToPush } from '../lib/notifications'
```
```ts
const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
const [activatingNotif, setActivatingNotif] = useState(false)

useEffect(() => {
  if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
  setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
}, [])

async function enableNotifications() {
  setActivatingNotif(true)
  await subscribeToPush(user!.id)
  setNotifStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
  setActivatingNotif(false)
}
```

Add import:
```ts
import { useNotificationPermission } from '../hooks/useNotificationPermission'
```

Add inside `SettingsPage()`:
```ts
const { notifStatus, activating: activatingNotif, enableNotifications } = useNotificationPermission(user?.id)
```

- [ ] **Step 5: Verify build**

```bash
cd /home/albin/Documents/onska/onska && npm run build 2>&1 | tail -20
```
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useNotificationPermission.ts src/views/HomePage.tsx src/views/MyServicesPage.tsx src/views/SettingsPage.tsx
git commit -m "refactor: extract useNotificationPermission hook"
```

---

### Task 2: `HeroBanner` component

Extracts the gradient hero section (~70 lines) from HomePage.

**Files:**
- Create: `src/components/home/HeroBanner.tsx`
- Modify: `src/views/HomePage.tsx`

- [ ] **Step 1: Create HeroBanner.tsx**

```tsx
// src/components/home/HeroBanner.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { isValidStatusKey } from '../../lib/statuses'
import type { StatusKey } from '../../lib/statuses'
import type { Profile } from '../../types'
import type { Mode } from '../../types'
import type { Locale } from 'date-fns'

interface HeroBannerProps {
  mode: Mode
  partner: Profile
  loading: boolean
  blockedTodayCount: number
  dateFnsLocale: Locale
}

export function HeroBanner({ mode, partner, loading, blockedTodayCount, dateFnsLocale }: HeroBannerProps) {
  const t = useTranslations('home')
  const ts = useTranslations('statuses')

  return (
    <Box sx={{
      px: 2.5, pt: 2.5, pb: 2,
      minHeight: 171,
      background: mode === 'snusk'
        ? 'linear-gradient(145deg, #8B0A24 0%, #5C0618 55%, #3A020E 100%)'
        : 'linear-gradient(145deg, #CC2E6A 0%, #A82158 55%, #8B1A49 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute',
        top: -48, right: -48, width: 160, height: 160,
        borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
      },
      '&::after': {
        content: '""', position: 'absolute',
        bottom: -32, left: -32, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      },
    }}>
      <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'capitalize', letterSpacing: '0.03em' }}>
        {format(new Date(), 'EEEE d MMMM', { locale: dateFnsLocale })}
      </Typography>
      <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em" mt={0.3} mb={1.5}>
        {mode === 'snusk' ? t('greeting_snusk', { name: partner.name }) : t('greeting', { name: partner.name })}
      </Typography>

      {!loading && (
        <Box display="flex" alignItems="center" gap={0.8}
          sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
          <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.9 }}>
            <Icon icon={blockedTodayCount === 0 ? 'mdi:check-circle-outline' : 'mdi:information-outline'} />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
            {blockedTodayCount === 0
              ? t('open_for_all', { name: partner.name })
              : blockedTodayCount === 1
                ? t('blocked_one', { name: partner.name })
                : t('blocked_many', { name: partner.name, count: blockedTodayCount })}
          </Typography>
        </Box>
      )}

      {isValidStatusKey(partner.status) && (
        <Box display="flex" alignItems="center" gap={0.8} mt={0.8}
          sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
          <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.8 }}>
            <Icon icon="mdi:heart-pulse" />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85 }}>
            {ts(partner.status as StatusKey)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Replace hero section in HomePage.tsx**

Remove lines 191–261 (the entire `{/* Hero */}` block) and replace with:

```tsx
<HeroBanner
  mode={mode}
  partner={partner}
  loading={loading}
  blockedTodayCount={blockedTodayCount}
  dateFnsLocale={dateFnsLocale}
/>
```

Add import at top of HomePage.tsx:
```ts
import { HeroBanner } from '../components/home/HeroBanner'
```

Remove these imports that are now only used in HeroBanner (if unused after edit):
```ts
import { isValidStatusKey } from '../lib/statuses'
import type { StatusKey } from '../lib/statuses'
```

- [ ] **Step 3: Verify build**

```bash
cd /home/albin/Documents/onska/onska && npm run build 2>&1 | tail -20
```
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HeroBanner.tsx src/views/HomePage.tsx
git commit -m "refactor: extract HeroBanner component from HomePage"
```

---

### Task 3: `StatusPills` component

Extracts the mood status pill row (~40 lines).

**Files:**
- Create: `src/components/home/StatusPills.tsx`
- Modify: `src/views/HomePage.tsx`

- [ ] **Step 1: Create StatusPills.tsx**

```tsx
// src/components/home/StatusPills.tsx
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { getStatusesForMode } from '../../lib/statuses'
import type { StatusKey } from '../../lib/statuses'
import type { Mode, Profile } from '../../types'

interface StatusPillsProps {
  mode: Mode
  profile: Profile
  onUpdate: (key: StatusKey | null) => void
}

export function StatusPills({ mode, profile, onUpdate }: StatusPillsProps) {
  const ts = useTranslations('statuses')

  return (
    <Box px={2.5} pt={1.5} pb={0.5} display="flex" gap={0.75} flexWrap="wrap">
      {getStatusesForMode(mode).map(key => {
        const isActive = profile.status === key
        return (
          <Box
            key={key}
            component="button"
            onClick={() => onUpdate(isActive ? null : key)}
            sx={{
              border: '1.5px solid',
              borderColor: isActive ? 'primary.main' : 'divider',
              borderRadius: 10,
              px: 1.5, py: 0.6,
              cursor: 'pointer',
              bgcolor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.secondary',
              fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', gap: 0.5,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                color: isActive ? 'primary.contrastText' : 'primary.main',
              },
            }}
          >
            {isActive && (
              <Box component="span" sx={{ fontSize: 11, display: 'flex', opacity: 0.9 }}>
                <Icon icon="mdi:check" />
              </Box>
            )}
            {ts(key)}
          </Box>
        )
      })}
    </Box>
  )
}
```

- [ ] **Step 2: Replace status pills in HomePage.tsx**

Remove lines 263–304 (the `{/* Own status */}` block) and replace with:

```tsx
<StatusPills mode={mode} profile={profile!} onUpdate={updateStatus} />
```

Add import:
```ts
import { StatusPills } from '../components/home/StatusPills'
```

Remove from HomePage imports (now only used in StatusPills):
```ts
import { getStatusesForMode } from '../lib/statuses'
import type { StatusKey } from '../lib/statuses'
```
(only remove if no longer used in HomePage after this change)

- [ ] **Step 3: Verify build**

```bash
cd /home/albin/Documents/onska/onska && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/home/StatusPills.tsx src/views/HomePage.tsx
git commit -m "refactor: extract StatusPills component from HomePage"
```

---

### Task 4: `ServiceGrid` component

Extracts the partner services section (~70 lines).

**Files:**
- Create: `src/components/home/ServiceGrid.tsx`
- Modify: `src/views/HomePage.tsx`

- [ ] **Step 1: Create ServiceGrid.tsx**

```tsx
// src/components/home/ServiceGrid.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import type { Service, Profile } from '../../types'
import type { Mode } from '../../types'

interface ServiceGridProps {
  services: Service[]
  loading: boolean
  mode: Mode
  partner: Profile
  selectedService: Service | null
  selectedDate: string | null
  partnerBlockedIds: Set<string>
  todayBlockedIds: Set<string>
  onSelect: (service: Service | null) => void
}

export function ServiceGrid({
  services, loading, mode, partner, selectedService,
  selectedDate, partnerBlockedIds, todayBlockedIds, onSelect,
}: ServiceGridProps) {
  const t = useTranslations('home')

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
        sx={{ letterSpacing: '-0.01em', mb: 1.5, fontSize: '0.8rem', textTransform: 'uppercase' }}>
        {mode === 'snusk' ? t('ideas_label_snusk', { name: partner.name }) : t('ideas_label', { name: partner.name })}
      </Typography>

      {loading ? (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : services.length === 0 ? (
        <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center' }}>
          <Box component="span" sx={{ fontSize: 38, display: 'flex', justifyContent: 'center', mb: 1.5, opacity: 0.2 }}>
            <Icon icon="mdi:heart-outline" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {mode === 'snusk' ? t('no_ideas_snusk', { name: partner.name }) : t('no_ideas', { name: partner.name })}
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {services.map((service, index) => {
            const selected = selectedService?.id === service.id
            const blockedForDate = selectedDate ? partnerBlockedIds.has(service.id) : false
            const blockedToday = !selectedDate && todayBlockedIds.has(service.id)
            const isBlocked = blockedForDate || blockedToday
            return (
              <Box key={service.id}
                onClick={() => { if (!isBlocked) onSelect(selected ? null : service) }}
                sx={{
                  p: 2.5, borderRadius: 3, cursor: isBlocked ? 'not-allowed' : 'pointer',
                  border: '2px solid',
                  borderColor: selected ? 'success.main' : 'divider',
                  ...(mode === 'snusk' && !selected
                    ? { background: 'linear-gradient(135deg, #150208 0%, #0E0106 100%)' }
                    : { bgcolor: 'background.paper' }
                  ),
                  boxShadow: selected
                    ? '0 0 0 3px rgba(46,155,95,0.12), 0 2px 8px rgba(0,0,0,0.06)'
                    : mode === 'snusk'
                      ? '0 2px 8px rgba(0,0,0,0.3)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                  opacity: isBlocked ? 0.45 : 1,
                  transition: 'all 0.18s ease',
                  '@keyframes cardIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                  animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${index * 55}ms both`,
                  '&:hover': !isBlocked ? {
                    borderColor: selected ? 'success.main' : 'primary.main',
                    boxShadow: mode === 'snusk'
                      ? '0 4px 16px rgba(196,18,48,0.2)'
                      : '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-1px)',
                  } : {},
                }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  <Box flex={1}>
                    <Typography fontWeight={700} fontSize="1rem" letterSpacing="-0.01em">
                      {service.title}
                    </Typography>
                    {service.description && (
                      <Typography variant="body2" color="text.secondary" mt={0.3}>
                        {service.description}
                      </Typography>
                    )}
                    {isBlocked && (
                      <Typography variant="caption" color="text.disabled" mt={0.5}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon icon="mdi:clock-outline" width={12} />
                        {selectedDate ? t('blocked_date') : t('blocked_today')}
                      </Typography>
                    )}
                  </Box>
                  <Box component="span" sx={{
                    fontSize: 22, flexShrink: 0, display: 'flex',
                    color: selected ? 'success.main' : 'divider',
                    transition: 'color 0.15s',
                  }}>
                    <Icon icon={selected ? 'mdi:check-circle' : 'mdi:circle-outline'} />
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Replace services section in HomePage.tsx**

Remove lines 379–465 (the `{/* Partner services */}` block) and replace with:

```tsx
<ServiceGrid
  services={services}
  loading={loading}
  mode={mode}
  partner={partner}
  selectedService={selectedService}
  selectedDate={selectedDate}
  partnerBlockedIds={partnerBlockedIds}
  todayBlockedIds={todayBlockedIds}
  onSelect={setSelectedService}
/>
```

Add import:
```ts
import { ServiceGrid } from '../components/home/ServiceGrid'
```

Remove `Skeleton` from HomePage imports if no longer used.

- [ ] **Step 3: Verify build**

```bash
cd /home/albin/Documents/onska/onska && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/home/ServiceGrid.tsx src/views/HomePage.tsx
git commit -m "refactor: extract ServiceGrid component from HomePage"
```

---

### Task 5: `DatePicker` and `TimePicker` components

**Files:**
- Create: `src/components/home/DatePicker.tsx`
- Create: `src/components/home/TimePicker.tsx`
- Modify: `src/views/HomePage.tsx`

- [ ] **Step 1: Create DatePicker.tsx**

```tsx
// src/components/home/DatePicker.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import type { Locale } from 'date-fns'

interface DatePickerProps {
  days: string[]
  todayStr: string
  selected: string | null
  onSelect: (date: string | null) => void
  dateFnsLocale: Locale
}

export function DatePicker({ days, todayStr, selected, onSelect, dateFnsLocale }: DatePickerProps) {
  const t = useTranslations('home')

  const cellSx = (isSelected: boolean, isToday: boolean) => ({
    flexShrink: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    px: 1.5, py: 1.2, borderRadius: 2, cursor: 'pointer', minWidth: 52,
    border: '2px solid',
    borderColor: isSelected ? 'primary.main' : isToday ? 'primary.main' : 'divider',
    bgcolor: isSelected ? 'primary.main' : 'background.paper',
    color: isSelected ? 'primary.contrastText' : 'text.primary',
    transition: 'all 0.12s ease',
  })

  return (
    <Box display="flex" gap={1} overflow="auto" pb={0.5}
      sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
      <Box onClick={() => onSelect(null)} sx={{
        ...cellSx(selected === null, false),
        color: selected === null ? 'primary.contrastText' : 'text.secondary',
      }}>
        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('date_any')}
        </Typography>
        <Typography fontWeight={700} fontSize="1.1rem" lineHeight={1.3}>–</Typography>
      </Box>

      {days.slice(0, 14).map(dateStr => {
        const isSelected = selected === dateStr
        const isToday = dateStr === todayStr
        return (
          <Box key={dateStr}
            onClick={() => onSelect(isSelected ? null : dateStr)}
            sx={cellSx(isSelected, isToday)}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isToday && !isSelected ? t('today_label') : format(new Date(dateStr), 'EEE', { locale: dateFnsLocale })}
            </Typography>
            <Typography fontWeight={700} fontSize="1.1rem" lineHeight={1.3}>
              {format(new Date(dateStr), 'd')}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
```

- [ ] **Step 2: Create TimePicker.tsx**

```tsx
// src/components/home/TimePicker.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00']

interface TimePickerProps {
  selectedDate: string
  todayStr: string
  selected: string | null
  onSelect: (time: string | null) => void
}

export function TimePicker({ selectedDate, todayStr, selected, onSelect }: TimePickerProps) {
  return (
    <Box display="flex" flexWrap="wrap" gap={0.75}>
      {TIME_SLOTS.map(time => {
        const isSelected = selected === time
        const isPast = selectedDate === todayStr && new Date(`${selectedDate}T${time}:00`) < new Date()
        return (
          <Box key={time}
            onClick={() => { if (!isPast) onSelect(isSelected ? null : time) }}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              px: 1.2, py: 0.8, borderRadius: 1.5, minWidth: 52,
              border: '2px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              bgcolor: isSelected ? 'primary.main' : 'background.paper',
              color: isPast ? 'text.disabled' : isSelected ? 'primary.contrastText' : 'text.primary',
              cursor: isPast ? 'default' : 'pointer',
              opacity: isPast ? 0.35 : 1,
              transition: 'all 0.12s ease',
            }}>
            <Typography fontWeight={700} fontSize="0.78rem" letterSpacing="0.01em">{time}</Typography>
          </Box>
        )
      })}
    </Box>
  )
}
```

- [ ] **Step 3: Replace date/time pickers in HomePage.tsx**

Remove lines 467–541 (both `{selectedService && ...}` picker blocks) and replace with:

```tsx
{selectedService && (
  <Box>
    <SectionLabel>{t('suggest_date')}</SectionLabel>
    <DatePicker
      days={days}
      todayStr={todayStr}
      selected={selectedDate}
      onSelect={(date) => { setSelectedDate(date); if (!date) setSelectedTime(null) }}
      dateFnsLocale={dateFnsLocale}
    />
  </Box>
)}

{selectedService && selectedDate && (
  <Box>
    <SectionLabel>{t('pick_time')}</SectionLabel>
    <TimePicker
      selectedDate={selectedDate}
      todayStr={todayStr}
      selected={selectedTime}
      onSelect={setSelectedTime}
    />
  </Box>
)}
```

Add imports:
```ts
import { DatePicker } from '../components/home/DatePicker'
import { TimePicker } from '../components/home/TimePicker'
```

Remove `addDays` from `date-fns` import if unused. Keep `format` since it's still used in `loadTodayBlocked` and `days` array.

- [ ] **Step 4: Verify build**

```bash
cd /home/albin/Documents/onska/onska && npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home/DatePicker.tsx src/components/home/TimePicker.tsx src/views/HomePage.tsx
git commit -m "refactor: extract DatePicker and TimePicker components from HomePage"
```

---

### Task 6: `OrderCard` component

Extracts the `renderOrder` function (145 lines) from OrdersPage into a proper component.

**Files:**
- Create: `src/components/orders/OrderCard.tsx`
- Modify: `src/views/OrdersPage.tsx`

- [ ] **Step 1: Create OrderCard.tsx**

```tsx
// src/components/orders/OrderCard.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import type { Order } from '../../types'

function getExpiryUrgency(expiresAt: string): 'imminent' | 'soon' | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  if (diff < 2 * 60 * 60 * 1000) return 'imminent'
  if (diff < 6 * 60 * 60 * 1000) return 'soon'
  return null
}

interface OrderCardProps {
  order: Order
  tab: number
  acceptingId: string | null
  responseNote: string
  animIndex?: number
  showDelete?: boolean
  onAccept: (id: string) => void
  onUpdateStatus: (id: string, status: Order['status']) => void
  onDelete: (id: string) => void
  onSetAccepting: (id: string | null) => void
  onResponseNoteChange: (value: string) => void
}

const statusLabel: Record<Order['status'], string> = {
  pending: 'status_pending',
  accepted: 'status_accepted',
  declined: 'status_declined',
  completed: 'status_completed',
}

const statusColor: Record<Order['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
  pending: 'warning', accepted: 'success', declined: 'secondary', completed: 'secondary',
}

function haptic() {
  if ('vibrate' in navigator) navigator.vibrate([8, 80, 8])
}

export function OrderCard({
  order, tab, acceptingId, responseNote, animIndex, showDelete = false,
  onAccept, onUpdateStatus, onDelete, onSetAccepting, onResponseNoteChange,
}: OrderCardProps) {
  const t = useTranslations('orders')
  const tc = useTranslations('common')

  const isAccepting = acceptingId === order.id
  const borderLeft = order.status === 'pending' ? 'warning.main'
    : order.status === 'accepted' ? 'success.main'
    : 'text.disabled'

  return (
    <Box sx={{
      borderRadius: 2, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
      bgcolor: 'background.paper',
      position: 'relative',
      ...(animIndex !== undefined && {
        animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${animIndex * 55}ms both`,
      }),
    }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: borderLeft }} />
      <Box sx={{ p: 2.5, pl: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" gap={0.8} flexWrap="wrap" alignItems="center">
            <Box component="span" sx={{ fontSize: 14, color: 'text.disabled', display: 'inline-flex' }}>
              <Icon icon={order.mode === 'fint' ? 'mdi:weather-sunny' : 'mdi:weather-night'} />
            </Box>
            <Chip
              size="small"
              label={
                order.status === 'declined' && order.expires_at && new Date(order.expires_at) < new Date()
                  ? t('status_missed')
                  : t(statusLabel[order.status])
              }
              color={statusColor[order.status]}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(order.created_at), 'd MMM HH:mm', { locale: sv })}
            </Typography>
            {showDelete && (
              <IconButton size="small" onClick={() => onDelete(order.id)}
                aria-label={t('delete_aria')}
                sx={{ color: 'text.disabled', ml: 0.5, '&:hover': { color: 'text.secondary' } }}>
                <Icon icon="mdi:delete-outline" width={16} />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography fontWeight={700} fontSize="1rem">{order.service?.title ?? t('unknown_wish')}</Typography>
        {order.date && (
          <Typography variant="body2" color="text.secondary">
            {format(new Date(order.date), 'd MMMM yyyy', { locale: sv })}
          </Typography>
        )}
        {order.note && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic" mt={0.5}>
            &ldquo;{order.note}&rdquo;
          </Typography>
        )}
        {order.expires_at && order.status === 'pending' && new Date(order.expires_at).getMinutes() === 0 && (
          <Chip size="small"
            icon={<Icon icon="mdi:clock-alert-outline" width={14} />}
            label={`${t('expires_at_label')} ${format(new Date(order.expires_at), 'HH:mm')}`}
            color="warning" variant="outlined" sx={{ mt: 1 }}
          />
        )}
        {order.expires_at && order.status === 'pending' && (() => {
          const urgency = getExpiryUrgency(order.expires_at!)
          if (!urgency) return null
          const diff = new Date(order.expires_at!).getTime() - Date.now()
          const hoursLeft = Math.floor(diff / (60 * 60 * 1000))
          const minutesLeft = Math.floor((diff % (60 * 60 * 1000)) / 60000)
          const label = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}min kvar` : `${minutesLeft} min kvar`
          return (
            <Typography variant="caption"
              color={urgency === 'imminent' ? 'error' : 'warning.main'}
              fontWeight={700} sx={{ display: 'block', mt: 0.5 }}>
              {label}
            </Typography>
          )
        })()}
        {order.response_note && (
          <Chip size="small" label={`⏰ ${order.response_note}`} color="success" variant="outlined" sx={{ mt: 1 }} />
        )}

        {tab === 0 && order.status === 'pending' && (
          <Box mt={2}>
            {isAccepting ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                <TextField label={t('when_label')} size="small" autoFocus
                  placeholder={t('when_placeholder')}
                  value={responseNote} onChange={e => onResponseNoteChange(e.target.value)} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {t('consent_accept_hint')}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button variant="outlined" color="inherit" size="small" fullWidth
                    onClick={() => { onSetAccepting(null); onResponseNoteChange('') }}>{tc('cancel')}</Button>
                  <Button variant="contained" color="success" size="small" fullWidth
                    startIcon={<Icon icon="mdi:check" />}
                    onClick={() => onAccept(order.id)}>{t('confirm')}</Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" gap={1} mt={1}>
                <Button variant="outlined" color="error" size="small" fullWidth
                  onClick={() => { haptic(); onUpdateStatus(order.id, 'declined') }}>{t('decline')}</Button>
                <Button variant="contained" color="success" size="small" fullWidth
                  startIcon={<Icon icon="mdi:heart-outline" />}
                  onClick={() => onSetAccepting(order.id)}>{t('accept')}</Button>
              </Box>
            )}
          </Box>
        )}

        {tab === 0 && order.status === 'accepted' && (
          <Box mt={1.5} display="flex" gap={1}>
            <Button variant="outlined" color="error" size="small"
              onClick={() => { haptic(); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_receiver')}</Button>
            <Button variant="outlined" color="secondary" size="small" fullWidth
              startIcon={<Icon icon="mdi:archive-outline" />}
              onClick={() => onUpdateStatus(order.id, 'completed')}>{t('archive')}</Button>
          </Box>
        )}

        {tab === 1 && order.status === 'accepted' && (
          <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 1.5 }}
            onClick={() => { haptic(); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_sender')}</Button>
        )}
        {tab === 1 && order.status === 'pending' && (
          <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 1.5 }}
            onClick={() => { haptic(); onUpdateStatus(order.id, 'declined') }}>{t('withdraw')}</Button>
        )}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Update OrdersPage.tsx**

Remove the `renderOrder` function (lines 170–313) and the `statusLabel`/`statusColor` constants (lines 160–168).

Replace every `renderOrder(o, false, i)` and `renderOrder(o, false)` call with `<OrderCard>`:

```tsx
// In active.map:
{active.map((o, i) => (
  <OrderCard key={o.id} order={o} tab={tab} animIndex={i}
    acceptingId={acceptingId} responseNote={responseNote}
    onAccept={acceptOrder} onUpdateStatus={updateStatus}
    onDelete={deleteOrder} onSetAccepting={setAcceptingId}
    onResponseNoteChange={setResponseNote}
  />
))}

// In history swipe list:
<SwipeToDelete key={o.id} onDelete={() => deleteOrder(o.id)}>
  <OrderCard order={o} tab={tab}
    acceptingId={acceptingId} responseNote={responseNote}
    onAccept={acceptOrder} onUpdateStatus={updateStatus}
    onDelete={deleteOrder} onSetAccepting={setAcceptingId}
    onResponseNoteChange={setResponseNote}
  />
</SwipeToDelete>
```

Add import:
```ts
import { OrderCard } from '../components/orders/OrderCard'
```

Remove imports no longer needed in OrdersPage:
```ts
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
```
(only if not used elsewhere in the file)

Also remove the local `getExpiryUrgency` function since it's now in OrderCard.

- [ ] **Step 3: Verify build**

```bash
cd /home/albin/Documents/onska/onska && npm run build 2>&1 | tail -20
```
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/orders/OrderCard.tsx src/views/OrdersPage.tsx
git commit -m "refactor: extract OrderCard component from OrdersPage"
```

---

### Task 7: Push to remote

- [ ] **Step 1: Push all commits**

```bash
cd /home/albin/Documents/onska/onska && git push
```
