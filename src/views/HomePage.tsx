import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import type { Service, Availability, Order } from '../types'
import { format, addDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'

export function HomePage() {
  const { partner, profile } = useAuth()
  const { mode } = useMode()
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!partner) return
    loadData()
  }, [partner, mode])

  async function loadData() {
    setLoading(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const [servicesRes, availRes, inboxRes, sentRes] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', partner!.id).eq('mode', mode).eq('active', true),
      supabase.from('availability').select('*').eq('user_id', partner!.id).gte('date', today),
      supabase.from('orders').select('*, service:services(*)').eq('to_user_id', profile!.id).eq('status', 'accepted'),
      supabase.from('orders').select('*, service:services(*)').eq('from_user_id', profile!.id).eq('status', 'accepted'),
    ])
    setServices(servicesRes.data ?? [])
    setAvailability(availRes.data ?? [])
    setActiveOrders([...(inboxRes.data ?? []), ...(sentRes.data ?? [])])
    setLoading(false)
  }

  function isDateBlocked(dateStr: string): boolean {
    const found = availability.find(a => a.date === dateStr)
    return found ? !found.available : false
  }

  const days = Array.from({ length: 30 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))
    .filter(d => !isDateBlocked(d))

  async function placeOrder() {
    if (!selectedService || !profile || !partner) return
    setOrdering(true)
    await supabase.from('orders').insert({
      from_user_id: profile.id, to_user_id: partner.id,
      service_id: selectedService.id, date: selectedDate,
      status: 'pending', note: note || null, mode,
    })
    fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record: {
          to_user_id: partner.id,
          from_user_id: profile.id,
          service_id: selectedService.id,
          mode,
        },
      }),
    }).catch(() => {})
    setSuccess(true); setSelectedService(null); setSelectedDate(null); setNote('')
    setOrdering(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!partner) {
    return (
      <Box flex={1} display="flex" flexDirection="column">
        <Header title="Önska" />
        <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={4}>
          <Typography color="text.secondary">Ingen partner kopplad ännu.</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={mode === 'fint' ? '🌸 Önska' : '🔥 Önska'} />
      <Box p={2} display="flex" flexDirection="column" gap={3}>

        {/* Kommande bokningar */}
        {activeOrders.filter(o => o.from_user_id === profile!.id).length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              Kommande bokningar
            </Typography>
            <Box mt={1} display="flex" flexDirection="column" gap={1.5}>
              {activeOrders.filter(o => o.from_user_id === profile!.id).map(order => (
                <Paper key={order.id} elevation={0} sx={{
                  p: 2.5, borderRadius: 4,
                  background: order.mode === 'snusk'
                    ? 'linear-gradient(135deg, #ff6b6b18 0%, #ff8e5318 100%)'
                    : 'linear-gradient(135deg, #f857a618 0%, #ff585818 100%)',
                  border: 2,
                  borderColor: order.mode === 'snusk' ? 'error.light' : 'primary.light',
                }}>
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" fontWeight={700} color="success.main" textTransform="uppercase" letterSpacing={0.5}>
                          Accepterad
                        </Typography>
                      </Box>
                      <Typography fontWeight={700} fontSize="1.05rem">
                        {order.service?.title ?? 'Okänd tjänst'}
                      </Typography>
                      {order.date && (
                        <Typography variant="body2" color="text.secondary" mt={0.3}>
                          📅 {format(new Date(order.date), 'EEEE d MMMM', { locale: sv })}
                        </Typography>
                      )}
                      {order.response_note && (
                        <Typography variant="body2" color="text.secondary" mt={0.3}>
                          💬 {order.response_note}
                        </Typography>
                      )}
                    </Box>
                    <Typography fontSize="1.6rem" lineHeight={1}>
                      {order.mode === 'snusk' ? '🔥' : '🌸'}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Partner services */}
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            Beställ av {partner.name}
          </Typography>
          {loading ? (
            <Box mt={1} display="flex" flexDirection="column" gap={1}>
              {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 3 }} />)}
            </Box>
          ) : services.length === 0 ? (
            <Paper elevation={0} sx={{ p: 3, mt: 1, border: 1, borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {partner.name} har inga {mode === 'fint' ? 'fina' : 'snuskiga'} tjänster ännu
              </Typography>
            </Paper>
          ) : (
            <Box mt={1} display="flex" flexDirection="column" gap={1}>
              {services.map(service => (
                <Paper key={service.id} elevation={0} onClick={() => setSelectedService(service)}
                  sx={{
                    p: 2, border: 2, borderRadius: 3, cursor: 'pointer',
                    borderColor: selectedService?.id === service.id ? 'primary.main' : 'divider',
                    bgcolor: selectedService?.id === service.id ? 'action.selected' : 'background.paper',
                    transition: 'all 0.15s',
                  }}>
                  <Typography fontWeight={600}>{service.title}</Typography>
                  {service.description && (
                    <Typography variant="body2" color="text.secondary" mt={0.3}>{service.description}</Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Date picker */}
        {selectedService && (
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              Välj datum (valfritt)
            </Typography>
            <Box mt={1} display="flex" gap={1} overflow="auto" pb={0.5}>
              {days.slice(0, 14).map(dateStr => {
                const d = new Date(dateStr)
                const selected = selectedDate === dateStr
                return (
                  <Box key={dateStr} onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
                    sx={{
                      flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      px: 1.5, py: 1.2, borderRadius: 3, cursor: 'pointer', minWidth: 52, border: 2,
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? 'primary.main' : 'background.paper',
                      color: selected ? 'primary.contrastText' : 'text.primary',
                      transition: 'all 0.15s',
                    }}>
                    <Typography variant="caption" sx={{ opacity: 0.75 }}>{format(d, 'EEE', { locale: sv })}</Typography>
                    <Typography fontWeight={700} fontSize="1rem">{format(d, 'd')}</Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}

        {selectedService && (
          <TextField label="Meddelande (valfritt)" value={note}
            onChange={e => setNote(e.target.value)} placeholder="Skriv något..." multiline rows={2} />
        )}

        {selectedService && (
          <Button variant="contained" size="large" onClick={placeOrder} disabled={ordering}
            startIcon={<ShoppingBagIcon />} sx={{ py: 1.8, borderRadius: 3, fontSize: '1rem' }}>
            Beställ {selectedService.title}
          </Button>
        )}

        {success && <Alert severity="success" sx={{ borderRadius: 3 }}>Beställning skickad!</Alert>}
      </Box>
    </Box>
  )
}
