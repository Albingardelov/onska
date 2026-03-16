'use client'

import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import MobileStepper from '@mui/material/MobileStepper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import { Icon } from '@iconify/react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslations } from 'next-intl'

const ONBOARDING_KEY = 'couply_onboarding_seen'
const PREFILL_KEY = 'couply_pairing_code_prefill'
const TOTAL_STEPS = 3

interface Props {
  initialCode?: string
}

export function OnboardingPage({ initialCode }: Props) {
  const t = useTranslations('onboarding')
  const tp = useTranslations('pairing')
  const { profile, pairWithPartner, signOut } = useAuth()
  const [step, setStep] = useState(() => initialCode ? 2 : 0)
  const [animKey, setAnimKey] = useState(0)
  const [code, setCode] = useState(initialCode ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pairingUrl, setPairingUrl] = useState('')
  const [showManual, setShowManual] = useState(false)
  const hasAutoPaired = useRef(false)

  useEffect(() => {
    if (!initialCode && typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_KEY)) {
      setStep(2)
    }
  }, [initialCode])

  useEffect(() => {
    if (profile?.pairing_code) {
      setPairingUrl(`${window.location.origin}/pairing?code=${profile.pairing_code}`)
    }
  }, [profile?.pairing_code])

  useEffect(() => {
    if (!initialCode || step !== 2 || !profile || hasAutoPaired.current) return
    hasAutoPaired.current = true
    setLoading(true)
    pairWithPartner(initialCode).then(err => {
      if (err) {
        setError(err)
        hasAutoPaired.current = false
        setShowManual(true)
      } else {
        localStorage.removeItem(PREFILL_KEY)
      }
      setLoading(false)
    })
  }, [initialCode, step, profile, pairWithPartner])

  function handleNext() {
    if (step === 1) localStorage.setItem(ONBOARDING_KEY, '1')
    setStep(s => s + 1)
    setAnimKey(k => k + 1)
  }

  async function handlePair(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await pairWithPartner(code)
    if (err) {
      setError(err)
    } else {
      localStorage.removeItem(PREFILL_KEY)
    }
    setLoading(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(profile?.pairing_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const howItWorks = [
    { icon: 'mdi:lightbulb-outline', title: t('step2_item1_title'), desc: t('step2_item1_desc') },
    { icon: 'mdi:gift-outline', title: t('step2_item2_title'), desc: t('step2_item2_desc') },
    { icon: 'mdi:heart-outline', title: t('step2_item3_title'), desc: t('step2_item3_desc') },
  ]

  // Step 3: full-screen QR layout
  if (step === 2) {
    return (
      <Box component="main" minHeight="100dvh" display="flex" flexDirection="column" bgcolor="background.default">

        {/* Gradient hero with QR */}
        <Box sx={{
          background: 'linear-gradient(160deg, #CC2E6A 0%, #A82158 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 7,
          pb: 4,
          px: 3,
          gap: 1.5,
        }}>
          <Typography fontSize={44} lineHeight={1}>💞</Typography>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px" color="inherit">
            {tp('title')}
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8, maxWidth: 280 }}>
            {tp('subtitle', { name: profile?.name ?? '' })}
          </Typography>

          {pairingUrl ? (
            <Box
              sx={{ bgcolor: 'white', borderRadius: 3, p: 2, mt: 1.5 }}
              role="img"
              aria-label={tp('qr_aria')}
            >
              <QRCodeSVG value={pairingUrl} size={180} />
            </Box>
          ) : (
            <Box sx={{ width: 212, height: 212, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: 'rgba(255,255,255,0.6)' }} />
            </Box>
          )}
        </Box>

        {/* Bottom content */}
        <Box flex={1} display="flex" flexDirection="column" alignItems="center" px={3} pt={3} pb={4} gap={1.5}>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            {tp('qr_instruction')}
          </Typography>

          {/* Code + copy */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h4" fontWeight={900} fontFamily="monospace" letterSpacing={4} color="primary">
              {profile?.pairing_code}
            </Typography>
            <Tooltip title={copied ? tp('copied') : tp('copy')}>
              <IconButton
                onClick={copyCode}
                color="primary"
                size="small"
                aria-label={copied ? tp('copied_aria') : tp('copy_aria')}
              >
                {copied ? <Icon icon="mdi:check" /> : <Icon icon="mdi:content-copy" />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Auto-connecting state */}
          {loading && !showManual && (
            <Box display="flex" alignItems="center" gap={1.5} mt={0.5}>
              <CircularProgress size={18} color="primary" />
              <Typography variant="body2" color="text.secondary">{tp('connecting')}</Typography>
            </Box>
          )}

          {error && !showManual && (
            <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
          )}

          {/* Manual entry toggle */}
          <Button
            size="small"
            onClick={() => setShowManual(m => !m)}
            color="inherit"
            sx={{ color: 'text.disabled', fontSize: '0.75rem', mt: 0.5 }}
          >
            {showManual ? tp('manual_hide') : tp('manual_entry')}
          </Button>

          {showManual && (
            <Box component="form" onSubmit={handlePair} width="100%" display="flex" flexDirection="column" gap={2}>
              <TextField
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder={tp('placeholder')}
                inputProps={{
                  maxLength: 6,
                  style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' },
                }}
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" size="large" disabled={loading || code.length < 6}>
                {loading ? tp('connecting') : tp('connect_button')}
              </Button>
            </Box>
          )}

          <Box flex={1} />

          <Button onClick={signOut} color="inherit" fullWidth sx={{ color: 'text.secondary' }}>
            {tp('sign_out')}
          </Button>
        </Box>

        <MobileStepper
          variant="dots"
          steps={TOTAL_STEPS}
          position="static"
          activeStep={step}
          sx={{ justifyContent: 'center', bgcolor: 'transparent', pb: 2 }}
          nextButton={null}
          backButton={null}
        />
      </Box>
    )
  }

  // Steps 0 & 1: centered card layout
  return (
    <Box
      component="main"
      minHeight="100dvh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={3}
      bgcolor="background.default"
    >
      <Box width="100%" maxWidth={400} display="flex" flexDirection="column" gap={3}>

        {step === 0 && (
          <Box key={animKey} textAlign="center" sx={{
            '@keyframes stepIn': { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
            animation: 'stepIn 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Typography fontSize={64} lineHeight={1} mb={2}>💞</Typography>
            <Typography variant="h5" fontWeight={800} color="primary" letterSpacing="-0.5px" mb={1.5}>
              {t('step1_title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" lineHeight={1.7} mb={4} sx={{ maxWidth: 320, mx: 'auto' }}>
              {t('step1_body')}
            </Typography>
            <Button variant="contained" size="large" fullWidth onClick={handleNext}
              sx={{ borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}>
              {t('next')}
            </Button>
          </Box>
        )}

        {step === 1 && (
          <Box key={animKey} sx={{
            '@keyframes stepIn': { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
            animation: 'stepIn 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px" mb={3} textAlign="center">
              {t('step2_title')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2.5} mb={4}>
              {howItWorks.map(({ icon, title, desc }) => (
                <Box key={title} display="flex" alignItems="flex-start" gap={2}>
                  <Box sx={{ fontSize: 28, color: 'primary.main', flexShrink: 0, display: 'flex', mt: 0.2 }}>
                    <Icon icon={icon} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Button variant="contained" size="large" fullWidth onClick={handleNext}
              sx={{ borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}>
              {t('get_started')}
            </Button>
          </Box>
        )}

        <MobileStepper
          variant="dots"
          steps={TOTAL_STEPS}
          position="static"
          activeStep={step}
          sx={{ justifyContent: 'center', bgcolor: 'transparent', p: 0 }}
          nextButton={null}
          backButton={null}
        />
      </Box>
    </Box>
  )
}
