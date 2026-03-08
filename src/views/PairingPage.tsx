import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { useAuth } from '../contexts/AuthContext'

export function PairingPage() {
  const { profile, pairWithPartner, signOut } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handlePair(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await pairWithPartner(code)
    if (err) setError(err)
    setLoading(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(profile?.pairing_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box minHeight="100dvh" display="flex" flexDirection="column" alignItems="center"
      justifyContent="center" p={3} bgcolor="background.default">
      <Box width="100%" maxWidth={400}>
        <Box textAlign="center" mb={4}>
          <Typography fontSize={56} lineHeight={1}>💞</Typography>
          <Typography variant="h5" fontWeight={800} color="primary" mt={1}>Koppla ihop</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Hej {profile?.name}! Koppla ihop med din partner.</Typography>
        </Box>

        {/* My code */}
        <Paper elevation={0} sx={{ p: 3, mb: 2, border: 1, borderColor: 'divider', borderRadius: 4 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>
            Din kod – skicka till din partner
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h4" fontWeight={900} fontFamily="monospace" letterSpacing={4} color="primary" flex={1}>
              {profile?.pairing_code}
            </Typography>
            <Tooltip title={copied ? 'Kopierat!' : 'Kopiera'}>
              <IconButton onClick={copyCode} color="primary" size="small">
                {copied ? <CheckIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Enter partner code */}
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 4 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>
            Ange din partners kod
          </Typography>
          <Box component="form" onSubmit={handlePair} display="flex" flexDirection="column" gap={2}>
            <TextField
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="T.ex. AB1C2D"
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' } }}
              required
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large"
              disabled={loading || code.length < 6}>
              {loading ? '...' : 'Koppla ihop'}
            </Button>
          </Box>
        </Paper>

        <Button onClick={signOut} color="inherit" fullWidth sx={{ mt: 2, color: 'text.secondary' }}>
          Logga ut
        </Button>
      </Box>
    </Box>
  )
}
