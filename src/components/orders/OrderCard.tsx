'use client'

import { ReactElement, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { Order } from '../../types'

function getExpiryUrgency(expiresAt: string): 'imminent' | 'soon' | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  if (diff < 2 * 60 * 60 * 1000) return 'imminent'
  if (diff < 6 * 60 * 60 * 1000) return 'soon'
  return null
}

function vibrate() { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]) }

interface OrderCardProps {
  order: Order
  isIncoming: boolean
  onAccept: (id: string, note: string) => void
  onUpdateStatus: (id: string, status: Order['status']) => void
  animIndex?: number
}

export function OrderCard({ order, isIncoming, onAccept, onUpdateStatus, animIndex }: OrderCardProps): ReactElement {
  const t = useTranslations('orders')
  const tc = useTranslations('common')
  const [isAccepting, setIsAccepting] = useState(false)
  const [responseNote, setResponseNote] = useState('')

  const isSnusk = order.mode === 'snusk'
  const isActive = order.status === 'pending' || order.status === 'accepted'
  const isMissed = order.status === 'declined' && order.expires_at && new Date(order.expires_at) < new Date()

  // Card surface colors — work on both light (#FDF6F8) and dark (#080204) backgrounds
  const bg = order.status === 'accepted'
    ? isSnusk ? 'rgba(76,175,125,0.10)' : 'rgba(46,155,95,0.06)'
    : order.status === 'pending'
      ? isSnusk ? 'rgba(196,18,48,0.13)' : 'rgba(204,46,106,0.06)'
      : undefined

  const borderColorValue = order.status === 'accepted'
    ? isSnusk ? 'rgba(76,175,125,0.22)' : 'rgba(46,155,95,0.20)'
    : order.status === 'pending'
      ? isSnusk ? 'rgba(196,18,48,0.28)' : 'rgba(204,46,106,0.18)'
      : undefined

  // Status indicator dot
  const dotColor = order.status === 'pending' ? 'warning.main'
    : order.status === 'accepted' ? 'success.main'
    : 'text.disabled'

  const statusText = isMissed ? t('status_missed')
    : order.status === 'pending' ? t('status_pending')
    : order.status === 'accepted' ? t('status_accepted')
    : order.status === 'completed' ? t('status_completed')
    : t('status_declined')

  let expiryCountdown: React.ReactNode = null
  if (order.expires_at && order.status === 'pending') {
    const urgency = getExpiryUrgency(order.expires_at)
    if (urgency) {
      const diff = new Date(order.expires_at).getTime() - Date.now()
      const hoursLeft = Math.floor(diff / (60 * 60 * 1000))
      const minutesLeft = Math.floor((diff % (60 * 60 * 1000)) / 60000)
      const label = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}min kvar` : `${minutesLeft} min kvar`
      expiryCountdown = (
        <Typography variant="caption" color={urgency === 'imminent' ? 'error' : 'warning.main'}
          fontWeight={700} sx={{ display: 'block', mt: 0.5 }}>
          {label}
        </Typography>
      )
    }
  }

  return (
    <Box sx={{
      borderRadius: 3,
      overflow: 'hidden',
      bgcolor: bg ?? 'background.paper',
      border: '1px solid',
      borderColor: borderColorValue ?? 'divider',
      transition: 'border-color 0.2s',
      '@keyframes cardIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      ...(animIndex !== undefined && {
        animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${animIndex * 55}ms both`,
      }),
    }}>
      <Box sx={{ p: 2, px: 2.5 }}>

        {/* Meta row */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={0.7}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {statusText}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
            {format(new Date(order.created_at), 'd MMM HH:mm', { locale: sv })}
          </Typography>
        </Box>

        {/* Title — uses Fraunces for emotional weight */}
        <Typography sx={{
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          mb: 0.5,
        }}>
          {order.service?.title ?? t('unknown_wish')}
        </Typography>

        {/* Date suggestion */}
        {order.date && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {format(new Date(order.date), 'd MMMM', { locale: sv })}
          </Typography>
        )}

        {/* Time chip — only when a specific hour was chosen */}
        {order.expires_at && order.status === 'pending' && new Date(order.expires_at).getMinutes() === 0 && (
          <Chip
            size="small"
            icon={<Icon icon="mdi:clock-outline" width={13} />}
            label={`${t('expires_at_label')} ${format(new Date(order.expires_at), 'HH:mm')}`}
            color="warning"
            variant="outlined"
            sx={{ mb: 0.5 }}
          />
        )}

        {/* Note */}
        {order.note && (
          <Typography variant="body2" color="text.secondary"
            fontStyle="italic" sx={{ mt: 0.5, lineHeight: 1.5, opacity: 0.85 }}>
            &ldquo;{order.note}&rdquo;
          </Typography>
        )}

        {expiryCountdown}

        {order.response_note && (
          <Box display="flex" alignItems="center" gap={0.8} mt={1}
            sx={{ bgcolor: 'rgba(76,175,125,0.08)', borderRadius: 2, px: 1.5, py: 0.6, width: 'fit-content' }}>
            <Box component="span" sx={{ fontSize: 13, display: 'flex', color: 'success.main' }}>
              <Icon icon="mdi:clock-outline" />
            </Box>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              {order.response_note}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        {isActive && (
          <Box mt={2}>
            {isIncoming && order.status === 'pending' && (
              isAccepting ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <TextField label={t('when_label')} size="small" autoFocus
                    placeholder={t('when_placeholder')}
                    value={responseNote} onChange={e => setResponseNote(e.target.value)} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {t('consent_accept_hint')}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button variant="outlined" color="inherit" size="small" fullWidth
                      onClick={() => { setIsAccepting(false); setResponseNote('') }}>{tc('cancel')}</Button>
                    <Button variant="contained" color="success" size="small" fullWidth
                      startIcon={<Icon icon="mdi:check" />}
                      onClick={() => { onAccept(order.id, responseNote); setIsAccepting(false); setResponseNote('') }}>
                      {t('confirm')}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" gap={1}>
                  <Button variant="outlined" color="error" size="small" fullWidth
                    onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('decline')}</Button>
                  <Button variant="contained" color="success" size="small" fullWidth
                    startIcon={<Icon icon="mdi:heart-outline" />}
                    onClick={() => setIsAccepting(true)}>{t('accept')}</Button>
                </Box>
              )
            )}

            {isIncoming && order.status === 'accepted' && (
              <Box display="flex" gap={1}>
                <Button variant="outlined" color="error" size="small"
                  onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_receiver')}</Button>
                <Button variant="outlined" color="secondary" size="small" fullWidth
                  startIcon={<Icon icon="mdi:archive-outline" />}
                  onClick={() => onUpdateStatus(order.id, 'completed')}>{t('archive')}</Button>
              </Box>
            )}

            {!isIncoming && order.status === 'accepted' && (
              <Button variant="outlined" color="error" size="small" fullWidth
                onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_sender')}</Button>
            )}

            {!isIncoming && order.status === 'pending' && (
              <Button variant="outlined" color="error" size="small" fullWidth
                onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('withdraw')}</Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
