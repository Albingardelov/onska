import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
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
  const { profile } = useAuth()
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
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center', mt: 1 }}>
            <Box component="span" sx={{ fontSize: 36, display: 'flex', justifyContent: 'center', mb: 1.5, opacity: 0.2 }}>
              <Icon icon="mdi:heart-outline" />
            </Box>
            <Typography color="text.secondary" variant="body2">{t('no_wishes')}</Typography>
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
                    <Typography sx={{
                      display: 'block', textAlign: 'center', mb: 1.5,
                      color: 'text.disabled', fontSize: '0.68rem', letterSpacing: '0.08em',
                      textTransform: 'uppercase', fontWeight: 600,
                    }}>
                      {month}
                    </Typography>
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
