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
