'use client'
import { useEffect, useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Link from 'next/link'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import { useNotificationPermission } from '../hooks/useNotificationPermission'
import type { Service, Order } from '../types'
import { HeroBanner } from '../components/home/HeroBanner'
import { StatusPills } from '../components/home/StatusPills'
import { BookingSheet } from '../components/home/BookingSheet'
import { SectionLabel } from '../components/home/SectionLabel'
import { format, addDays } from 'date-fns'
import { sv, enUS } from 'date-fns/locale'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { useLocale } from '../contexts/LocaleContext'

const fadeUp = {
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
}

export function HomePage() {
  const t = useTranslations('home')
  const { partner, profile, user, updateStatus, refreshProfile } = useAuth()
  const { mode } = useMode()
  const { locale } = useLocale()
  const dateFnsLocale = locale === 'en' ? enUS : sv
  const [services, setServices] = useState<Service[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [recentMoment, setRecentMoment] = useState<Order | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successFading, setSuccessFading] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pinging, setPinging] = useState(false)
  const [pingSent, setPingSent] = useState(false)
  const { notifStatus, activating: activatingNotif, enableNotifications } = useNotificationPermission(user?.id)
  const [showModeHint, setShowModeHint] = useState(false)
  const [showSnuskHint, setShowSnuskHint] = useState(false)
  const [partnerMarkedIds, setPartnerMarkedIds] = useState<Set<string>>(new Set())
  const [todayMarkedIds, setTodayMarkedIds] = useState<Set<string>>(new Set())
  const [myTodayOpenCount, setMyTodayOpenCount] = useState(0)

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
    loadTodayMarked()
    loadMyTodayOpen()
    loadRecentMoment()
    const channel = supabase.channel('home-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_availability' }, () => {
        loadTodayMarked()
        loadMyTodayOpen()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [partner, mode])

  useEffect(() => {
    if (mode !== 'snusk' || loading) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('snuskOptInHintSeen')) return
    localStorage.setItem('snuskOptInHintSeen', '1')
    const timer = setTimeout(() => setShowSnuskHint(true), 1500)
    return () => clearTimeout(timer)
  }, [mode, loading])

  useEffect(() => {
    if (selectedDate && partner) loadPartnerMarked(selectedDate)
    else setPartnerMarkedIds(new Set())
  }, [selectedDate, partner])

  useEffect(() => {
    if (!selectedService) return
    const isBlocked = mode === 'snusk'
      ? !partnerMarkedIds.has(selectedService.id)
      : partnerMarkedIds.has(selectedService.id)
    if (isBlocked) setSelectedService(null)
  }, [partnerMarkedIds])

  useEffect(() => {
    if (!partner?.id) return
    const channel = supabase
      .channel('partner-profile-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${partner.id}` },
        () => { refreshProfile() })
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

  async function loadRecentMoment() {
    if (!profile || !partner) return
    const { data } = await supabase
      .from('orders')
      .select('*, service:services(*)')
      .or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`)
      .eq('status', 'completed')
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(1)
    setRecentMoment(data?.[0] ?? null)
  }

  async function loadMyTodayOpen() {
    if (!profile) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const { count } = await supabase
      .from('service_availability')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('date', today)
    setMyTodayOpenCount(count ?? 0)
  }

  async function loadTodayMarked() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('service_availability')
      .select('service_id')
      .eq('user_id', partner!.id)
      .eq('date', today)
    setTodayMarkedIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  async function loadPartnerMarked(date: string) {
    const { data } = await supabase
      .from('service_availability')
      .select('service_id')
      .eq('user_id', partner!.id)
      .eq('date', date)
    setPartnerMarkedIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd')), [])

  const todayIdea = useMemo(() => {
    if (!services.length || !profile || loading) return null
    const candidates = mode === 'snusk'
      ? services.filter(s => todayMarkedIds.has(s.id))
      : services
    if (!candidates.length) return null
    const seed = parseInt(format(new Date(), 'yyyyMMdd').slice(-5)) + profile.id.charCodeAt(0)
    return candidates[seed % candidates.length]
  }, [services, profile, mode, todayMarkedIds, loading])

  function handleSheetClose() {
    setSheetOpen(false)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setNote('')
  }

  function openSheetWithIdea(service: Service) {
    setSelectedService(service)
    setSheetOpen(true)
  }

  async function sendPing() {
    if (!partner || !profile || pinging || pingSent) return
    setPinging(true)
    fetch('/api/send-ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: profile.id, to_user_id: partner.id }),
    }).catch(() => {})
    setPinging(false)
    setPingSent(true)
    setTimeout(() => setPingSent(false), 5000)
  }

  async function placeOrder() {
    if (!selectedService || !profile || !partner) return
    const markedIds = selectedDate ? partnerMarkedIds : todayMarkedIds
    const isBlocked = mode === 'snusk'
      ? !markedIds.has(selectedService.id)
      : markedIds.has(selectedService.id)
    if (isBlocked) return
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
    setOrdering(false)
    handleSheetClose()
    setSuccess(true)
    setSuccessFading(false)
    loadRecentMoment()
    setTimeout(() => setSuccessFading(true), 3200)
    setTimeout(() => { setSuccess(false); setSuccessFading(false) }, 4000)
  }

  if (!partner || !profile) {
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

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={t('header')} />
      <Box pb={4} display="flex" flexDirection="column" maxWidth={560} width="100%" mx="auto">

        <HeroBanner
          mode={mode}
          partner={partner}
          loading={loading}
          openTodayCount={services.filter(s => todayMarkedIds.has(s.id)).length}
          myOpenTodayCount={myTodayOpenCount}
          dateFnsLocale={dateFnsLocale}
        />

        <StatusPills mode={mode} profile={profile} onUpdate={updateStatus} />

        {/* Notification prompt */}
        {notifStatus === 'unknown' && !profile?.push_subscription && (
          <Box sx={{
            mx: 2.5, mt: 1.5, p: 1.5, borderRadius: 2,
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 1.5,
            ...fadeUp, animation: 'fadeUp 0.4s ease both',
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

        {/* Tänker på dig */}
        <Box sx={{ mx: 2.5, mt: 2, ...fadeUp, animation: 'fadeUp 0.4s ease 60ms both' }}>
          <Box
            onClick={sendPing}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.8,
              px: 2, py: 0.75, borderRadius: 20,
              border: '1px solid',
              borderColor: pingSent ? 'success.main' : 'divider',
              cursor: pingSent || pinging ? 'default' : 'pointer',
              bgcolor: pingSent ? 'success.main' : 'transparent',
              color: pingSent ? '#fff' : 'text.secondary',
              transition: 'all 0.2s ease',
              '&:hover': !pingSent ? { borderColor: 'primary.main', color: 'primary.main' } : {},
            }}
          >
            <Box component="span" sx={{ fontSize: 13, display: 'flex' }}>
              <Icon icon={pingSent ? 'mdi:check' : 'mdi:heart-outline'} />
            </Box>
            <Typography variant="caption" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
              {pingSent ? t('thinking_sent') : t('thinking_of_you', { name: partner.name })}
            </Typography>
          </Box>
        </Box>

        {/* CTA */}
        <Box sx={{ mx: 2.5, mt: 1.5, ...fadeUp, animation: 'fadeUp 0.4s ease 120ms both' }}>
          <Button
            fullWidth variant="contained" size="large"
            onClick={() => setSheetOpen(true)}
            startIcon={<Icon icon={mode === 'snusk' ? 'mdi:fire' : 'mdi:heart-outline'} />}
            sx={{
              py: 1.8, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', borderRadius: 3,
              '@keyframes ctaBreathe': {
                '0%, 100%': { boxShadow: mode === 'snusk' ? '0 0 0 0 rgba(196,18,48,0)' : '0 0 0 0 rgba(204,46,106,0)' },
                '50%': { boxShadow: mode === 'snusk' ? '0 0 0 10px rgba(196,18,48,0.07)' : '0 0 0 10px rgba(204,46,106,0.06)' },
              },
              animation: 'ctaBreathe 3.5s ease-in-out 2s infinite',
            }}
          >
            {mode === 'snusk' ? t('cta_snusk') : t('cta_fint')}
          </Button>
        </Box>

        <Box px={2.5} pt={2.5} display="flex" flexDirection="column" gap={3}>

          {/* Success banner */}
          {success && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 2, borderRadius: 2, bgcolor: 'success.main', color: '#fff',
              '@keyframes slideUp': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
              transition: 'opacity 0.8s ease',
              opacity: successFading ? 0 : 1,
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

          {/* Dagens idé */}
          {todayIdea && (
            <Box sx={{ ...fadeUp, animation: 'fadeUp 0.4s ease 180ms both' }}>
              <SectionLabel>{t('todays_idea_label')}</SectionLabel>
              <Box
                onClick={() => openSheetWithIdea(todayIdea)}
                sx={{
                  p: 2.5, borderRadius: 3, bgcolor: 'background.paper',
                  border: '1px solid', borderColor: 'divider',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 2,
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: mode === 'snusk' ? '0 4px 16px rgba(196,18,48,0.12)' : '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box sx={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: mode === 'snusk'
                    ? 'linear-gradient(135deg, rgba(139,10,36,0.5), rgba(58,2,14,0.5))'
                    : 'linear-gradient(135deg, rgba(204,46,106,0.12), rgba(139,26,73,0.08))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon icon={mode === 'snusk' ? 'mdi:fire' : 'mdi:lightbulb-outline'}
                    style={{ fontSize: 20, opacity: 0.7 }} />
                </Box>
                <Box flex={1}>
                  <Typography fontWeight={700} fontSize="0.95rem" letterSpacing="-0.01em">
                    {todayIdea.title}
                  </Typography>
                  {todayIdea.description && (
                    <Typography variant="caption" color="text.secondary" mt={0.2} display="block">
                      {todayIdea.description}
                    </Typography>
                  )}
                </Box>
                <Box component="span" sx={{ fontSize: 18, color: 'primary.main', display: 'flex', flexShrink: 0, opacity: 0.6 }}>
                  <Icon icon="mdi:arrow-right" />
                </Box>
              </Box>
            </Box>
          )}

          {/* Planerade önskningar — alltid synlig */}
          <Box sx={{ ...fadeUp, animation: 'fadeUp 0.4s ease 240ms both' }}>
            <SectionLabel>{t('planned_section')}</SectionLabel>
            {upcomingOrders.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {upcomingOrders.map(order => (
                  <Box key={order.id} sx={{
                    p: 2.5, borderRadius: 2, bgcolor: 'background.paper',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(46,155,95,0.2)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: 'success.main' }} />
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" pl={0.5}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                          <Box component="span" sx={{ fontSize: 14, color: 'success.main', display: 'inline-flex' }}>
                            <Icon icon="mdi:check-circle" />
                          </Box>
                          <Typography variant="caption" fontWeight={700} color="success.main"
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
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
            ) : (
              <Box sx={{
                py: 4, px: 3, borderRadius: 3,
                border: '1.5px dashed', borderColor: 'divider',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
              }}>
                {[72, 110, 150].map((size, i) => (
                  <Box key={i} sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: size, height: size, borderRadius: '50%',
                    border: '1px solid', borderColor: 'divider',
                    opacity: 0.35 - i * 0.08, pointerEvents: 'none',
                  }} />
                ))}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{
                    width: 44, height: 44, mx: 'auto', mb: 1.5, borderRadius: '50%',
                    bgcolor: mode === 'snusk' ? 'rgba(196,18,48,0.07)' : 'rgba(204,46,106,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon icon="mdi:calendar-heart" style={{ fontSize: 22, opacity: 0.4 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} mb={0.3}>
                    {t('no_plans_title')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.55 }}>
                    {t('no_plans_sub', { name: partner.name })}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Senaste omtanken */}
          {recentMoment && (
            <Box sx={{ ...fadeUp, animation: 'fadeUp 0.4s ease 300ms both' }}>
              <SectionLabel>{t('recent_moment_label')}</SectionLabel>
              <Box sx={{
                p: 2.5, borderRadius: 3, bgcolor: 'background.paper',
                border: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  bgcolor: mode === 'snusk' ? 'rgba(196,18,48,0.08)' : 'rgba(204,46,106,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon icon="mdi:history" style={{ fontSize: 18, opacity: 0.55 }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={700} letterSpacing="-0.01em">
                    {recentMoment.service?.title ?? t('unknown_service')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {recentMoment.from_user_id === profile!.id
                      ? t('recent_moment_you')
                      : t('recent_moment_partner', { name: partner.name })}
                    {' · '}
                    {format(new Date(recentMoment.created_at), 'd MMM', { locale: dateFnsLocale })}
                  </Typography>
                </Box>
                <Box component="span" sx={{ fontSize: 18, color: 'success.main', display: 'flex', opacity: 0.5, flexShrink: 0 }}>
                  <Icon icon="mdi:check-circle-outline" />
                </Box>
              </Box>
            </Box>
          )}

        </Box>
      </Box>

      <BookingSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        services={services}
        loading={loading}
        mode={mode}
        partner={partner}
        selectedService={selectedService}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        note={note}
        partnerMarkedIds={partnerMarkedIds}
        todayMarkedIds={todayMarkedIds}
        ordering={ordering}
        days={days}
        todayStr={todayStr}
        dateFnsLocale={dateFnsLocale}
        onSelectService={setSelectedService}
        onSelectDate={setSelectedDate}
        onSelectTime={setSelectedTime}
        onNoteChange={setNote}
        onSubmit={placeOrder}
      />

      {/* One-time snusk opt-in hint */}
      <Snackbar open={showSnuskHint} onClose={() => setShowSnuskHint(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: { xs: 80 } }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          px: 2, py: 1.5, borderRadius: 2, bgcolor: 'background.paper',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)', maxWidth: 320,
        }}>
          <Box component="span" sx={{ fontSize: 18, color: 'primary.main', display: 'flex', flexShrink: 0, mt: 0.2 }}>
            <Icon icon="mdi:lock-outline" />
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
              {t('snusk_optin_hint')}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Button size="small" variant="contained" component={Link} href="/kalender"
                onClick={() => setShowSnuskHint(false)} sx={{ fontSize: '0.7rem', px: 1.5 }}>
                {t('snusk_optin_hint_cta')}
              </Button>
              <Button size="small" onClick={() => setShowSnuskHint(false)} sx={{ fontSize: '0.7rem' }}>OK</Button>
            </Box>
          </Box>
        </Box>
      </Snackbar>

      {/* One-time mode hint */}
      <Snackbar open={showModeHint} autoHideDuration={6000} onClose={() => setShowModeHint(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: { xs: 80 } }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          px: 2, py: 1.5, borderRadius: 2, bgcolor: 'background.paper',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)', maxWidth: 320,
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
