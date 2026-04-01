'use client'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { ServiceGrid } from './ServiceGrid'
import { SectionLabel } from './SectionLabel'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import type { Service, Profile, Mode } from '../../types'
import type { Locale } from 'date-fns'

interface BookingSheetProps {
  open: boolean
  onClose: () => void
  services: Service[]
  loading: boolean
  mode: Mode
  partner: Profile
  selectedService: Service | null
  selectedDate: string | null
  selectedTime: string | null
  note: string
  partnerMarkedIds: Set<string>
  todayMarkedIds: Set<string>
  ordering: boolean
  days: string[]
  todayStr: string
  dateFnsLocale: Locale
  onSelectService: (s: Service | null) => void
  onSelectDate: (d: string | null) => void
  onSelectTime: (t: string | null) => void
  onNoteChange: (n: string) => void
  onSubmit: () => void
}

export function BookingSheet({
  open, onClose, services, loading, mode, partner,
  selectedService, selectedDate, selectedTime, note,
  partnerMarkedIds, todayMarkedIds, ordering,
  days, todayStr, dateFnsLocale,
  onSelectService, onSelectDate, onSelectTime, onNoteChange, onSubmit,
}: BookingSheetProps) {
  const t = useTranslations('home')
  const tc = useTranslations('common')

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '88vh',
          maxWidth: 560,
          mx: 'auto',
          left: 0,
          right: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Drag handle */}
      <Box display="flex" justifyContent="center" pt={1.5}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
      </Box>

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" px={2.5} pt={1} pb={1.5}>
        <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em">
          {mode === 'snusk' ? t('sheet_title_snusk') : t('sheet_title')}
        </Typography>
        <IconButton size="small" onClick={onClose} edge="end">
          <Icon icon="mdi:close" />
        </IconButton>
      </Box>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px={2.5} pb={5} display="flex" flexDirection="column" gap={3}>
        <ServiceGrid
          services={services}
          loading={loading}
          mode={mode}
          partner={partner}
          selectedService={selectedService}
          selectedDate={selectedDate}
          partnerMarkedIds={partnerMarkedIds}
          todayMarkedIds={todayMarkedIds}
          onSelect={onSelectService}
        />

        {selectedService && (
          <>
            <Box>
              <SectionLabel>{t('suggest_date')}</SectionLabel>
              <DatePicker
                days={days}
                todayStr={todayStr}
                selected={selectedDate}
                onSelect={(date) => { onSelectDate(date); if (!date) onSelectTime(null) }}
                dateFnsLocale={dateFnsLocale}
              />
            </Box>

            {selectedDate && (
              <Box>
                <SectionLabel>{t('pick_time')}</SectionLabel>
                <TimePicker
                  selectedDate={selectedDate}
                  todayStr={todayStr}
                  selected={selectedTime}
                  onSelect={onSelectTime}
                />
              </Box>
            )}

            <TextField
              label={t('note_label')}
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              placeholder={t('note_placeholder')}
              multiline
              rows={2}
            />

            <Button
              variant="contained"
              size="large"
              onClick={onSubmit}
              disabled={ordering}
              startIcon={<Icon icon="mdi:send" />}
              sx={{ py: 1.7, fontSize: '1rem', letterSpacing: '-0.01em', fontWeight: 700 }}
            >
              {ordering
                ? tc('sending')
                : mode === 'snusk'
                  ? t('wish_button_snusk', { title: selectedService.title })
                  : t('wish_button', { title: selectedService.title })}
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  )
}
