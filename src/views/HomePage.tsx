'use client'
import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import { subscribeToPush } from '../lib/notifications'
import type { Service, Order } from '../types'
import { format, addDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
      sx={{ letterSpacing: '-0.01em', mb: 1.5, fontSize: '0.8rem', textTransform: 'uppercase' }}>
      {children}
    </Typography>
  )
}

export function HomePage() {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const { partner, profile, user } = useAuth()
  const { mode } = useMode()
  const [services, setServices] = useState<Service[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [activatingNotif, setActivatingNotif] = useState(false)
  const [showModeHint, setShowModeHint] = useState(false)
  const [partnerBlockedIds, setPartnerBlockedIds] = useState<Set<string>>(new Set())
  const [todayBlockedIds, setTodayBlockedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('modeHintSeen')) {
      localStorage.setItem('modeHintSeen', '1')
      setTimeout(() => setShowModeHint(true), 2500)
    }
  }, [])

  useEffect(() => {
    if (!partner) return
    loadData()
    loadTodayBlocked()
    const channel = supabase.channel('home-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_availability' }, () => loadTodayBlocked())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [partner, mode])

  useEffect(() => {
    if (selectedDate && partner) loadPartnerBlocked(selectedDate)
    else setPartnerBlockedIds(new Set())
  }, [selectedDate, partner])

  async function loadData() {
    setLoading(true)
    const [servicesRes, inboxRes, sentRes] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', partner!.id).eq('mode', mode).eq('active', true),
      supabase.from('orders').select('*, service:services(*)').eq('to_user_id', profile!.id).eq('status', 'accepted'),
      supabase.from('orders').select('*, service:services(*)').eq('from_user_id', profile!.id).eq('status', 'accepted'),
    ])
    setServices(servicesRes.data ?? [])
    setActiveOrders([...(inboxRes.data ?? []), ...(sentRes.data ?? [])])
    setLoading(false)
  }

  async function loadTodayBlocked() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('service_availability')
      .select('service_id')
      .eq('user_id', partner!.id)
      .eq('date', today)
    setTodayBlockedIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  async function loadPartnerBlocked(date: string) {
    const { data } = await supabase
      .from('service_availability')
      .select('service_id')
      .eq('user_id', partner!.id)
      .eq('date', date)
    setPartnerBlockedIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  const days = Array.from({ length: 30 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))

  async function enableNotifications() {
    setActivatingNotif(true)
    await subscribeToPush(user!.id)
    setNotifStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
    setActivatingNotif(false)
  }

  async function placeOrder() {
    if (!selectedService || !profile || !partner) return
    setOrdering(true)
    const title = selectedService.title
    await supabase.from('orders').insert({
      from_user_id: profile.id, to_user_id: partner.id,
      service_id: selectedService.id, date: selectedDate,
      status: 'pending', note: note || null, mode,
    })
    fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: { to_user_id: partner.id, from_user_id: profile.id, service_id: selectedService.id, mode } }),
    }).catch(() => {})
    setSuccessTitle(title)
    setSuccess(true); setSelectedService(null); setSelectedDate(null); setNote('')
    setOrdering(false)
    setTimeout(() => setSuccess(false), 4000)
  }

  if (!partner) {
    return (
      <Box flex={1} display="flex" flexDirection="column">
        <Header title={t('header')} />
        <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={4}>
          <Typography color="text.secondary">{t('no_partner')}</Typography>
        </Box>
      </Box>
    )
  }

  const upcomingOrders = activeOrders.filter(o => o.from_user_id === profile!.id)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const blockedTodayCount = todayBlockedIds.size

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={t('header')} />
      <Box pb={4} display="flex" flexDirection="column" maxWidth={560} width="100%" mx="auto">

        {/* Hero */}
        <Box sx={{
          px: 2.5, pt: 2.5, pb: 2,
          background: mode === 'snusk'
            ? 'linear-gradient(160deg, #C026D3 0%, #7C3AED 100%)'
            : 'linear-gradient(160deg, #CC2E6A 0%, #A82158 100%)',
          color: '#fff',
        }}>
          <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'capitalize', letterSpacing: '0.03em' }}>
            {format(new Date(), 'EEEE d MMMM', { locale: sv })}
          </Typography>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em" mt={0.3} mb={1.5}>
            {t('greeting', { name: partner.name })}
          </Typography>

          {/* Partner availability today */}
          {loading ? null : blockedTodayCount === 0 ? (
            <Box display="flex" alignItems="center" gap={0.8}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
              <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.9 }}><Icon icon="mdi:check-circle-outline" /></Box>
              <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
                {t('open_for_all', { name: partner.name })}
              </Typography>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={0.8}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
              <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.9 }}><Icon icon="mdi:information-outline" /></Box>
              <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
                {blockedTodayCount === 1 ? t('blocked_one', { name: partner.name }) : t('blocked_many', { name: partner.name, count: blockedTodayCount })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Notification prompt */}
        {notifStatus === 'unknown' && (
          <Box sx={{
            mx: 2.5, mt: 1.5, p: 1.5, borderRadius: 2,
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex', flexShrink: 0 }}>
              <Icon icon="mdi:bell-outline" />
            </Box>
            <Box flex={1}>
              <Typography variant="body2" fontWeight={700} lineHeight={1.3}>{t('notif_hint_title')}</Typography>
              <Typography variant="caption" color="text.secondary">{t('notif_hint_body', { name: partner.name })}</Typography>
            </Box>
            <Button size="small" variant="contained" onClick={enableNotifications} disabled={activatingNotif}
              sx={{ flexShrink: 0, minWidth: 0, px: 1.5 }}>
              {activatingNotif ? '...' : t('notif_enable')}
            </Button>
          </Box>
        )}

        <Box px={2.5} pt={3} display="flex" flexDirection="column" gap={3.5}>

          {/* Kommande önskningar */}
          {upcomingOrders.length > 0 && (
            <Box>
              <SectionLabel>{t('planned_section')}</SectionLabel>
              <Box display="flex" flexDirection="column" gap={1.5}>
                {upcomingOrders.map(order => (
                  <Box key={order.id} sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(46,155,95,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <Box sx={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                      bgcolor: 'success.main',
                    }} />
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" pl={0.5}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                          <Box component="span" sx={{ fontSize: 14, color: 'success.main', display: 'inline-flex' }}><Icon icon="mdi:check-circle" /></Box>
                          <Typography variant="caption" fontWeight={700} color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                            {t('accepted_label')}
                          </Typography>
                        </Box>
                        <Typography fontWeight={700} fontSize="1rem" letterSpacing="-0.02em">
                          {order.service?.title ?? 'Okänd tjänst'}
                        </Typography>
                        {order.date && (
                          <Typography variant="body2" color="text.secondary" mt={0.3}>
                            {format(new Date(order.date), 'EEEE d MMMM', { locale: sv })}
                          </Typography>
                        )}
                        {order.response_note && (
                          <Typography variant="body2" color="text.secondary" mt={0.3}>
                            {order.response_note}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', mt: 0.2 }}>
                        <Icon icon={order.mode === 'snusk' ? 'mdi:weather-night' : 'mdi:weather-sunny'} />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Partner services */}
          <Box>
            <SectionLabel>{t('ideas_label', { name: partner.name })}</SectionLabel>
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
                  {t('no_ideas', { name: partner.name })}
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {services.map(service => {
                  const selected = selectedService?.id === service.id
                  const blockedForDate = selectedDate ? partnerBlockedIds.has(service.id) : false
                  const blockedToday = !selectedDate && todayBlockedIds.has(service.id)
                  const isBlocked = blockedForDate || blockedToday
                  return (
                    <Box key={service.id} onClick={() => setSelectedService(selected ? null : service)}
                      sx={{
                        p: 2.5, borderRadius: 2, cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selected ? 'success.main' : 'divider',
                        bgcolor: 'background.paper',
                        boxShadow: selected
                          ? '0 0 0 3px rgba(46,155,95,0.12), 0 2px 8px rgba(0,0,0,0.06)'
                          : '0 1px 4px rgba(0,0,0,0.05)',
                        opacity: isBlocked ? 0.45 : 1,
                        transition: 'all 0.15s ease',
                        '&:hover': !isBlocked ? { borderColor: selected ? 'success.main' : 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } : {},
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
                            <Typography variant="caption" color="text.disabled" mt={0.5} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

          {/* Date picker */}
          {selectedService && (
            <Box>
              <SectionLabel>{t('suggest_date')}</SectionLabel>
              <Box display="flex" gap={1} overflow="auto" pb={0.5} sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                {/* No date / clear selection */}
                <Box onClick={() => setSelectedDate(null)} sx={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  px: 1.5, py: 1.2, borderRadius: 2, cursor: 'pointer', minWidth: 52,
                  border: '2px solid',
                  borderColor: selectedDate === null ? 'primary.main' : 'divider',
                  bgcolor: selectedDate === null ? 'primary.main' : 'background.paper',
                  color: selectedDate === null ? 'primary.contrastText' : 'text.secondary',
                  transition: 'all 0.12s ease',
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('date_any')}
                  </Typography>
                  <Typography fontWeight={700} fontSize="1.1rem" lineHeight={1.3}>–</Typography>
                </Box>
                {days.slice(0, 14).map(dateStr => {
                  const d = new Date(dateStr)
                  const selected = selectedDate === dateStr
                  const isToday = dateStr === todayStr
                  return (
                    <Box key={dateStr} onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
                      sx={{
                        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        px: 1.5, py: 1.2, borderRadius: 2, cursor: 'pointer', minWidth: 52,
                        border: '2px solid',
                        borderColor: selected ? 'primary.main' : isToday ? 'primary.main' : 'divider',
                        bgcolor: selected ? 'primary.main' : 'background.paper',
                        color: selected ? 'primary.contrastText' : 'text.primary',
                        transition: 'all 0.12s ease',
                      }}>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isToday && !selected ? t('today_label') : format(d, 'EEE', { locale: sv })}
                      </Typography>
                      <Typography fontWeight={700} fontSize="1.1rem" lineHeight={1.3}>{format(d, 'd')}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}

          {selectedService && (
            <TextField label={t('note_label')} value={note}
              onChange={e => setNote(e.target.value)} placeholder={t('note_placeholder')} multiline rows={2} />
          )}

          {selectedService && (
            <Button variant="contained" size="large" onClick={placeOrder} disabled={ordering}
              startIcon={<Icon icon="mdi:send" />}
              sx={{ py: 1.7, fontSize: '1rem', letterSpacing: '-0.01em', fontWeight: 700 }}>
              {ordering ? tc('sending') : t('wish_button', { title: selectedService.title })}
            </Button>
          )}

          {success && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 2, borderRadius: 2,
              bgcolor: 'success.main', color: '#fff',
              '@keyframes slideUp': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <Box component="span" sx={{ fontSize: 24, display: 'flex', flexShrink: 0 }}>
                <Icon icon="mdi:heart" />
              </Box>
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem">{t('wish_sent')}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {successTitle} — {t('wish_sent_subtitle', { name: partner.name })}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* One-time mode hint */}
      <Snackbar
        open={showModeHint}
        autoHideDuration={6000}
        onClose={() => setShowModeHint(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80 } }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          px: 2, py: 1.5, borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
          maxWidth: 320,
        }}>
          <Box component="span" sx={{ fontSize: 18, color: 'primary.main', display: 'flex', flexShrink: 0, mt: 0.2 }}>
            <Icon icon="mdi:weather-sunny" />
          </Box>
          <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
            {t('mode_hint')}
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  )
}
