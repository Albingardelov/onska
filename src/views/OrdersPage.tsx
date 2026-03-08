import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DoneAllIcon from '@mui/icons-material/DoneAll'

const statusLabel: Record<Order['status'], string> = {
  pending: 'Väntar', accepted: 'Accepterad', declined: 'Nekad', completed: 'Klar',
}
const statusColor: Record<Order['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
  pending: 'warning', accepted: 'success', declined: 'error', completed: 'secondary',
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

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title="Beställningar" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tab label="Inkorg" />
        <Tab label="Skickade" />
      </Tabs>

      <Box p={2.5} display="flex" flexDirection="column" gap={1.5} maxWidth={560} width="100%" mx="auto">
        {loading ? [1,2,3].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />)
        : orders.length === 0 ? (
          <Box sx={{ p: 5, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center', mt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              Inga {tab === 0 ? 'inkommande' : 'utgående'} beställningar
            </Typography>
          </Box>
        ) : orders.map(order => {
          const isAccepting = acceptingId === order.id
          const borderLeft = order.status === 'pending' ? 'warning.main'
            : order.status === 'accepted' ? 'success.main'
            : order.status === 'declined' ? 'error.main' : 'text.disabled'
          return (
            <Box key={order.id}
              sx={{
                borderRadius: 2, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
                bgcolor: 'background.paper',
                position: 'relative',
              }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: borderLeft }} />
            <Box sx={{ p: 2.5, pl: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box display="flex" gap={0.8} flexWrap="wrap">
                  <Chip size="small" label={order.mode === 'fint' ? '🌸 Fint' : '🔥 Snusk'} variant="outlined" color="primary" />
                  <Chip size="small" label={statusLabel[order.status]} color={statusColor[order.status]} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(order.created_at), 'd MMM', { locale: sv })}
                </Typography>
              </Box>

              <Typography fontWeight={700} fontSize="1rem">{order.service?.title ?? 'Okänd tjänst'}</Typography>
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

              {tab === 0 && order.status === 'pending' && (
                <Box mt={2}>
                  {isAccepting ? (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <TextField label="När passar det?" size="small" autoFocus
                        placeholder="T.ex. klockan 19, om 20 min..."
                        value={responseNote} onChange={e => setResponseNote(e.target.value)} />
                      <Box display="flex" gap={1}>
                        <Button variant="outlined" color="inherit" size="small" fullWidth
                          onClick={() => { setAcceptingId(null); setResponseNote('') }}>Avbryt</Button>
                        <Button variant="contained" color="success" size="small" fullWidth
                          startIcon={<CheckIcon />} onClick={() => acceptOrder(order.id)}>Bekräfta</Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box display="flex" gap={1} mt={1}>
                      <Button variant="outlined" color="error" size="small" fullWidth
                        startIcon={<CloseIcon />} onClick={() => updateStatus(order.id, 'declined')}>Neka</Button>
                      <Button variant="contained" color="success" size="small" fullWidth
                        startIcon={<CheckIcon />} onClick={() => setAcceptingId(order.id)}>Acceptera</Button>
                    </Box>
                  )}
                </Box>
              )}
              {tab === 0 && order.status === 'accepted' && (
                <Button variant="outlined" color="secondary" size="small" fullWidth
                  startIcon={<DoneAllIcon />} sx={{ mt: 1.5 }}
                  onClick={() => updateStatus(order.id, 'completed')}>Markera som klar</Button>
              )}
            </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
