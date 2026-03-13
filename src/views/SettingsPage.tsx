import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import { Icon } from '@iconify/react'
import { Header } from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  async function exportData() {
    if (!user) return
    setExporting(true)
    const [profileRes, servicesRes, sentRes, receivedRes, availRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('services').select('*').eq('user_id', user.id),
      supabase.from('orders').select('*').eq('from_user_id', user.id),
      supabase.from('orders').select('*').eq('to_user_id', user.id),
      supabase.from('availability').select('*').eq('user_id', user.id),
    ])
    const data = {
      exportedAt: new Date().toISOString(),
      profile: profileRes.data,
      services: servicesRes.data ?? [],
      sentOrders: sentRes.data ?? [],
      receivedOrders: receivedRes.data ?? [],
      availability: availRes.data ?? [],
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `couply-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function deleteAccount() {
    setDeleting(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (res.ok) {
      await signOut()
    } else {
      const body = await res.json()
      setError(body.error ?? 'Något gick fel')
      setDeleting(false)
    }
  }

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title="Inställningar" />

      <Box p={2.5} pb={4} display="flex" flexDirection="column" gap={3} maxWidth={560} width="100%" mx="auto">

        {/* Account info */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
            Konto
          </Typography>
          <Box mt={1} p={2} borderRadius={2} bgcolor="background.paper"
            sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <Typography fontWeight={600}>{profile?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>
        </Box>

        <Divider />

        {/* GDPR */}
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:shield-lock" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>GDPR & integritet</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
            Du har rätt att ta del av och radera all data vi har om dig. Nedan kan du exportera din information
            eller permanent radera ditt konto.
          </Typography>

          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:download" />}
            onClick={exportData}
            disabled={exporting}
          >
            {exporting ? 'Exporterar...' : 'Exportera min data'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon icon="mdi:delete-forever" />}
            onClick={() => setDeleteOpen(true)}
          >
            Radera mitt konto
          </Button>
        </Box>

        <Divider />

        {/* Accessibility */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:human" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>Tillgänglighet</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
            Couply följer WCAG 2.1 Level AA. Appen fungerar med skärmläsare, tangentbordsnavigering
            och alla skärmstorlekar.
          </Typography>
        </Box>

      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Radera konto?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={error ? 2 : 0}>
            All din data raderas permanent — profil, tjänster, beställningar och kalender. Det går inte att ångra.
          </Typography>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting} color="inherit">
            Avbryt
          </Button>
          <Button onClick={deleteAccount} disabled={deleting} color="error" variant="contained">
            {deleting ? 'Raderar...' : 'Ja, radera allt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
