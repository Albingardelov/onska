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

const features: { icon: string; title: string; desc: string }[] = [
  { icon: 'mdi:gift', title: 'Skicka önskningar', desc: 'Dela med dig av vad du drömmer om – stort som smått.' },
  { icon: 'mdi:calendar', title: 'Boka upplevelser', desc: 'Planera datum och överraska din partner med något speciellt.' },
  { icon: 'mdi:creation', title: 'Skapa minnen', desc: 'Förvandla önskningar till verkliga stunder tillsammans.' },
  { icon: 'mdi:shield-lock', title: 'GDPR & integritet', desc: 'Full kontroll över din data. Radera ditt konto, exportera all din information och läs vår integritetspolicy — allt inbyggt från start.' },
  { icon: 'mdi:human', title: 'Tillgänglighet', desc: 'Couply följer WCAG 2.1 Level AA. Appen fungerar med skärmläsare, tangentbordsnavigering och alla skärmstorlekar.' },
]

export function LoginPage() {
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
    <Box sx={{ display: 'flex', minHeight: '100dvh', flexDirection: { xs: 'column', md: 'row' } }}>

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
              Couply
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={800} mb={0.5} letterSpacing="-0.5px">
            {isRegister ? 'Skapa konto' : 'Välkommen tillbaka'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3.5}>
            {isRegister ? 'Kom igång — det är gratis.' : 'Logga in på ditt konto.'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            {isRegister && (
              <TextField label="Namn" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ditt namn" required autoComplete="name" />
            )}
            <TextField label="E-post" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <TextField label="Lösenord" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              slotProps={{ htmlInput: { minLength: 6 } }}
              autoComplete={isRegister ? 'new-password' : 'current-password'} />

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}
              sx={{ mt: 0.5, borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}>
              {loading ? '...' : isRegister ? 'Skapa konto' : 'Logga in'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Button onClick={() => { setIsRegister(r => !r); setError('') }}
            color="inherit" fullWidth sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            {isRegister ? 'Har du redan ett konto? Logga in' : 'Inget konto? Registrera dig'}
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
        background: 'linear-gradient(160deg, #ff6b8a18 0%, #ff9a3c0a 100%)',
      }}>
        <Box sx={{ maxWidth: 520 }}>
          <Typography
            sx={{
              fontSize: { xs: '2.4rem', md: '3.2rem' },
              fontWeight: 900,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              mb: 2,
              color: 'text.primary',
            }}
          >
            En app för
            <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
              era önskningar.
            </Box>
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={5} lineHeight={1.7} sx={{ maxWidth: 420 }}>
            Dela vad du drömmer om, boka upplevelser tillsammans och skapa stunder som betyder något.
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
