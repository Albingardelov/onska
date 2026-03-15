'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import { Icon } from '@iconify/react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslations } from 'next-intl'

export function LoginPage() {
  const t = useTranslations('login')
  const { signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const features = [
    { icon: 'mdi:gift', title: t('feature_wish_title'), desc: t('feature_wish_desc') },
    { icon: 'mdi:calendar', title: t('feature_date_title'), desc: t('feature_date_desc') },
    { icon: 'mdi:history', title: t('feature_memories_title'), desc: t('feature_memories_desc') },
    { icon: 'mdi:shield-lock', title: t('feature_privacy_title'), desc: t('feature_privacy_desc') },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = isRegister ? await signUp(email, password, name) : await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <Box component="main" sx={{ display: 'flex', minHeight: '100dvh', flexDirection: { xs: 'column', md: 'row' } }}>

      {/* Left: Form */}
      <Box sx={{
        width: { xs: '100%', md: '44%' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 3, md: 6 },
        py: { xs: 5, md: 0 },
        bgcolor: 'background.paper',
        borderRight: { md: '1px solid' },
        borderColor: { md: 'divider' },
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <Box display="flex" alignItems="center" gap={1.5} mb={5}>
            <Box component="span" sx={{ fontSize: 32, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:heart" />
            </Box>
            <Typography variant="h5" fontWeight={900} color="primary" letterSpacing="-0.5px">
              {t('app_name')}
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={800} mb={0.5} letterSpacing="-0.5px">
            {isRegister ? t('create_account') : t('welcome_back')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3.5}>
            {isRegister ? t('register_sub') : t('sign_in_sub')}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            {isRegister && (
              <TextField label={t('name_label')} value={name} onChange={e => setName(e.target.value)}
                placeholder={t('name_placeholder')} required autoComplete="name" />
            )}
            <TextField label={t('email_label')} type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <TextField label={t('password_label')} type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              slotProps={{ htmlInput: { minLength: 6 } }}
              autoComplete={isRegister ? 'new-password' : 'current-password'} />

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}
              sx={{ mt: 0.5, borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}>
              {loading ? '...' : isRegister ? t('register_button') : t('sign_in_button')}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Button onClick={() => { setIsRegister(r => !r); setError('') }}
            color="inherit" fullWidth sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            {isRegister ? t('have_account') : t('no_account')}
          </Button>
        </Box>
      </Box>

      {/* Right: Hero */}
      <Box sx={{
        width: { xs: '100%', md: '56%' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 3, md: 8 },
        py: { xs: 6, md: 0 },
        bgcolor: 'background.default',
        background: 'linear-gradient(160deg, #cc2e6a14 0%, #ff9a3c0a 100%)',
      }}>
        <Box sx={{ maxWidth: 520 }}>
          <Typography sx={{
            fontSize: { xs: '2.4rem', md: '3.2rem' },
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            mb: 2,
            color: 'text.primary',
          }}>
            {t('headline')}
            <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
              {t('headline_highlight')}
            </Box>
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={5} lineHeight={1.7} sx={{ maxWidth: 420 }}>
            {t('tagline')}
          </Typography>

          <Box display="flex" flexDirection="column" gap={3}>
            {features.map(({ icon, title, desc }) => (
              <Box key={title} display="flex" alignItems="flex-start" gap={2}>
                <Box component="span" sx={{ fontSize: 24, color: 'primary.main', mt: 0.2, flexShrink: 0, display: 'flex' }}>
                  <Icon icon={icon} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">{desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

    </Box>
  )
}
