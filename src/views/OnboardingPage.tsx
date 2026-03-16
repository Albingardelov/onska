'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import MobileStepper from '@mui/material/MobileStepper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { Icon } from '@iconify/react'
import { QRCodeSVG } from 'qrcode.react'
import jsQR from 'jsqr'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
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
  const { user, profile, pairWithPartner, refreshProfile, signOut } = useAuth()
  const [step, setStep] = useState(() => initialCode ? 2 : 0)
  const [animKey, setAnimKey] = useState(0)
  const [code, setCode] = useState(initialCode ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pairingUrl, setPairingUrl] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [scanning, setScanning] = useState(false)
  const hasAutoPaired = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanLoopRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Skip onboarding for returning users
  useEffect(() => {
    if (!initialCode && typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_KEY)) {
      setStep(2)
    }
  }, [initialCode])

  // Build pairing URL
  useEffect(() => {
    if (profile?.pairing_code) {
      setPairingUrl(`${window.location.origin}/pairing?code=${profile.pairing_code}`)
    }
  }, [profile?.pairing_code])

  // Auto-pair when arriving via QR link
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

  // Realtime: refresh when partner pairs with us (so phone A updates without F5)
  useEffect(() => {
    if (!user || step !== 2) return
    const channel = supabase
      .channel(`profile-paired-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new && (payload.new as { partner_id: string | null }).partner_id) {
          refreshProfile()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, step, refreshProfile])

  // QR scanner — start camera
  const startScanner = useCallback(async () => {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setScanning(false)
      setError('Kunde inte öppna kameran')
    }
  }, [])

  // QR scanner — scan loop
  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(scanFrame)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const result = jsQR(imageData.data, imageData.width, imageData.height)
    if (result?.data) {
      stopScanner()
      // Extract code from URL or use raw value
      try {
        const url = new URL(result.data)
        const scannedCode = url.searchParams.get('code')?.toUpperCase()
        if (scannedCode) doPair(scannedCode)
        else doPair(result.data.toUpperCase())
      } catch {
        doPair(result.data.toUpperCase())
      }
    } else {
      scanLoopRef.current = requestAnimationFrame(scanFrame)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function stopScanner() {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  async function doPair(scannedCode: string) {
    setError('')
    setLoading(true)
    const err = await pairWithPartner(scannedCode)
    if (err) {
      setError(err)
      setShowManual(true)
    } else {
      localStorage.removeItem(PREFILL_KEY)
    }
    setLoading(false)
  }

  function handleNext() {
    if (step === 1) localStorage.setItem(ONBOARDING_KEY, '1')
    setStep(s => s + 1)
    setAnimKey(k => k + 1)
  }

  async function handlePair(e: React.FormEvent) {
    e.preventDefault()
    await doPair(code)
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
            <Button variant="contained" size="large" fullWidth onClick={handleNext}
              sx={{ borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: '1rem' }}>
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

        {/* Step 3: Pairing */}
        {step === 2 && (
          <Box key={animKey} display="flex" flexDirection="column" gap={2} sx={{
            '@keyframes stepIn': { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
            animation: 'stepIn 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}>

            {/* Gradient card */}
            <Box sx={{
              borderRadius: 4,
              background: 'linear-gradient(145deg, #CC2E6A 0%, #A82158 55%, #8B1A49 100%)',
              overflow: 'hidden',
              position: 'relative',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -48, right: -48,
                width: 160, height: 160,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -32, left: -32,
                width: 120, height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                pointerEvents: 'none',
              },
            }}>
              <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', fontSize: '0.65rem' }}>
                  {tp('my_code_label')}
                </Typography>
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px" sx={{ color: '#fff', mt: 0.25 }}>
                  {tp('title')}
                </Typography>
              </Box>

              {pairingUrl ? (
                <Box sx={{ zIndex: 1, bgcolor: '#fff', borderRadius: 3, p: 1.75, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
                  role="img" aria-label={tp('qr_aria')}>
                  <QRCodeSVG value={pairingUrl} size={164} />
                </Box>
              ) : (
                <Box sx={{ width: 196, height: 196, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress sx={{ color: 'rgba(255,255,255,0.6)' }} />
                </Box>
              )}

              <Typography variant="body2" textAlign="center" sx={{ color: 'rgba(255,255,255,0.82)', zIndex: 1, maxWidth: 240, lineHeight: 1.5 }}>
                {tp('qr_instruction')}
              </Typography>

              <Box display="flex" alignItems="center" gap={0.5} sx={{
                bgcolor: 'rgba(255,255,255,0.13)', borderRadius: 2, px: 2, py: 0.75, zIndex: 1,
              }}>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', letterSpacing: 6, color: '#fff' }}>
                  {profile?.pairing_code}
                </Typography>
                <Tooltip title={copied ? tp('copied') : tp('copy')}>
                  <IconButton onClick={copyCode} size="small"
                    aria-label={copied ? tp('copied_aria') : tp('copy_aria')}
                    sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff' } }}>
                    {copied ? <Icon icon="mdi:check" /> : <Icon icon="mdi:content-copy" />}
                  </IconButton>
                </Tooltip>
              </Box>

              {loading && !showManual && (
                <Box display="flex" alignItems="center" gap={1} sx={{ zIndex: 1 }}>
                  <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {tp('connecting')}
                  </Typography>
                </Box>
              )}
            </Box>

            {error && !showManual && <Alert severity="error">{error}</Alert>}

            {/* Scan button */}
            <Button
              variant="outlined"
              startIcon={<Icon icon="mdi:qrcode-scan" />}
              onClick={startScanner}
              disabled={loading}
            >
              {tp('scan_button')}
            </Button>

            {/* Manual entry toggle */}
            <Box textAlign="center">
              <Button size="small" onClick={() => setShowManual(m => !m)}
                sx={{ color: 'text.disabled', fontSize: '0.75rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {showManual ? tp('manual_hide') : tp('manual_entry')}
              </Button>
            </Box>

            {showManual && (
              <Box component="form" onSubmit={handlePair} display="flex" flexDirection="column" gap={2}>
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

            <Button onClick={signOut} color="inherit" sx={{ color: 'text.secondary' }}>
              {tp('sign_out')}
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

      {/* Camera scanner dialog */}
      <Dialog
        open={scanning}
        onClose={stopScanner}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', m: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography fontWeight={700}>{tp('scan_title')}</Typography>
          <IconButton onClick={stopScanner} size="small" aria-label={tp('scan_close')}>
            <Icon icon="mdi:close" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1', bgcolor: '#000' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              playsInline
              muted
              onCanPlay={() => {
                scanLoopRef.current = requestAnimationFrame(scanFrame)
              }}
            />
            {/* Viewfinder overlay */}
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <Box sx={{
                width: 200, height: 200,
                border: '2px solid rgba(255,255,255,0.8)',
                borderRadius: 3,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }} />
            </Box>
          </Box>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
