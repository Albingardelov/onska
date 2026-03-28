'use client'

import { ReactElement } from 'react'
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
  if (diff < 2 * 60 * 60 * 1000) return 'imminent'  // < 2h
  if (diff < 6 * 60 * 60 * 1000) return 'soon'       // < 6h
  return null
}

interface OrderCardProps {
  order: Order
  isIncoming: boolean
  acceptingId: string | null
  responseNote: string
  onAccept: (id: string) => void
  onUpdateStatus: (id: string, status: Order['status']) => void
  onDelete: (id: string) => void
  onStartAccept: (id: string) => void
  onCancelAccept: () => void
  onResponseNoteChange: (note: string) => void
  animIndex?: number
}

export function OrderCard({
  order,
  isIncoming,
  acceptingId,
  responseNote,
  onAccept,
  onUpdateStatus,
  onDelete: _onDelete,
  onStartAccept,
  onCancelAccept,
  onResponseNoteChange,
  animIndex,
}: OrderCardProps): ReactElement {
  const t = useTranslations('orders')
  const tc = useTranslations('common')

  const statusLabel: Record<Order['status'], string> = {
    pending: t('status_pending'),
    accepted: t('status_accepted'),
    declined: t('status_declined'),
    completed: t('status_completed'),
  }
  const statusColor: Record<Order['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
    pending: 'warning', accepted: 'success', declined: 'secondary', completed: 'secondary',
  }

  const isAccepting = acceptingId === order.id
  const borderLeft = order.status === 'pending' ? 'warning.main'
    : order.status === 'accepted' ? 'success.main'
    : 'text.disabled'

  return (
    <Box sx={{
      borderRadius: 2, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
      bgcolor: 'background.paper',
      position: 'relative',
      ...(animIndex !== undefined && {
        animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${animIndex * 55}ms both`,
      }),
    }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: borderLeft }} />
      <Box sx={{ p: 2.5, pl: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" gap={0.8} flexWrap="wrap" alignItems="center">
            <Box component="span" sx={{ fontSize: 14, color: 'text.disabled', display: 'inline-flex' }}>
              <Icon icon={order.mode === 'fint' ? 'mdi:weather-sunny' : 'mdi:weather-night'} />
            </Box>
            <Chip
              size="small"
              label={
                order.status === 'declined' && order.expires_at && new Date(order.expires_at) < new Date()
                  ? t('status_missed')
                  : statusLabel[order.status]
              }
              color={statusColor[order.status]}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(order.created_at), 'd MMM HH:mm', { locale: sv })}
            </Typography>
          </Box>
        </Box>

        <Typography fontWeight={700} fontSize="1rem">{order.service?.title ?? t('unknown_wish')}</Typography>
        {order.date && (
          <Typography variant="body2" color="text.secondary">
            {format(new Date(order.date), 'd MMMM yyyy', { locale: sv })}
          </Typography>
        )}
        {order.note && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic" mt={0.5}>
            &ldquo;{order.note}&rdquo;
          </Typography>
        )}
        {order.expires_at && order.status === 'pending' && new Date(order.expires_at).getMinutes() === 0 && (
          <Chip
            size="small"
            icon={<Icon icon="mdi:clock-alert-outline" width={14} />}
            label={`${t('expires_at_label')} ${format(new Date(order.expires_at), 'HH:mm')}`}
            color="warning"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
        {order.expires_at && order.status === 'pending' && (() => {
          const urgency = getExpiryUrgency(order.expires_at!)
          if (!urgency) return null
          const diff = new Date(order.expires_at!).getTime() - Date.now()
          const hoursLeft = Math.floor(diff / (60 * 60 * 1000))
          const minutesLeft = Math.floor((diff % (60 * 60 * 1000)) / 60000)
          const label = hoursLeft > 0
            ? `${hoursLeft}h ${minutesLeft}min kvar`
            : `${minutesLeft} min kvar`
          return (
            <Typography
              variant="caption"
              color={urgency === 'imminent' ? 'error' : 'warning.main'}
              fontWeight={700}
              sx={{ display: 'block', mt: 0.5 }}
            >
              {label}
            </Typography>
          )
        })()}
        {order.response_note && (
          <Chip size="small" label={`⏰ ${order.response_note}`} color="success" variant="outlined" sx={{ mt: 1 }} />
        )}

        {isIncoming && order.status === 'pending' && (
          <Box mt={2}>
            {isAccepting ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                <TextField label={t('when_label')} size="small" autoFocus
                  placeholder={t('when_placeholder')}
                  value={responseNote} onChange={e => onResponseNoteChange(e.target.value)} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {t('consent_accept_hint')}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button variant="outlined" color="inherit" size="small" fullWidth
                    onClick={onCancelAccept}>{tc('cancel')}</Button>
                  <Button variant="contained" color="success" size="small" fullWidth
                    startIcon={<Icon icon="mdi:check" />} onClick={() => onAccept(order.id)}>{t('confirm')}</Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" gap={1} mt={1}>
                <Button variant="outlined" color="error" size="small" fullWidth
                  onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); onUpdateStatus(order.id, 'declined') }}>{t('decline')}</Button>
                <Button variant="contained" color="success" size="small" fullWidth
                  startIcon={<Icon icon="mdi:heart-outline" />} onClick={() => onStartAccept(order.id)}>{t('accept')}</Button>
              </Box>
            )}
          </Box>
        )}

        {isIncoming && order.status === 'accepted' && (
          <Box mt={1.5} display="flex" gap={1}>
            <Button variant="outlined" color="error" size="small"
              onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_receiver')}</Button>
            <Button variant="outlined" color="secondary" size="small" fullWidth
              startIcon={<Icon icon="mdi:archive-outline" />}
              onClick={() => onUpdateStatus(order.id, 'completed')}>{t('archive')}</Button>
          </Box>
        )}

        {!isIncoming && order.status === 'accepted' && (
          <Button variant="outlined" color="error" size="small" fullWidth
            sx={{ mt: 1.5 }}
            onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); onUpdateStatus(order.id, 'declined') }}>{t('change_mind_sender')}</Button>
        )}
        {!isIncoming && order.status === 'pending' && (
          <Button variant="outlined" color="error" size="small" fullWidth
            sx={{ mt: 1.5 }}
            onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 80, 8]); onUpdateStatus(order.id, 'declined') }}>{t('withdraw')}</Button>
        )}
      </Box>
    </Box>
  )
}
