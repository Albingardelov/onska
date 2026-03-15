'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import MobileStepper from '@mui/material/MobileStepper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { Icon } from '@iconify/react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslations } from 'next-intl'

const ONBOARDING_KEY = 'couply_onboarding_seen'
const TOTAL_STEPS = 3

export function OnboardingPage() {
  const t = useTranslations('onboarding')
  const tp = useTranslations('pairing')
  const { profile, pairWithPartner, signOut } = useAuth()
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_KEY)) {
      setStep(2)
    }
  }, [])

  function handleNext() {
    if (step === 1) {
      localStorage.setItem(ONBOARDING_KEY, '1')
    }
    setStep(s => s + 1)
    setAnimKey(k => k + 1)
  }

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

  const howItWorks = [
    { icon: 'mdi:lightbulb-outline', title: t('step2_item1_title'), desc: t('step2_item1_desc') },
    { icon: 'mdi:gift-outline', title: t('step2_item2_title'), desc: t('step2_item2_desc') },
    { icon: 'mdi:heart-outline', title: t('step2_item3_title'), desc: t('step2_item3_desc') },
  ]

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

        {/* Step 1: Welcome */}
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
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleNext}
              sx={{ borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}
            >
              {t('next')}
            </Button>
          </Box>
        )}

        {/* Step 2: How it works */}
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
                  <Box
                    sx={{
                      fontSize: 28,
                      color: 'primary.main',
                      flexShrink: 0,
                      display: 'flex',
                      mt: 0.2,
                    }}
                  >
                    <Icon icon={icon} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleNext}
              sx={{ borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}
            >
              {t('get_started')}
            </Button>
          </Box>
        )}

        {/* Step 3: Pairing */}
        {step === 2 && (
          <Box key={animKey} sx={{
            '@keyframes stepIn': { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
            animation: 'stepIn 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h5" fontWeight={800} color="primary">{tp('title')}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {tp('subtitle', { name: profile?.name ?? '' })}
              </Typography>
            </Box>

            {/* My code */}
            <Paper elevation={0} sx={{ p: 3, mb: 2, border: 1, borderColor: 'divider', borderRadius: 4 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>
                {tp('my_code_label')}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="monospace"
                  letterSpacing={4}
                  color="primary"
                  flex={1}
                >
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
            </Paper>

            {/* Enter partner code */}
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 4 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>
                {tp('partner_code_label')}
              </Typography>
              <Box component="form" onSubmit={handlePair} display="flex" flexDirection="column" gap={2}>
                <TextField
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder={tp('placeholder')}
                  inputProps={{
                    maxLength: 6,
                    style: {
                      textAlign: 'center',
                      letterSpacing: 8,
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    },
                  }}
                  required
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || code.length < 6}
                >
                  {loading ? '...' : tp('connect_button')}
                </Button>
              </Box>
            </Paper>

            <Button
              onClick={signOut}
              color="inherit"
              fullWidth
              sx={{ mt: 2, color: 'text.secondary' }}
            >
              {tp('sign_out')}
            </Button>
          </Box>
        )}

        {/* Dot stepper */}
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
