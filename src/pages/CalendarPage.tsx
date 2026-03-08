import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

export function CalendarPage() {
  const { profile } = useAuth()
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { loadAvailability() }, [currentMonth])

  async function loadAvailability() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('availability').select('*')
      .eq('user_id', profile!.id).gte('date', start).lte('date', end)
    const map = new Map<string, boolean>()
    data?.forEach((a: { date: string; available: boolean }) => map.set(a.date, a.available))
    setAvailability(map)
  }

  async function toggleDay(dateStr: string) {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (dateStr < today) return
    setSaving(dateStr)
    const newVal = !(availability.get(dateStr) ?? true)
    await supabase.from('availability').upsert(
      { user_id: profile!.id, date: dateStr, available: newVal },
      { onConflict: 'user_id,date' }
    )
    setAvailability(prev => new Map(prev).set(dateStr, newVal))
    setSaving(null)
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOffset = (getDay(days[0]) + 6) % 7
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <Box flex={1} display="flex" flexDirection="column" pb={10}>
      <Header title="Min kalender" />
      <Box p={2}>
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Tryck på en dag för att markera den som <strong>inte ledig</strong>. Alla dagar är lediga om inget annat anges.
          </Typography>
        </Paper>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <IconButton onClick={() => setCurrentMonth(m => addDays(startOfMonth(m), -1))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} textTransform="capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: sv })}
          </Typography>
          <IconButton onClick={() => setCurrentMonth(m => addDays(endOfMonth(m), 1))}>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Box display="grid" sx={{ gridTemplateColumns: 'repeat(7, 1fr)' }} mb={0.5}>
          {['Mån','Tis','Ons','Tor','Fre','Lör','Sön'].map(d => (
            <Typography key={d} variant="caption" fontWeight={700} color="text.secondary" textAlign="center" py={0.5}>
              {d}
            </Typography>
          ))}
        </Box>

        <Box display="grid" sx={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {Array.from({ length: firstDayOffset }, (_, i) => <Box key={`e${i}`} />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isAvailable = availability.get(dateStr) ?? true
            const isPast = dateStr < today
            const isToday = dateStr === today
            return (
              <Box key={dateStr} onClick={() => !isPast && toggleDay(dateStr)}
                sx={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 2, cursor: isPast ? 'default' : 'pointer', opacity: isPast ? 0.4 : 1,
                  bgcolor: !isAvailable ? 'error.light' : isToday ? 'primary.light' : 'background.paper',
                  border: 2,
                  borderColor: isToday ? 'primary.main' : !isAvailable ? 'error.main' : 'divider',
                  transition: 'all 0.15s',
                }}>
                <Typography variant="body2" fontWeight={isToday ? 800 : 500}
                  color={!isAvailable ? 'error.dark' : isToday ? 'primary.dark' : 'text.primary'}>
                  {saving === dateStr ? '·' : format(day, 'd')}
                </Typography>
              </Box>
            )
          })}
        </Box>

        <Box display="flex" gap={2} mt={2}>
          {[{ bg: 'background.paper', border: 'divider', label: 'Ledig' },
            { bg: 'error.light', border: 'error.main', label: 'Inte ledig' }].map(({ bg, border, label }) => (
            <Box key={label} display="flex" alignItems="center" gap={0.8}>
              <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: bg, border: 1, borderColor: border }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
