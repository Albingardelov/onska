import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Order, Service } from '../types'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'

export function CalendarPage() {
  const t = useTranslations('calendar')
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [myServices, setMyServices] = useState<Service[]>([])
  const [blockedServiceIds, setBlockedServiceIds] = useState<Set<string>>(new Set())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [daysWithBlocked, setDaysWithBlocked] = useState<Set<string>>(new Set())

  useEffect(() => { loadOrders(); loadDaysWithBlocked() }, [currentMonth])
  useEffect(() => { loadMyServices() }, [])
  useEffect(() => {
    if (selectedDay) loadBlockedForDay(selectedDay)
    else setBlockedServiceIds(new Set())
  }, [selectedDay])

  async function loadOrders() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('orders').select('*, service:services(*)')
      .or(`from_user_id.eq.${profile!.id},to_user_id.eq.${profile!.id}`)
      .eq('status', 'accepted').not('date', 'is', null).gte('date', start).lte('date', end)
    setOrders(data ?? [])
  }

  async function loadDaysWithBlocked() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('service_availability').select('date')
      .eq('user_id', profile!.id).gte('date', start).lte('date', end)
    setDaysWithBlocked(new Set((data ?? []).map((r: { date: string }) => r.date)))
  }

  async function loadMyServices() {
    const { data } = await supabase.from('services').select('*')
      .eq('user_id', profile!.id).eq('active', true).order('created_at')
    setMyServices(data ?? [])
  }

  async function loadBlockedForDay(date: string) {
    const { data } = await supabase.from('service_availability').select('service_id')
      .eq('user_id', profile!.id).eq('date', date)
    setBlockedServiceIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  async function toggleService(serviceId: string) {
    if (!selectedDay) return
    const isBlocked = blockedServiceIds.has(serviceId)
    if (isBlocked) {
      await supabase.from('service_availability').delete()
        .eq('user_id', profile!.id).eq('service_id', serviceId).eq('date', selectedDay)
      setBlockedServiceIds(prev => { const s = new Set(prev); s.delete(serviceId); return s })
    } else {
      await supabase.from('service_availability').insert({ user_id: profile!.id, service_id: serviceId, date: selectedDay })
      setBlockedServiceIds(prev => new Set([...prev, serviceId]))
    }
    loadDaysWithBlocked()
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOffset = (getDay(days[0]) + 6) % 7
  const today = format(new Date(), 'yyyy-MM-dd')
  const ordersByDate = orders.reduce<Record<string, Order[]>>((acc, o) => { if (o.date) (acc[o.date] ??= []).push(o); return acc }, {})
  const upcoming = orders.filter(o => o.date && o.date >= today).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const dayHeaders = t.raw('days') as string[]

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={t('header')} />
      <Box p={2} maxWidth={480} width="100%" mx="auto" display="flex" flexDirection="column" gap={2}>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <IconButton onClick={() => { setCurrentMonth(m => addDays(startOfMonth(m), -1)); setSelectedDay(null) }} aria-label={t('prev_month')}>
            <Icon icon="mdi:chevron-left" />
          </IconButton>
          <Typography variant="h6" fontWeight={700} textTransform="capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: sv })}
          </Typography>
          <IconButton onClick={() => { setCurrentMonth(m => addDays(endOfMonth(m), 1)); setSelectedDay(null) }} aria-label={t('next_month')}>
            <Icon icon="mdi:chevron-right" />
          </IconButton>
        </Box>

        <Box display="grid" sx={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {dayHeaders.map(d => (
            <Typography key={d} variant="caption" fontWeight={700} color="text.secondary" textAlign="center" py={0.5}>{d}</Typography>
          ))}
        </Box>

        <Box display="grid" sx={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {Array.from({ length: firstDayOffset }, (_, i) => <Box key={`e${i}`} />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasOrders = !!ordersByDate[dateStr]?.length
            const hasBlocked = daysWithBlocked.has(dateStr)
            const isSelected = selectedDay === dateStr
            const isPast = dateStr < today
            const isTodayDate = dateStr === today
            return (
              <Box key={dateStr} onClick={() => !isPast && setSelectedDay(isSelected ? null : dateStr)}
                sx={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', position: 'relative',
                  borderRadius: 2, cursor: isPast ? 'default' : 'pointer', opacity: isPast ? 0.35 : 1,
                  bgcolor: isSelected ? 'primary.main' : hasOrders ? 'primary.light' : isTodayDate ? 'background.paper' : 'transparent',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : isTodayDate ? 'primary.main' : hasOrders ? 'primary.light' : 'transparent',
                  transition: 'all 0.12s',
                }}>
                <Typography variant="body2" fontWeight={isTodayDate || hasOrders ? 700 : 400}
                  color={isSelected ? 'primary.contrastText' : hasOrders ? 'primary.dark' : isTodayDate ? 'primary.main' : 'text.primary'}>
                  {format(day, 'd')}
                </Typography>
                {(hasOrders || hasBlocked) && (
                  <Box display="flex" gap={0.4} mt={0.2}>
                    {hasOrders && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isSelected ? 'primary.contrastText' : 'primary.main' }} />}
                    {hasBlocked && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isSelected ? 'primary.contrastText' : 'warning.main' }} />}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>

        <Box display="flex" gap={2}>
          {[{ color: 'primary.main', label: t('legend_planned') }, { color: 'warning.main', label: t('legend_blocked') }].map(({ color, label }) => (
            <Box key={label} display="flex" alignItems="center" gap={0.8}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>

        {selectedDay && (
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="primary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
              {format(new Date(selectedDay), 'EEEE d MMMM', { locale: sv })}
            </Typography>
            {(ordersByDate[selectedDay] ?? []).map(o => (
              <Box key={o.id} display="flex" alignItems="center" gap={1} mb={1}>
                <Box component="span" sx={{ fontSize: 14, color: 'primary.main', display: 'flex' }}><Icon icon="mdi:heart" /></Box>
                <Typography variant="body2" fontWeight={600}>{o.service?.title ?? 'Önskan'}</Typography>
              </Box>
            ))}
            {myServices.length > 0 && (
              <Box mt={ordersByDate[selectedDay]?.length ? 1.5 : 0}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.5 }}>
                  {t('open_hint')}
                </Typography>
                {myServices.map(service => {
                  const isBlocked = blockedServiceIds.has(service.id)
                  return (
                    <Box key={service.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
                      <Typography variant="body2" sx={{ opacity: isBlocked ? 0.45 : 1, textDecoration: isBlocked ? 'line-through' : 'none' }}>
                        {service.title}
                      </Typography>
                      <Switch size="small" checked={!isBlocked} onChange={() => toggleService(service.id)}
                        color="primary" inputProps={{ 'aria-label': service.title }} />
                    </Box>
                  )
                })}
              </Box>
            )}
            {myServices.length === 0 && !ordersByDate[selectedDay]?.length && (
              <Typography variant="body2" color="text.secondary">{t('no_ideas_yet')}</Typography>
            )}
          </Box>
        )}

        {upcoming.length > 0 && (
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 1 }}>
              {t('upcoming')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {upcoming.map(o => (
                <Box key={o.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

        {orders.length === 0 && !selectedDay && (
          <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">{t('empty_hint')}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
