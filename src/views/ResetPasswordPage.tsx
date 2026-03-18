'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import { useTranslations } from 'next-intl'

export function ResetPasswordPage() {
  const t = useTranslations('login')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session automatically from the URL hash on load
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  return (
    <Box sx={{
      display: 'flex', minHeight: '100dvh', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      px: 3, bgcolor: 'background.paper',
    }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={5}>
          <Box component="span" sx={{ fontSize: 32, color: 'primary.main', display: 'flex' }}>
            <Icon icon="mdi:heart" />
          </Box>
          <Typography variant="h5" fontWeight={900} color="primary" letterSpacing="-0.5px">
            {t('app_name')}
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={800} mb={0.5} letterSpacing="-0.5px">
          {t('reset_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3.5}>
          {t('reset_sub')}
        </Typography>

        {success ? (
          <Alert severity="success">{t('reset_success')}</Alert>
        ) : !ready ? (
          <Alert severity="info">Verifierar länk...</Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label={t('new_password_label')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              slotProps={{ htmlInput: { minLength: 6 } }}
              autoComplete="new-password"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}
              sx={{ mt: 0.5, borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}>
              {loading ? '...' : t('reset_button')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
