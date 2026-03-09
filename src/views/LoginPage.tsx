import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useAuth } from '../contexts/AuthContext'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'

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
    <Box minHeight="100dvh" display="flex" flexDirection="column" alignItems="center"
      justifyContent="center" p={3} bgcolor="background.default">
      <Box width="100%" maxWidth={380}>
        <Box textAlign="center" mb={5}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 52, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={800} color="primary" mt={1.5} letterSpacing="-0.03em">Önska</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.8} letterSpacing="0.01em">
            Boka och beställ av varandra
          </Typography>
        </Box>

        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight={700} mb={3} letterSpacing="-0.02em">
            {isRegister ? 'Skapa konto' : 'Logga in'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            {isRegister && (
              <TextField label="Namn" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ditt namn" required autoComplete="name" />
            )}
            <TextField label="E-post" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <TextField label="Lösenord" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required inputProps={{ minLength: 6 }}
              autoComplete={isRegister ? 'new-password' : 'current-password'} />

            {error && <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert>}

            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}
              sx={{ mt: 0.5, py: 1.5, fontWeight: 700, fontSize: '1rem' }}>
              {loading ? '...' : isRegister ? 'Skapa konto' : 'Logga in'}
            </Button>
          </Box>

          <Button onClick={() => { setIsRegister(r => !r); setError('') }}
            color="inherit" fullWidth sx={{ mt: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
            {isRegister ? 'Redan konto? Logga in' : 'Inget konto? Registrera dig'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
