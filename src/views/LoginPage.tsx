'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import EventIcon from '@mui/icons-material/Event'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useAuth } from '../contexts/AuthContext'
import { SvgIconComponent } from '@mui/icons-material'

const features: { Icon: SvgIconComponent; title: string; desc: string }[] = [
  { Icon: CardGiftcardIcon, title: 'Skicka önskningar', desc: 'Dela med dig av vad du drömmer om – stort som smått.' },
  { Icon: EventIcon, title: 'Boka upplevelser', desc: 'Planera datum och överraska din partner med något speciellt.' },
  { Icon: AutoAwesomeIcon, title: 'Skapa minnen', desc: 'Förvandla önskningar till verkliga stunder tillsammans.' },
]

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = isRegister ? await signUp(email, password, name) : await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <Box minHeight="100dvh" display="flex" flexDirection="column" alignItems="center"
      bgcolor="background.default">

      {/* Hero */}
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        pt={8}
        pb={6}
        px={3}
        sx={{
          background: 'linear-gradient(160deg, #ff6b8a22 0%, #ff9a3c11 100%)',
        }}
      >
        <FavoriteIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" fontWeight={900} color="primary" letterSpacing="-1px">
          WishMate
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} mt={1} mb={4}>
          Turn wishes into moments
        </Typography>

        <Typography variant="body1" color="text.secondary" maxWidth={360} mb={5} lineHeight={1.7}>
          En app för par – dela önskningar, boka upplevelser och skapa stunder som betyder något.
        </Typography>

        <Box display="flex" flexDirection="column" gap={1.5} width="100%" maxWidth={320}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => { setIsRegister(true); setShowForm(true) }}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, fontSize: '1rem' }}
          >
            Kom igång gratis
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => { setIsRegister(false); setShowForm(true) }}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 600 }}
          >
            Logga in
          </Button>
        </Box>
      </Box>

      {/* Features */}
      <Box width="100%" maxWidth={480} px={3} py={5} display="flex" flexDirection="column" gap={3}>
        {features.map(({ Icon, title, desc }) => (
          <Box key={title} display="flex" alignItems="flex-start" gap={2}>
            <Icon sx={{ fontSize: 32, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{desc}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Login/Register form */}
      {showForm && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1300,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              maxWidth: 480,
              p: 3,
              borderRadius: '24px 24px 0 0',
              pb: 5,
            }}
          >
            <Box width={40} height={4} bgcolor="divider" borderRadius={2} mx="auto" mb={3} />

            <Typography variant="h6" fontWeight={700} mb={3}>
              {isRegister ? 'Skapa konto' : 'Logga in'}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
              {isRegister && (
                <TextField label="Namn" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ditt namn" required autoComplete="name" />
              )}
              <TextField label="E-post" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <TextField label="Lösenord" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required inputProps={{ minLength: 6 }}
                autoComplete={isRegister ? 'new-password' : 'current-password'} />

              {error && <Alert severity="error">{error}</Alert>}

              <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}
                sx={{ mt: 0.5, borderRadius: 3, py: 1.5 }}>
                {loading ? '...' : isRegister ? 'Skapa konto' : 'Logga in'}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button onClick={() => { setIsRegister(r => !r); setError('') }}
              color="inherit" fullWidth sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              {isRegister ? 'Har du redan ett konto? Logga in' : 'Inget konto? Registrera dig'}
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
