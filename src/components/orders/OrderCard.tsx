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

export function OrderCard({
  order,
  isIncoming,
  onAccept,
  onUpdateStatus,
  animIndex,
}: OrderCardProps): ReactElement {
  const t = useTranslations('orders')
  const tc = useTranslations('common')

  const [isAccepting, setIsAccepting] = useState(false)
  const [responseNote, setResponseNote] = useState('')

  const bgColor = order.status === 'accepted'
    ? 'rgba(76,175,80,0.07)'
    : order.status === 'pending'
      ? order.mode === 'snusk' ? 'rgba(139,10,36,0.09)' : 'rgba(204,46,106,0.07)'
      : undefined

  const statusLabel: Record<Order['status'], string> = {
    pending: t('status_pending'),
    accepted: t('status_accepted'),
    declined: t('status_declined'),
    completed: t('status_completed'),
  }
  const statusColor: Record<Order['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
    pending: 'warning', accepted: 'success', declined: 'secondary', completed: 'secondary',
  }

  let expiryCountdown: React.ReactNode = null
  if (order.expires_at && order.status === 'pending') {
    const urgency = getExpiryUrgency(order.expires_at)
    if (urgency) {
      const diff = new Date(order.expires_at).getTime() - Date.now()
      const hoursLeft = Math.floor(diff / (60 * 60 * 1000))
      const minutesLeft = Math.floor((diff % (60 * 60 * 1000)) / 60000)
      const label = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}min kvar` : `${minutesLeft} min kvar`
      expiryCountdown = (
        <Typography
          variant="caption"
          color={urgency === 'imminent' ? 'error' : 'warning.main'}
          fontWeight={700}
          sx={{ display: 'block', mt: 0.5 }}
        >
          {label}
        </Typography>
      )
    }
  }

  return (
    <Box sx={{
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
      bgcolor: bgColor ?? 'background.paper',
      '@keyframes cardIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      ...(animIndex !== undefined && {
        animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${animIndex * 55}ms both`,
      }),
    }}>
      <Box sx={{ p: 2, px: 2.5 }}>

        {/* Top row: mode icon + date */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
          <Box component="span" sx={{ fontSize: 13, color: 'text.disabled', display: 'inline-flex' }}>
            <Icon icon={order.mode === 'fint' ? 'mdi:weather-sunny' : 'mdi:weather-night'} />
          </Box>
          <Typography variant="caption" color="text.disabled">
            {format(new Date(order.created_at), 'd MMM HH:mm', { locale: sv })}
          </Typography>
        </Box>

        {/* Title — leading element */}
        <Typography fontWeight={800} fontSize="1.05rem" letterSpacing="-0.01em" mb={0.8}>
          {order.service?.title ?? t('unknown_wish')}
        </Typography>

        {/* Status + optional date suggestion */}
        <Box display="flex" gap={0.8} flexWrap="wrap" alignItems="center" mb={order.note || expiryCountdown || order.response_note ? 0.8 : 0}>
          <Chip
            size="small"
            label={
              order.status === 'declined' && order.expires_at && new Date(order.expires_at) < new Date()
                ? t('status_missed')
                : statusLabel[order.status]
            }
            color={statusColor[order.status]}
          />
          {order.date && (
            <Typography variant="caption" color="text.secondary">
              {format(new Date(order.date), 'd MMMM', { locale: sv })}
            </Typography>
          )}
          {order.expires_at && order.status === 'pending' && new Date(order.expires_at).getMinutes() === 0 && (
            <Chip
              size="small"
              icon={<Icon icon="mdi:clock-alert-outline" width={14} />}
              label={`${t('expires_at_label')} ${format(new Date(order.expires_at), 'HH:mm')}`}
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {order.note && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic" mb={0.5}>
            &ldquo;{order.note}&rdquo;
          </Typography>
        )}
        {expiryCountdown}
        {order.response_note && (
          <Chip size="small" label={`⏰ ${order.response_note}`} color="success" variant="outlined" sx={{ mt: 0.5 }} />
        )}

        {/* Actions */}
        {isIncoming && order.status === 'pending' && (
          <Box mt={2}>
            {isAccepting ? (
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
                    onClick={() => { onAccept(order.id, responseNote); setIsAccepting(false); setResponseNote('') }}>{t('confirm')}</Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" gap={1}>
                <Button variant="outlined" color="error" size="small" fullWidth
                  onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('decline')}</Button>
                <Button variant="contained" color="success" size="small" fullWidth
                  startIcon={<Icon icon="mdi:heart-outline" />} onClick={() => setIsAccepting(true)}>{t('accept')}</Button>
              </Box>
            )}
          </Box>
        )}

        {isIncoming && order.status === 'accepted' && (
          <Box mt={1.5} display="flex" gap={1}>
            <Button variant="outlined" color="error" size="small"
              onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_receiver')}</Button>
            <Button variant="outlined" color="secondary" size="small" fullWidth
              startIcon={<Icon icon="mdi:archive-outline" />}
              onClick={() => onUpdateStatus(order.id, 'completed')}>{t('archive')}</Button>
          </Box>
        )}

        {!isIncoming && order.status === 'accepted' && (
          <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 1.5 }}
            onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_sender')}</Button>
        )}
        {!isIncoming && order.status === 'pending' && (
          <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 1.5 }}
            onClick={() => { vibrate(); onUpdateStatus(order.id, 'declined') }}>{t('withdraw')}</Button>
        )}
      </Box>
    </Box>
  )
}
