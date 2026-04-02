import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Link from 'next/link'
import { Header } from '../components/Header'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { OrderCard } from '../components/orders/OrderCard'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'

type Filter = 'all' | 'incoming' | 'mine'

export function OrdersPage() {
  const t = useTranslations('orders')
  const { profile, partner } = useAuth()
  const { mode } = useMode()
  const [filter, setFilter] = useState<Filter>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const reminderSentRef = useRef(false)

  useEffect(() => {
    loadOrders()
    const channel = supabase.channel('orders-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders(true))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true)
    const { data: rawData } = await supabase.from('orders')
      .select('*, service:services(*)')
      .or(`to_user_id.eq.${profile!.id},from_user_id.eq.${profile!.id}`)
      .order('created_at', { ascending: false })

    let data = rawData

    const now = new Date()
    const expired = (data ?? []).filter(
      o => o.to_user_id === profile!.id && o.status === 'pending' && o.expires_at !== null && new Date(o.expires_at) < now
    )
    if (expired.length > 0) {
      const ids = expired.map(o => o.id)
      await supabase.from('orders').update({ status: 'declined' }).in('id', ids)
      data = (data ?? []).map(o => ids.includes(o.id) ? { ...o, status: 'declined' as const } : o)
    }

    setOrders(data ?? [])
    setLoading(false)

    if (!reminderSentRef.current) {
      const imminentPending = (data ?? []).filter(o => {
        if (o.to_user_id !== profile!.id || o.status !== 'pending' || !o.expires_at) return false
        const diff = new Date(o.expires_at).getTime() - Date.now()
        return diff > 0 && diff < 2 * 60 * 60 * 1000
      })
      if (imminentPending.length > 0) {
        reminderSentRef.current = true
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record: {
              to_user_id: profile!.id,
              from_user_id: profile!.id,
              service_id: imminentPending[0].service_id,
              mode: imminentPending[0].mode,
              status: 'expiry_reminder',
            }
          }),
        }).catch(() => {})
      }
    }
  }

  async function acceptOrder(id: string, note: string) {
    await supabase.from('orders').update({ status: 'accepted', response_note: note.trim() || null }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted', response_note: note.trim() || null } : o))
    const order = orders.find(o => o.id === id)
    if (order) {
      fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: { to_user_id: order.from_user_id, from_user_id: order.to_user_id, service_id: order.service_id, mode: order.mode, status: 'accepted', response_note: note.trim() || null } }),
      }).catch(() => {})
    }
    if ('vibrate' in navigator) navigator.vibrate(20)
    confetti({
      particleCount: 80,
      spread: 65,
      origin: { y: 0.65 },
      colors: mode === 'snusk'
        ? ['#C41230', '#E84060', '#fff', '#F5E4E8']
        : ['#CC2E6A', '#FFB3C1', '#fff', '#FF6B8A'],
    })
  }

  async function updateStatus(id: string, status: Order['status']) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) setOrders(prev => prev.filter(o => o.id !== id))
  }

  const pendingIncoming = orders.filter(o => o.to_user_id === profile!.id && o.status === 'pending').length

  const filtered = orders.filter(o => {
    if (filter === 'incoming') return o.to_user_id === profile!.id
    if (filter === 'mine') return o.from_user_id === profile!.id
    return true
  })

  const active = filtered.filter(o => o.status === 'pending' || o.status === 'accepted')
  const memories = filtered.filter(o => o.status === 'completed' || o.status === 'declined')

  const memoriesByMonth = memories.reduce<Record<string, Order[]>>((acc, o) => {
    const key = format(new Date(o.created_at), 'MMMM yyyy', { locale: sv })
    ;(acc[key] ??= []).push(o)
    return acc
  }, {})
  const monthKeys = Object.keys(memoriesByMonth)

  const filterPills: { id: Filter; label: string }[] = [
    { id: 'all', label: t('filter_all') },
    { id: 'incoming', label: t('filter_incoming') },
    { id: 'mine', label: t('filter_mine') },
  ]

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={t('header')} />

      {/* Filter pills */}
      <Box display="flex" gap={1} px={2.5} pt={2} pb={0.5}>
        {filterPills.map(f => {
          const isActive = filter === f.id
          const showBadge = f.id === 'incoming' && pendingIncoming > 0
          return (
            <Box key={f.id} onClick={() => setFilter(f.id)} sx={{ position: 'relative', cursor: 'pointer' }}>
              <Box sx={{
                px: 1.8, py: 0.6, borderRadius: 99,
                bgcolor: isActive ? 'primary.main' : 'action.hover',
                color: isActive ? 'primary.contrastText' : 'text.secondary',
                transition: 'all 0.15s',
                userSelect: 'none',
              }}>
                <Typography variant="caption" fontWeight={isActive ? 700 : 500} sx={{ whiteSpace: 'nowrap' }}>
                  {f.label}
                </Typography>
              </Box>
              {showBadge && (
                <Box sx={{
                  position: 'absolute', top: -4, right: -4,
                  width: 16, height: 16, borderRadius: '50%',
                  bgcolor: 'error.main', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid', borderColor: 'background.default',
                }}>
                  {pendingIncoming > 9 ? '9+' : pendingIncoming}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      <Box p={2.5} pt={1.5} display="flex" flexDirection="column" gap={1.5} maxWidth={560} width="100%" mx="auto">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />)
        ) : filtered.length === 0 && orders.length > 0 ? (
          <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center', mt: 1 }}>
            <Typography color="text.secondary" variant="body2">{t('no_wishes_filter')}</Typography>
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Hero empty state */}
            <Box sx={{
              p: 3, borderRadius: 3, textAlign: 'center',
              background: mode === 'snusk'
                ? 'linear-gradient(145deg, #8B0A24 0%, #5C0618 55%, #3A020E 100%)'
                : 'linear-gradient(145deg, #CC2E6A 0%, #A82158 55%, #8B1A49 100%)',
              color: '#fff',
              position: 'relative', overflow: 'hidden',
              '&::before': {
                content: '""', position: 'absolute',
                top: -40, right: -40, width: 140, height: 140,
                borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
              },
            }}>
              <Box component="span" sx={{ fontSize: 44, display: 'flex', justifyContent: 'center', mb: 1.5, opacity: 0.9 }}>
                <Icon icon="mdi:heart-outline" />
              </Box>
              <Typography fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em" mb={0.5}>
                {t('empty_title', { name: partner?.name ?? '...' })}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, lineHeight: 1.6, mb: 2 }}>
                {t('empty_body')}
              </Typography>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<Icon icon="mdi:heart-plus-outline" />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  {t('empty_cta')}
                </Button>
              </Link>
            </Box>

            {/* How it works */}
            {[
              { icon: 'mdi:cursor-default-click-outline', label: t('howto_1') },
              { icon: 'mdi:bell-outline', label: t('howto_2', { name: partner?.name ?? '...' }) },
              { icon: 'mdi:check-circle-outline', label: t('howto_3') },
            ].map((item, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1.5} px={0.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Box component="span" sx={{ fontSize: 18, color: 'primary.main', display: 'flex' }}>
                    <Icon icon={item.icon} />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <>
            {active.map((o, i) => (
              <OrderCard
                key={o.id}
                order={o}
                isIncoming={o.to_user_id === profile!.id}
                onAccept={acceptOrder}
                onUpdateStatus={updateStatus}
                animIndex={i}
              />
            ))}

            {monthKeys.length > 0 && (
              <Box mt={active.length > 0 ? 1 : 0}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 2 }}>
                  {t('memories')}
                </Typography>
                {monthKeys.map(month => (
                  <Box key={month} mb={2.5}>
                    {/* Diary-style month separator */}
                    <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                      <Typography sx={{
                        color: 'text.disabled', fontSize: '0.62rem', letterSpacing: '0.12em',
                        textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap',
                      }}>
                        {month}
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {memoriesByMonth[month].map(o => (
                        <SwipeToDelete key={o.id} onDelete={() => deleteOrder(o.id)}>
                          <OrderCard
                            order={o}
                            isIncoming={o.to_user_id === profile!.id}
                            onAccept={acceptOrder}
                            onUpdateStatus={updateStatus}
                          />
                        </SwipeToDelete>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
