import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { Header } from '../components/Header'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { OrderCard } from '../components/orders/OrderCard'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const start = startOfWeek(d, { weekStartsOn: 1 })
  const end = endOfWeek(d, { weekStartsOn: 1 })
  return `${format(start, 'd MMM', { locale: sv })} – ${format(end, 'd MMM', { locale: sv })}`
}

function weekKey(dateStr: string): string {
  return format(startOfWeek(new Date(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}


export function OrdersPage() {
  const t = useTranslations('orders')
  const { profile } = useAuth()
  const { mode } = useMode()
  const [tab, setTab] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState('')
  const reminderSentRef = useRef(false)

  useEffect(() => {
    loadOrders()
    const channel = supabase.channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders(true))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tab])

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true)
    const { data: rawData } = await supabase.from('orders').select('*, service:services(*)')
      .eq(tab === 0 ? 'to_user_id' : 'from_user_id', profile!.id)
      .order('created_at', { ascending: false })
    let data = rawData

    if (tab === 0) {
      const now = new Date()
      const expired = (data ?? []).filter(
        o => o.status === 'pending' && o.expires_at !== null && new Date(o.expires_at) < now
      )
      if (expired.length > 0) {
        const ids = expired.map(o => o.id)
        await supabase.from('orders').update({ status: 'declined' }).in('id', ids)
        data = (data ?? []).map(o =>
          ids.includes(o.id) ? { ...o, status: 'declined' as const } : o
        )
      }
    }

    setOrders(data ?? [])
    setLoading(false)

    // Send one-time reminder push if there are imminent pending orders (tab 0 = incoming)
    if (!reminderSentRef.current && tab === 0) {
      const imminentPending = (data ?? []).filter(o => {
        if (o.status !== 'pending' || !o.expires_at) return false
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

  async function acceptOrder(id: string) {
    await supabase.from('orders').update({ status: 'accepted', response_note: responseNote.trim() || null }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted', response_note: responseNote.trim() || null } : o))
    const order = orders.find(o => o.id === id)
    if (order) {
      fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: { to_user_id: order.from_user_id, from_user_id: order.to_user_id, service_id: order.service_id, mode: order.mode, status: 'accepted', response_note: responseNote.trim() || null } }),
      }).catch(() => {})
    }
    // Celebration: haptic + confetti
    if ('vibrate' in navigator) navigator.vibrate(20)
    confetti({
      particleCount: 80,
      spread: 65,
      origin: { y: 0.65 },
      colors: mode === 'snusk'
        ? ['#C41230', '#E84060', '#fff', '#F5E4E8']
        : ['#CC2E6A', '#FFB3C1', '#fff', '#FF6B8A'],
    })
    setAcceptingId(null); setResponseNote('')
  }

  async function updateStatus(id: string, status: Order['status']) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) setOrders(prev => prev.filter(o => o.id !== id))
  }

  const active = orders.filter(o => o.status === 'pending' || o.status === 'accepted')
  const history = orders.filter(o => o.status === 'completed' || o.status === 'declined')

  const historyByWeek = history.reduce<Record<string, Order[]>>((acc, o) => {
    const key = weekKey(o.created_at)
    ;(acc[key] ??= []).push(o)
    return acc
  }, {})
  const weekKeys = Object.keys(historyByWeek).sort().reverse()
  const mostRecentWeek = weekKeys[0] ?? null

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={t('header')} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tab label={t('tab_incoming')} />
        <Tab label={t('tab_mine')} />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ maxWidth: 560, width: '100%', mx: 'auto' }}>
        <Box sx={{
          px: 2.5, pt: 2.5, pb: 2,
          minHeight: 171,
          display: 'flex', alignItems: 'center',
          background: mode === 'snusk'
            ? 'linear-gradient(145deg, #8B0A24 0%, #5C0618 55%, #3A020E 100%)'
            : 'linear-gradient(145deg, #CC2E6A 0%, #A82158 55%, #8B1A49 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute',
            top: -48, right: -48, width: 160, height: 160,
            borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
          },
          '&::after': {
            content: '""', position: 'absolute',
            bottom: -32, left: -32, width: 120, height: 120,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          },
        }}>
          <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', position: 'relative', zIndex: 1 }}>
            {t('consent_info')}
          </Typography>
        </Box>
        </Box>
      )}

      <Box p={2.5} display="flex" flexDirection="column" gap={1.5} maxWidth={560} width="100%" mx="auto">

        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />)
        ) : orders.length === 0 ? (
          <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center', mt: 1 }}>
            <Box component="span" sx={{ fontSize: 36, display: 'flex', justifyContent: 'center', mb: 1.5, opacity: 0.2 }}>
              <Icon icon={tab === 0 ? 'mdi:inbox-outline' : 'mdi:send-outline'} />
            </Box>
            <Typography color="text.secondary" variant="body2">
              {tab === 0 ? t('no_incoming') : t('no_outgoing')}
            </Typography>
          </Box>
        ) : (
          <>
            {active.map((o, i) => (
              <OrderCard
                key={o.id}
                order={o}
                isIncoming={tab === 0}
                acceptingId={acceptingId}
                responseNote={responseNote}
                onAccept={acceptOrder}
                onUpdateStatus={updateStatus}
                onDelete={deleteOrder}
                onStartAccept={setAcceptingId}
                onCancelAccept={() => { setAcceptingId(null); setResponseNote('') }}
                onResponseNoteChange={setResponseNote}
                animIndex={i}
              />
            ))}

            {weekKeys.length > 0 && (
              <Box mt={active.length > 0 ? 1 : 0}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 1 }}>
                  {t('history')}
                </Typography>
                {weekKeys.map(key => (
                  <Accordion key={key} defaultExpanded={key === mostRecentWeek} disableGutters elevation={0}
                    sx={{
                      mb: 0.5, border: '1px solid', borderColor: 'divider',
                      borderRadius: '8px !important', '&:before': { display: 'none' },
                      bgcolor: 'background.paper',
                    }}>
                    <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}
                      sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0 } }}>
                      <Typography variant="body2" fontWeight={600}>
                        {weekLabel(historyByWeek[key][0].created_at)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, alignSelf: 'center' }}>
                        {historyByWeek[key].length}{t('count_suffix') ? ` ${t('count_suffix')}` : ''}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {historyByWeek[key].map(o => (
                        <SwipeToDelete key={o.id} onDelete={() => deleteOrder(o.id)}>
                          <OrderCard
                            order={o}
                            isIncoming={tab === 0}
                            acceptingId={acceptingId}
                            responseNote={responseNote}
                            onAccept={acceptOrder}
                            onUpdateStatus={updateStatus}
                            onDelete={deleteOrder}
                            onStartAccept={setAcceptingId}
                            onCancelAccept={() => { setAcceptingId(null); setResponseNote('') }}
                            onResponseNoteChange={setResponseNote}
                          />
                        </SwipeToDelete>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
