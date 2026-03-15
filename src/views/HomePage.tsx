'use client'
import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import type { Service, Order } from '../types'
import { format, addDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Icon } from '@iconify/react'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
      sx={{ letterSpacing: '-0.01em', mb: 1.5, fontSize: '0.8rem', textTransform: 'uppercase' }}>
      {children}
    </Typography>
  )
}

export function HomePage() {
  const { partner, profile } = useAuth()
  const { mode } = useMode()
  const [services, setServices] = useState<Service[]>([])
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
    const [servicesRes, inboxRes, sentRes] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', partner!.id).eq('mode', mode).eq('active', true),
      supabase.from('orders').select('*, service:services(*)').eq('to_user_id', profile!.id).eq('status', 'accepted'),
      supabase.from('orders').select('*, service:services(*)').eq('from_user_id', profile!.id).eq('status', 'accepted'),
    ])
    setServices(servicesRes.data ?? [])
    setActiveOrders([...(inboxRes.data ?? []), ...(sentRes.data ?? [])])
    setLoading(false)
  }

  const days = Array.from({ length: 30 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))

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
      body: JSON.stringify({ record: { to_user_id: partner.id, from_user_id: profile.id, service_id: selectedService.id, mode } }),
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

  const upcomingOrders = activeOrders.filter(o => o.from_user_id === profile!.id)

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title="Önska" />
      <Box p={2.5} pb={4} display="flex" flexDirection="column" gap={3.5} maxWidth={560} width="100%" mx="auto">

        {/* Kommande önskningar */}
        {upcomingOrders.length > 0 && (
          <Box>
            <SectionLabel>Ni har planerat</SectionLabel>
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
                          Intresserad
                        </Typography>
                      </Box>
                      <Typography fontWeight={700} fontSize="1rem" letterSpacing="-0.02em">
                        {order.service?.title ?? 'Okänd tjänst'}
                      </Typography>
                      {order.date && (
                        <Typography variant="body2" color="text.secondary" mt={0.3}>
                          {format(new Date(order.date), 'EEEE d MMMM', { locale: sv })}
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
          <SectionLabel>{partner.name}s idéer</SectionLabel>
          {loading ? (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={68} sx={{ borderRadius: 2 }} />)}
            </Box>
          ) : services.length === 0 ? (
            <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {partner.name} har inga idéer ännu
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {services.map(service => {
                const selected = selectedService?.id === service.id
                return (
                  <Box key={service.id} onClick={() => setSelectedService(selected ? null : service)}
                    sx={{
                      p: 2, borderRadius: 2, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? 'primary.light' : 'background.paper',
                      boxShadow: selected ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                    }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography fontWeight={600} letterSpacing="-0.01em">{service.title}</Typography>
                        {service.description && (
                          <Typography variant="body2" color="text.secondary" mt={0.2}>{service.description}</Typography>
                        )}
                      </Box>
                      {selected && (
                        <Box component="span" sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0, display: 'inline-flex' }}><Icon icon="mdi:check-circle" /></Box>
                      )}
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
            <SectionLabel>Föreslå ett datum (valfritt)</SectionLabel>
            <Box display="flex" gap={1} overflow="auto" pb={0.5} sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {days.slice(0, 14).map(dateStr => {
                const d = new Date(dateStr)
                const selected = selectedDate === dateStr
                return (
                  <Box key={dateStr} onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
                    sx={{
                      flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      px: 1.5, py: 1.2, borderRadius: 2, cursor: 'pointer', minWidth: 48,
                      border: '1.5px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? 'primary.main' : 'background.paper',
                      color: selected ? 'primary.contrastText' : 'text.primary',
                      transition: 'all 0.12s ease',
                    }}>
                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {format(d, 'EEE', { locale: sv })}
                    </Typography>
                    <Typography fontWeight={700} fontSize="1.05rem" lineHeight={1.3}>{format(d, 'd')}</Typography>
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
            startIcon={<Icon icon="mdi:send" />}
            sx={{ py: 1.7, fontSize: '1rem', letterSpacing: '-0.01em', fontWeight: 700 }}>
            {ordering ? 'Skickar...' : `Önska ${selectedService.title}`}
          </Button>
        )}

        {success && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>Önskan skickad!</Alert>
        )}
      </Box>
    </Box>
  )
}
