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
            aria-disabled={isPast ? true : undefined}
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
