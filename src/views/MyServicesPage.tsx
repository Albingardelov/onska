import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useMode } from '../contexts/ModeContext'
import { supabase } from '../lib/supabase'
import { subscribeToPush } from '../lib/notifications'
import type { Service } from '../types'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import NotificationsIcon from '@mui/icons-material/Notifications'

export function MyServicesPage() {
  const { profile, user } = useAuth()
  const { mode } = useMode()
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
  }, [])

  async function enableNotifications() {
    setActivating(true)
    await subscribeToPush(user!.id)
    setNotifStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
    setActivating(false)
  }
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadServices() }, [mode])

  async function loadServices() {
    setLoading(true)
    const { data } = await supabase.from('services').select('*')
      .eq('user_id', profile!.id).eq('mode', mode).order('created_at', { ascending: true })
    setServices(data ?? [])
    setLoading(false)
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('services').insert({
      user_id: profile!.id, title: title.trim(),
      description: description.trim() || null, mode, active: true,
    })
    setTitle(''); setDescription(''); setShowForm(false); setSaving(false)
    loadServices()
  }

  async function deleteService(id: string) {
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title="Mina tjänster" />

      <Box p={2.5} pb={4} display="flex" flexDirection="column" gap={2.5} maxWidth={560} width="100%" mx="auto">

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {services.length} tjänst{services.length !== 1 ? 'er' : ''} · {mode === 'light' ? 'Light' : 'Dark'}
          </Typography>
        </Box>

        {notifStatus === 'granted' && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>Notiser är aktiverade</Alert>
        )}
        {notifStatus === 'denied' && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>Notiser är blockerade – tillåt dem i webbläsarens inställningar</Alert>
        )}
        {notifStatus === 'unknown' && (
          <Button variant="outlined" startIcon={<NotificationsIcon />} onClick={enableNotifications} disabled={activating}>
            {activating ? 'Aktiverar...' : 'Aktivera notiser'}
          </Button>
        )}
        {notifStatus === 'unsupported' && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>Den här enheten stöder inte notiser</Alert>
        )}

        {/* Add form */}
        {showForm ? (
          <Box sx={{ p: 2.5, borderRadius: 2, border: '1.5px solid', borderColor: 'primary.main', bgcolor: 'background.paper' }}>
            <Box component="form" onSubmit={addService} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Namn på tjänst"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="T.ex. Ryggmassage"
                required autoFocus
              />
              <TextField
                label="Beskrivning (valfritt)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                multiline rows={2}
              />
              <Box display="flex" gap={1}>
                <Button onClick={() => setShowForm(false)} color="inherit" variant="outlined" fullWidth>
                  Avbryt
                </Button>
                <Button type="submit" variant="contained" disabled={saving || !title.trim()} fullWidth>
                  {saving ? '...' : 'Lägg till'}
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <Button onClick={() => setShowForm(true)} variant="outlined" startIcon={<AddIcon />} size="large"
            sx={{ borderStyle: 'dashed', py: 1.8, color: 'text.secondary', borderColor: 'divider',
              '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
            Lägg till tjänst
          </Button>
        )}

        {/* List */}
        {loading ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {[1,2].map(i => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2 }} />)}
          </Box>
        ) : services.length === 0 && !showForm ? (
          <Box sx={{ p: 5, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Inga tjänster ännu — lägg till din första ovan
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {services.map(service => (
              <Box key={service.id} sx={{
                p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                bgcolor: 'background.paper',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              }}>
                <Box flex={1}>
                  <Typography fontWeight={600} letterSpacing="-0.01em">{service.title}</Typography>
                  {service.description && (
                    <Typography variant="body2" color="text.secondary" mt={0.2}>{service.description}</Typography>
                  )}
                </Box>
                <IconButton onClick={() => deleteService(service.id)} size="small"
                  sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
