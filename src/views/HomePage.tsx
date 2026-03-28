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
import { useNotificationPermission } from '../hooks/useNotificationPermission'
import type { Service, Order, Profile } from '../types'
import { getStatusesForMode, isValidStatusKey } from '../lib/statuses'
import type { StatusKey } from '../lib/statuses'
import { format, addDays } from 'date-fns'
import { sv, enUS } from 'date-fns/locale'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { useLocale } from '../contexts/LocaleContext'

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
  const ts = useTranslations('statuses')
  const { partner, profile, user, updateStatus, refreshProfile } = useAuth()
  const { mode } = useMode()
  const { locale } = useLocale()
  const dateFnsLocale = locale === 'en' ? enUS : sv
  const [services, setServices] = useState<Service[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successFading, setSuccessFading] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')
  const { notifStatus, activating: activatingNotif, enableNotifications } = useNotificationPermission(user?.id)
  const [showModeHint, setShowModeHint] = useState(false)
  const [partnerBlockedIds, setPartnerBlockedIds] = useState<Set<string>>(new Set())
  const [todayBlockedIds, setTodayBlockedIds] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    if (selectedService && partnerBlockedIds.has(selectedService.id)) {
      setSelectedService(null)
    }
  }, [partnerBlockedIds])

  useEffect(() => {
    if (!partner?.id) return
    const channel = supabase
      .channel('partner-profile-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${partner.id}`,
      }, () => { refreshProfile() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [partner?.id])

  async function loadData() {
    setLoading(true)
    const [servicesRes, inboxRes, sentRes] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', partner!.id).eq('mode', mode).eq('active', true).order('title', { ascending: true }),
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

  async function placeOrder() {
    if (!selectedService || !profile || !partner) return
    const blockedIds = selectedDate ? partnerBlockedIds : todayBlockedIds
    if (blockedIds.has(selectedService.id)) return
    setOrdering(true)
    const title = selectedService.title
    await supabase.from('orders').insert({
      from_user_id: profile.id, to_user_id: partner.id,
      service_id: selectedService.id, date: selectedDate,
      status: 'pending', note: note || null, mode,
      expires_at: selectedDate
        ? new Date(`${selectedDate}T${selectedTime ? `${selectedTime}:00` : '23:59:59'}`).toISOString()
        : null,
    })
    fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: { to_user_id: partner.id, from_user_id: profile.id, service_id: selectedService.id, mode } }),
    }).catch(() => {})
    setSuccessTitle(title)
    setSuccess(true); setSuccessFading(false); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setNote('')
    setOrdering(false)
    setTimeout(() => setSuccessFading(true), 3200)
    setTimeout(() => { setSuccess(false); setSuccessFading(false) }, 4000)
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
          minHeight: 171,
          background: mode === 'snusk'
            ? 'linear-gradient(145deg, #8B0A24 0%, #5C0618 55%, #3A020E 100%)'
            : 'linear-gradient(145deg, #CC2E6A 0%, #A82158 55%, #8B1A49 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -48,
            right: -48,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -32,
            left: -32,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          },
        }}>
          <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'capitalize', letterSpacing: '0.03em' }}>
            {format(new Date(), 'EEEE d MMMM', { locale: dateFnsLocale })}
          </Typography>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em" mt={0.3} mb={1.5}>
            {mode === 'snusk' ? t('greeting_snusk', { name: partner.name }) : t('greeting', { name: partner.name })}
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

          {isValidStatusKey(partner?.status) && (
            <Box display="flex" alignItems="center" gap={0.8} mt={0.8}
              sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
              <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.8 }}>
                <Icon icon="mdi:heart-pulse" />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85 }}>
                {ts(partner!.status as StatusKey)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Own status */}
        <Box px={2.5} pt={1.5} pb={0.5} display="flex" gap={0.75} flexWrap="wrap">
          {getStatusesForMode(mode).map(key => {
            const isActive = profile?.status === key
            return (
              <Box
                key={key}
                component="button"
                onClick={() => updateStatus(isActive ? null : key)}
                sx={{
                  border: '1.5px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  borderRadius: 10,
                  px: 1.5,
                  py: 0.6,
                  cursor: 'pointer',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  letterSpacing: '0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
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

        {/* Notification prompt */}
        {notifStatus === 'unknown' && !profile?.push_subscription && (
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
                          {order.service?.title ?? t('unknown_service')}
                        </Typography>
                        {order.date && (
                          <Typography variant="body2" color="text.secondary" mt={0.3}>
                            {format(new Date(order.date), 'EEEE d MMMM', { locale: dateFnsLocale })}
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
            <SectionLabel>{mode === 'snusk' ? t('ideas_label_snusk', { name: partner.name }) : t('ideas_label', { name: partner.name })}</SectionLabel>
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
                    <Box key={service.id} onClick={() => {
                        if (isBlocked) return
                        setSelectedService(selected ? null : service)
                      }}
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
                <Box onClick={() => { setSelectedDate(null); setSelectedTime(null) }} sx={{
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
                    <Box key={dateStr} onClick={() => { setSelectedDate(prev => { if (prev === dateStr) { setSelectedTime(null); return null } return dateStr }) }}
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
                        {isToday && !selected ? t('today_label') : format(d, 'EEE', { locale: dateFnsLocale })}
                      </Typography>
                      <Typography fontWeight={700} fontSize="1.1rem" lineHeight={1.3}>{format(d, 'd')}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}

          {selectedService && selectedDate && (
            <Box>
              <SectionLabel>{t('pick_time')}</SectionLabel>
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map(time => {
                  const isSelected = selectedTime === time
                  const isPast = selectedDate === todayStr &&
                    new Date(`${selectedDate}T${time}:00`) < new Date()
                  return (
                    <Box key={time}
                      onClick={() => { if (!isPast) setSelectedTime(prev => prev === time ? null : time) }}
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
            </Box>
          )}

          {selectedService && (
            <TextField label={t('note_label')} value={note}
              onChange={e => setNote(e.target.value)} placeholder={t('note_placeholder')} multiline rows={2} />
          )}

          {selectedService && (
            <Button variant="contained" size="large" onClick={placeOrder} disabled={ordering}
              startIcon={<Icon icon="mdi:send" />}
              sx={{ py: 1.7, fontSize: '1rem', letterSpacing: '-0.01em', fontWeight: 700, animation: 'heartbeat 1.1s ease 0.4s 1 both' }}>
              {ordering ? tc('sending') : mode === 'snusk' ? t('wish_button_snusk', { title: selectedService.title }) : t('wish_button', { title: selectedService.title })}
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
              transition: 'opacity 0.8s ease',
              opacity: successFading ? 0 : 1,
            }}>
              <Box component="span" sx={{ fontSize: 24, display: 'flex', flexShrink: 0, animation: 'heartPop 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s 1 both' }}>
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
