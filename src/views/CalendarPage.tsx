import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isFuture, isToday } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'

export function CalendarPage() {
  const { profile, partner } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => { loadOrders() }, [currentMonth])

  async function loadOrders() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('orders')
      .select('*, service:services(*)')
      .or(`from_user_id.eq.${profile!.id},to_user_id.eq.${profile!.id}`)
      .eq('status', 'accepted')
      .not('date', 'is', null)
      .gte('date', start)
      .lte('date', end)
    setOrders(data ?? [])
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOffset = (getDay(days[0]) + 6) % 7
  const today = format(new Date(), 'yyyy-MM-dd')

  const ordersByDate = orders.reduce<Record<string, Order[]>>((acc, o) => {
    if (o.date) (acc[o.date] ??= []).push(o)
    return acc
  }, {})

  const selectedDayOrders = selectedDay ? (ordersByDate[selectedDay] ?? []) : []

  // Upcoming orders with dates, sorted
  const upcoming = orders
    .filter(o => o.date && (o.date >= today))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title="Kalender" />
      <Box p={2} maxWidth={480} width="100%" mx="auto" display="flex" flexDirection="column" gap={2}>

        {/* Month nav */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <IconButton onClick={() => { setCurrentMonth(m => addDays(startOfMonth(m), -1)); setSelectedDay(null) }} aria-label="Föregående månad">
            <Icon icon="mdi:chevron-left" />
          </IconButton>
          <Typography variant="h6" fontWeight={700} textTransform="capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: sv })}
          </Typography>
          <IconButton onClick={() => { setCurrentMonth(m => addDays(endOfMonth(m), 1)); setSelectedDay(null) }} aria-label="Nästa månad">
            <Icon icon="mdi:chevron-right" />
          </IconButton>
        </Box>

        {/* Day headers */}
        <Box display="grid" sx={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['Mån','Tis','Ons','Tor','Fre','Lör','Sön'].map(d => (
            <Typography key={d} variant="caption" fontWeight={700} color="text.secondary" textAlign="center" py={0.5}>
              {d}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        <Box display="grid" sx={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {Array.from({ length: firstDayOffset }, (_, i) => <Box key={`e${i}`} />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasOrders = !!ordersByDate[dateStr]?.length
            const isSelected = selectedDay === dateStr
            const isPast = dateStr < today
            const isTodayDate = dateStr === today

            return (
              <Box key={dateStr}
                onClick={() => hasOrders ? setSelectedDay(isSelected ? null : dateStr) : undefined}
                sx={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 2,
                  cursor: hasOrders ? 'pointer' : 'default',
                  opacity: isPast && !hasOrders ? 0.35 : 1,
                  bgcolor: isSelected ? 'primary.main'
                    : hasOrders ? 'primary.light'
                    : isTodayDate ? 'background.paper'
                    : 'transparent',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main'
                    : isTodayDate ? 'primary.main'
                    : hasOrders ? 'primary.light'
                    : 'transparent',
                  transition: 'all 0.12s',
                }}>
                <Typography variant="body2"
                  fontWeight={isTodayDate || hasOrders ? 700 : 400}
                  color={isSelected ? 'primary.contrastText'
                    : hasOrders ? 'primary.dark'
                    : isTodayDate ? 'primary.main'
                    : 'text.primary'}>
                  {format(day, 'd')}
                </Typography>
                {hasOrders && (
                  <Box sx={{
                    width: 4, height: 4, borderRadius: '50%',
                    bgcolor: isSelected ? 'primary.contrastText' : 'primary.main',
                    mt: 0.2,
                  }} />
                )}
              </Box>
            )
          })}
        </Box>

        {/* Selected day details */}
        {selectedDay && selectedDayOrders.length > 0 && (
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'primary.light' }}>
            <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 1 }}>
              {format(new Date(selectedDay), 'EEEE d MMMM', { locale: sv })}
            </Typography>
            {selectedDayOrders.map(o => (
              <Box key={o.id} display="flex" alignItems="center" gap={1} py={0.5}>
                <Box component="span" sx={{ fontSize: 14, color: 'primary.main', display: 'flex' }}>
                  <Icon icon="mdi:heart" />
                </Box>
                <Typography variant="body2" fontWeight={600}>{o.service?.title ?? 'Önskan'}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Upcoming list */}
        {upcoming.length > 0 && (
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 1 }}>
              Planerat framöver
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {upcoming.map(o => (
                <Box key={o.id} sx={{
                  p: 1.5, borderRadius: 2, bgcolor: 'background.paper',
                  border: 1, borderColor: 'divider',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                  <Box component="span" sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0, display: 'flex' }}>
                    <Icon icon="mdi:heart-outline" />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>{o.service?.title ?? 'Önskan'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(o.date!), 'EEEE d MMMM', { locale: sv })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {orders.length === 0 && (
          <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Inga planerade önskningar den här månaden
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
