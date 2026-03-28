import { useState, useEffect } from 'react'
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
import { useLocale } from '../contexts/LocaleContext'
import { supabase } from '../lib/supabase'
import { subscribeToPush } from '../lib/notifications'
import { useTranslations } from 'next-intl'

export function SettingsPage() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const ts = useTranslations('services')
  const { user, profile, signOut } = useAuth()
  const { locale, setLocale } = useLocale()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [activatingNotif, setActivatingNotif] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
  }, [])

  async function enableNotifications() {
    setActivatingNotif(true)
    await subscribeToPush(user!.id)
    setNotifStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
    setActivatingNotif(false)
  }

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
      setError(body.error ?? tc('error_generic'))
      setDeleting(false)
    }
  }

  return (
    <Box flex={1} display="flex" flexDirection="column">
      <Header title={t('header')} />

      <Box p={2.5} pb={4} display="flex" flexDirection="column" gap={3} maxWidth={560} width="100%" mx="auto">

        {/* Account info */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
            {t('section_account')}
          </Typography>
          <Box mt={1} p={2} borderRadius={2} bgcolor="background.paper"
            sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <Typography fontWeight={600}>{profile?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>
        </Box>

        <Divider />

        {/* Language */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:translate" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>{t('language_title')}</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant={locale === 'sv' ? 'contained' : 'outlined'}
              onClick={() => setLocale('sv')}
              size="small"
              sx={{ minWidth: 80 }}
            >
              🇸🇪 Svenska
            </Button>
            <Button
              variant={locale === 'en' ? 'contained' : 'outlined'}
              onClick={() => setLocale('en')}
              size="small"
              sx={{ minWidth: 80 }}
            >
              🇬🇧 English
            </Button>
          </Box>
        </Box>

        <Divider />

        {/* Notifications */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:bell-outline" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>Notiser</Typography>
          </Box>
          {notifStatus === 'granted' && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>{ts('notif_granted')}</Alert>
          )}
          {notifStatus === 'denied' && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>Notiser är blockerade</Typography>
              <Typography variant="body2">Aktivera dem i webbläsarens inställningar:</Typography>
              <Typography variant="body2" component="ol" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
                <li>Tryck på låsikonen i adressfältet</li>
                <li>Välj <strong>Behörigheter</strong></li>
                <li>Sätt <strong>Notiser</strong> till Tillåt</li>
                <li>Ladda om sidan</li>
              </Typography>
            </Alert>
          )}
          {notifStatus === 'unsupported' && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>{ts('notif_unsupported')}</Alert>
          )}
          {notifStatus === 'unknown' && (
            <Button variant="contained" startIcon={<Icon icon="mdi:bell-ring-outline" />}
              onClick={enableNotifications} disabled={activatingNotif}>
              {activatingNotif ? tc('activating') : ts('notif_enable')}
            </Button>
          )}
        </Box>

        <Divider />

        {/* GDPR */}
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:shield-lock" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>{t('gdpr_title')}</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
            {t('gdpr_desc')}
          </Typography>

          <Button variant="outlined" startIcon={<Icon icon="mdi:download" />}
            onClick={exportData} disabled={exporting}>
            {exporting ? '...' : t('export_button')}
          </Button>

          <Button variant="outlined" color="error" startIcon={<Icon icon="mdi:delete-forever" />}
            onClick={() => setDeleteOpen(true)}>
            {t('delete_button')}
          </Button>
        </Box>

        <Divider />

        <Button onClick={signOut} color="inherit" sx={{ color: 'text.secondary' }}>
          {t('sign_out')}
        </Button>

      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}
        aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">{t('delete_dialog_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={error ? 2 : 0}>
            {t('delete_dialog_body')}
          </Typography>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting} color="inherit">
            {tc('cancel')}
          </Button>
          <Button onClick={deleteAccount} disabled={deleting} color="error" variant="contained">
            {deleting ? '...' : t('delete_confirm')}
          </Button>
        </DialogActions>

      </Dialog>
    </Box>
  )
}
