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

const mockCards = [
  { emoji: '🕯️', title: 'En skön massage', sub: 'Imorgon kväll', accepted: true, rotate: '-2deg', offset: 0 },
  { emoji: '🛁', title: 'Badkar för två', sub: 'Ikväll?', accepted: false, rotate: '1.5deg', offset: 24 },
  { emoji: '🌙', title: 'Sova naken ikväll', sub: 'Ingen stress', accepted: true, rotate: '-0.8deg', offset: 10 },
]

export function LoginPage() {
  const t = useTranslations('login')
  const { signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        alignItems: { xs: 'center', md: 'flex-start' },
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 4, md: 9 },
        py: { xs: 7, md: 0 },
        minHeight: { xs: 380, md: 'auto' },
        background: 'linear-gradient(148deg, #D4366E 0%, #C02E64 30%, #9A1E4E 65%, #6B0F35 100%)',
      }}>
        {/* Decorative orbs */}
        <Box sx={{
          position: 'absolute', top: -110, right: -90, width: 440, height: 440,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -90, left: -110, width: 340, height: 340,
          borderRadius: '50%', background: 'rgba(0,0,0,0.14)', pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', top: '38%', right: '8%', width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 460, width: '100%' }}>

          {/* Quote */}
          <Typography sx={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: { xs: '2rem', md: '2.6rem', lg: '3.1rem' },
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 1.22,
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.02em',
            mb: { xs: 4, md: 5.5 },
          }}>
            <Box component="span" sx={{ opacity: 0.45, fontSize: '1.2em', verticalAlign: 'top', lineHeight: 1, mr: 0.5 }}>&ldquo;</Box>
            {t('tagline')}
            <Box component="span" sx={{ opacity: 0.45, fontSize: '1.2em', verticalAlign: 'bottom', lineHeight: 0, ml: 0.5 }}>&rdquo;</Box>
          </Typography>

          {/* Mock wish-cards */}
          <Box sx={{
            display: 'flex', flexDirection: 'column', gap: 1.5,
            '@keyframes gentleFloat': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-10px)' },
            },
            animation: 'gentleFloat 7s ease-in-out infinite',
          }}>
            {mockCards.map((card, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '14px',
                px: 2, py: 1.5,
                transform: `translateX(${card.offset}px) rotate(${card.rotate})`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                transition: 'transform 0.3s ease',
              }}>
                <Box sx={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{card.emoji}</Box>
                <Box flex={1} minWidth={0}>
                  <Typography sx={{
                    color: '#fff', fontWeight: 600, fontSize: '0.88rem',
                    lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {card.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.73rem' }}>
                    {card.sub}
                  </Typography>
                </Box>
                <Box sx={{
                  flexShrink: 0,
                  fontSize: '0.68rem', fontWeight: 700,
                  px: 1.2, py: 0.5,
                  borderRadius: '8px',
                  bgcolor: card.accepted ? 'rgba(46,155,95,0.28)' : 'rgba(255,255,255,0.12)',
                  color: card.accepted ? '#8FEBB5' : 'rgba(255,255,255,0.65)',
                  border: `1px solid ${card.accepted ? 'rgba(46,155,95,0.35)' : 'rgba(255,255,255,0.18)'}`,
                  whiteSpace: 'nowrap',
                }}>
                  {card.accepted ? '✓ Accepterad' : 'Väntar…'}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Footer */}
          <Typography sx={{
            mt: { xs: 4, md: 5 },
            color: 'rgba(255,255,255,0.38)',
            fontSize: '0.76rem',
            letterSpacing: '0.04em',
          }}>
            Privat och säkert — bara ni två.
          </Typography>
        </Box>
      </Box>

    </Box>
  )
}
