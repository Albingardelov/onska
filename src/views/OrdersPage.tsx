import { useEffect, useState } from 'react'
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
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'

const statusLabel: Record<Order['status'], string> = {
  pending: 'Väntar', accepted: 'Intresserad', declined: 'Inte nu', completed: 'Klar',
}
const statusColor: Record<Order['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
  pending: 'warning', accepted: 'success', declined: 'secondary', completed: 'secondary',
}

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
  const { profile } = useAuth()
  const [tab, setTab] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState('')

  useEffect(() => {
    loadOrders()
    const channel = supabase.channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tab])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*, service:services(*)')
      .eq(tab === 0 ? 'to_user_id' : 'from_user_id', profile!.id)
      .order('created_at', { ascending: false })
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
    setAcceptingId(null); setResponseNote('')
  }

  async function updateStatus(id: string, status: Order['status']) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function deleteOrder(id: string) {
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const active = orders.filter(o => o.status === 'pending' || o.status === 'accepted')
  const history = orders.filter(o => o.status === 'completed' || o.status === 'declined')

  // Group history by week
  const historyByWeek = history.reduce<Record<string, Order[]>>((acc, o) => {
    const key = weekKey(o.created_at)
    ;(acc[key] ??= []).push(o)
    return acc
  }, {})
  const weekKeys = Object.keys(historyByWeek).sort().reverse()
  const mostRecentWeek = weekKeys[0] ?? null

  function renderOrder(order: Order, showDelete = false) {
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
      }}>
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: borderLeft }} />
        <Box sx={{ p: 2.5, pl: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box display="flex" gap={0.8} flexWrap="wrap">
              <Chip size="small" label={order.mode === 'fint' ? 'Light' : 'Dark'} variant="outlined" color="primary" />
              <Chip size="small" label={statusLabel[order.status]} color={statusColor[order.status]} />
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(order.created_at), 'd MMM', { locale: sv })}
              </Typography>
              {showDelete && (
                <IconButton size="small" onClick={() => deleteOrder(order.id)}
                  aria-label="Radera från historik"
                  sx={{ color: 'text.disabled', ml: 0.5, '&:hover': { color: 'text.secondary' } }}>
                  <Icon icon="mdi:delete-outline" width={16} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Typography fontWeight={700} fontSize="1rem">{order.service?.title ?? 'Okänd önskan'}</Typography>
          {order.date && (
            <Typography variant="body2" color="text.secondary">
              {format(new Date(order.date), 'd MMMM yyyy', { locale: sv })}
            </Typography>
          )}
          {order.note && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic" mt={0.5}>
              "{order.note}"
            </Typography>
          )}
          {order.response_note && (
            <Chip size="small" label={`⏰ ${order.response_note}`} color="success" variant="outlined" sx={{ mt: 1 }} />
          )}

          {/* Svara på inkommande önskan */}
          {tab === 0 && order.status === 'pending' && (
            <Box mt={2}>
              {isAccepting ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <TextField label="När passar det? (valfritt)" size="small" autoFocus
                    placeholder="T.ex. klockan 19, om 20 min..."
                    value={responseNote} onChange={e => setResponseNote(e.target.value)} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    Att visa intresse skapar inga förväntningar. Ni kan alltid ändra er.
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button variant="outlined" color="inherit" size="small" fullWidth
                      onClick={() => { setAcceptingId(null); setResponseNote('') }}>Avbryt</Button>
                    <Button variant="contained" color="success" size="small" fullWidth
                      startIcon={<Icon icon="mdi:check" />} onClick={() => acceptOrder(order.id)}>Bekräfta</Button>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" gap={1} mt={1}>
                  <Button variant="outlined" color="inherit" size="small" fullWidth
                    sx={{ color: 'text.secondary' }}
                    onClick={() => updateStatus(order.id, 'declined')}>Inte nu</Button>
                  <Button variant="contained" color="success" size="small" fullWidth
                    startIcon={<Icon icon="mdi:heart-outline" />} onClick={() => setAcceptingId(order.id)}>Ja, gärna!</Button>
                </Box>
              )}
            </Box>
          )}

          {/* Avbryt intresserad önskan (mottagare) */}
          {tab === 0 && order.status === 'accepted' && (
            <Box mt={1.5} display="flex" gap={1}>
              <Button variant="outlined" color="inherit" size="small" sx={{ color: 'text.secondary' }}
                onClick={() => updateStatus(order.id, 'declined')}>Ändra mig</Button>
              <Button variant="outlined" color="secondary" size="small" fullWidth
                startIcon={<Icon icon="mdi:archive-outline" />}
                onClick={() => updateStatus(order.id, 'completed')}>Arkivera</Button>
            </Box>
          )}

          {/* Avbryt skickad önskan (avsändare) */}
          {tab === 1 && order.status === 'accepted' && (
            <Button variant="outlined" color="inherit" size="small" fullWidth
              sx={{ mt: 1.5, color: 'text.secondary' }}
              onClick={() => updateStatus(order.id, 'declined')}>Ändra mig</Button>
          )}
          {tab === 1 && order.status === 'pending' && (
            <Button variant="outlined" color="inherit" size="small" fullWidth
              sx={{ mt: 1.5, color: 'text.secondary' }}
              onClick={() => updateStatus(order.id, 'declined')}>Dra tillbaka</Button>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title="Önskningar" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tab label="Till mig" />
        <Tab label="Mina" />
      </Tabs>

      <Box p={2.5} display="flex" flexDirection="column" gap={1.5} maxWidth={560} width="100%" mx="auto">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />)
        ) : orders.length === 0 ? (
          <Box sx={{ p: 5, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center', mt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              Inga {tab === 0 ? 'inkommande' : 'utgående'} önskningar
            </Typography>
          </Box>
        ) : (
          <>
            {/* Aktiva önskningar */}
            {active.map(o => renderOrder(o))}

            {/* Historik per vecka */}
            {weekKeys.length > 0 && (
              <Box mt={active.length > 0 ? 1 : 0}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', display: 'block', mb: 1 }}>
                  Historik
                </Typography>
                {weekKeys.map(key => (
                  <Accordion key={key} defaultExpanded={key === mostRecentWeek} disableGutters elevation={0}
                    sx={{
                      mb: 0.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px !important',
                      '&:before': { display: 'none' },
                      bgcolor: 'background.paper',
                    }}>
                    <AccordionSummary
                      expandIcon={<Icon icon="mdi:chevron-down" />}
                      sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0 } }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {weekLabel(historyByWeek[key][0].created_at)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, alignSelf: 'center' }}>
                        {historyByWeek[key].length} st
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {historyByWeek[key].map(o => renderOrder(o, true))}
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
