import { useEffect, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { Header } from '../components/Header'
import { SwipeToDelete } from '../components/SwipeToDelete'
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
  const tc = useTranslations('common')
  const { profile } = useAuth()
  const { mode } = useMode()
  const [tab, setTab] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState('')

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
  }

  async function acceptOrder(id: string) {
    await supabase.from('orders').update({ status: 'accepted', response_note: responseNote.trim() || null }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted', response_note: responseNote.trim() || null } : o))
    const order = orders.find(o => o.id === id)
    if (order) {
      fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: { to_user_id: order.from_user_id, from_user_id: order.to_user_id, service_id: order.service_id, mode: order.mode, status: 'accepted' } }),
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

  const statusLabel: Record<Order['status'], string> = {
    pending: t('status_pending'),
    accepted: t('status_accepted'),
    declined: t('status_declined'),
    completed: t('status_completed'),
  }
  const statusColor: Record<Order['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
    pending: 'warning', accepted: 'success', declined: 'secondary', completed: 'secondary',
  }

  function renderOrder(order: Order, showDelete = false, animIndex?: number) {
    const isAccepting = acceptingId === order.id
    const borderLeft = order.status === 'pending' ? 'warning.main'
      : order.status === 'accepted' ? 'success.main'
      : 'text.disabled'

    return (
      <Box key={order.id} sx={{
        borderRadius: 2, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
        bgcolor: 'background.paper',
        position: 'relative',
        ...(animIndex !== undefined && {
          animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${animIndex * 55}ms both`,
        }),
      }}>
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: borderLeft }} />
        <Box sx={{ p: 2.5, pl: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box display="flex" gap={0.8} flexWrap="wrap" alignItems="center">
              <Box component="span" sx={{ fontSize: 14, color: 'text.disabled', display: 'inline-flex' }}>
                <Icon icon={order.mode === 'fint' ? 'mdi:weather-sunny' : 'mdi:weather-night'} />
              </Box>
              <Chip size="small" label={statusLabel[order.status]} color={statusColor[order.status]} />
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(order.created_at), 'd MMM', { locale: sv })}
              </Typography>
              {showDelete && (
                <IconButton size="small" onClick={() => deleteOrder(order.id)}
                  aria-label={t('delete_aria')}
                  sx={{ color: 'text.disabled', ml: 0.5, '&:hover': { color: 'text.secondary' } }}>
                  <Icon icon="mdi:delete-outline" width={16} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Typography fontWeight={700} fontSize="1rem">{order.service?.title ?? t('unknown_wish')}</Typography>
          {order.date && (
            <Typography variant="body2" color="text.secondary">
              {format(new Date(order.date), 'd MMMM yyyy', { locale: sv })}
            </Typography>
          )}
          {order.note && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic" mt={0.5}>
              &ldquo;{order.note}&rdquo;
            </Typography>
          )}
          {order.expires_at && order.status === 'pending' && (
            <Chip
              size="small"
              icon={<Icon icon="mdi:clock-alert-outline" width={14} />}
              label={`${t('expires_at_label')} ${format(new Date(order.expires_at), 'HH:mm')}`}
              color="warning"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
          {order.response_note && (
            <Chip size="small" label={`⏰ ${order.response_note}`} color="success" variant="outlined" sx={{ mt: 1 }} />
          )}

          {tab === 0 && order.status === 'pending' && (
            <Box mt={2}>
              {isAccepting ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <TextField label={t('when_label')} size="small" autoFocus
                    placeholder={t('when_placeholder')}
                    value={responseNote} onChange={e => setResponseNote(e.target.value)} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {t('consent_accept_hint')}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button variant="outlined" color="inherit" size="small" fullWidth
                      onClick={() => { setAcceptingId(null); setResponseNote('') }}>{tc('cancel')}</Button>
                    <Button variant="contained" color="success" size="small" fullWidth
                      startIcon={<Icon icon="mdi:check" />} onClick={() => acceptOrder(order.id)}>{t('confirm')}</Button>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" gap={1} mt={1}>
                  <Button variant="outlined" color="error" size="small" fullWidth
                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); updateStatus(order.id, 'declined') }}>{t('decline')}</Button>
                  <Button variant="contained" color="success" size="small" fullWidth
                    startIcon={<Icon icon="mdi:heart-outline" />} onClick={() => setAcceptingId(order.id)}>{t('accept')}</Button>
                </Box>
              )}
            </Box>
          )}

          {tab === 0 && order.status === 'accepted' && (
            <Box mt={1.5} display="flex" gap={1}>
              <Button variant="outlined" color="error" size="small"
                onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); updateStatus(order.id, 'declined') }}>{t('change_mind_receiver')}</Button>
              <Button variant="outlined" color="secondary" size="small" fullWidth
                startIcon={<Icon icon="mdi:archive-outline" />}
                onClick={() => updateStatus(order.id, 'completed')}>{t('archive')}</Button>
            </Box>
          )}

          {tab === 1 && order.status === 'accepted' && (
            <Button variant="outlined" color="error" size="small" fullWidth
              sx={{ mt: 1.5 }}
              onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); updateStatus(order.id, 'declined') }}>{t('change_mind_sender')}</Button>
          )}
          {tab === 1 && order.status === 'pending' && (
            <Button variant="outlined" color="error" size="small" fullWidth
              sx={{ mt: 1.5 }}
              onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); updateStatus(order.id, 'declined') }}>{t('withdraw')}</Button>
          )}
        </Box>
      </Box>
    )
  }

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
            {active.map((o, i) => renderOrder(o, false, i))}

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
                          {renderOrder(o, false)}
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
