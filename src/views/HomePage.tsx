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


export function HomePage() {
  const t = useTranslations('home')
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
  const [sheetOpen, setSheetOpen] = useState(false)
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

  function handleSheetClose() {
    setSheetOpen(false)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setNote('')
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

        {/* CTA */}
        <Box sx={{ mx: 2.5, mt: 2.5 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => setSheetOpen(true)}
            startIcon={<Icon icon={mode === 'snusk' ? 'mdi:fire' : 'mdi:heart-outline'} />}
            sx={{ py: 1.8, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', borderRadius: 3 }}
          >
            {mode === 'snusk' ? t('cta_snusk') : t('cta_fint')}
          </Button>
        </Box>

        <Box px={2.5} pt={3} display="flex" flexDirection="column" gap={3.5}>

          {/* Success banner */}
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

          {/* Planerade önskningar */}
          {upcomingOrders.length > 0 && (
            <Box>
              <SectionLabel>{t('planned_section')}</SectionLabel>
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
      <Snackbar
        open={showSnuskHint}
        onClose={() => setShowSnuskHint(false)}
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
              <Button size="small" onClick={() => setShowSnuskHint(false)} sx={{ fontSize: '0.7rem' }}>
                OK
              </Button>
            </Box>
          </Box>
        </Box>
      </Snackbar>

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
