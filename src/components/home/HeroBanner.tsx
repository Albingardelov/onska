import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { isValidStatusKey } from '../../lib/statuses'
import type { StatusKey } from '../../lib/statuses'
import type { Profile, Mode } from '../../types'
import type { Locale } from 'date-fns'

interface HeroBannerProps {
  mode: Mode
  partner: Profile
  loading: boolean
  blockedTodayCount: number
  openTodayCount: number
  dateFnsLocale: Locale
}

export function HeroBanner({ mode, partner, loading, blockedTodayCount, openTodayCount, dateFnsLocale }: HeroBannerProps) {
  const t = useTranslations('home')
  const ts = useTranslations('statuses')

  return (
    <Box sx={{
      px: 2.5, pt: 2.5, pb: 2,
      minHeight: 171,
      background: mode === 'snusk'
        ? 'linear-gradient(145deg, #8B0A24 0%, #5C0618 55%, #3A020E 100%)'
        : 'linear-gradient(145deg, #CC2E6A 0%, #A82158 55%, #8B1A49 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute',
        top: -48, right: -48, width: 160, height: 160,
        borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
      },
      '&::after': {
        content: '""', position: 'absolute',
        bottom: -32, left: -32, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      },
    }}>
      <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'capitalize', letterSpacing: '0.03em' }}>
        {format(new Date(), 'EEEE d MMMM', { locale: dateFnsLocale })}
      </Typography>
      <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em" mt={0.3} mb={1.5}>
        {mode === 'snusk' ? t('greeting_snusk', { name: partner.name }) : t('greeting', { name: partner.name })}
      </Typography>

      {!loading && (
        mode === 'snusk' ? (
          <Box display="flex" alignItems="center" gap={0.8}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
            <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.9 }}>
              <Icon icon={openTodayCount === 0 ? 'mdi:lock-outline' : 'mdi:check-circle-outline'} />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
              {openTodayCount === 0
                ? t('snusk_open_none', { name: partner.name })
                : t('snusk_open_many', { name: partner.name, count: openTodayCount })}
            </Typography>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={0.8}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
            <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.9 }}>
              <Icon icon={blockedTodayCount === 0 ? 'mdi:check-circle-outline' : 'mdi:information-outline'} />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
              {blockedTodayCount === 0
                ? t('open_for_all', { name: partner.name })
                : blockedTodayCount === 1
                  ? t('blocked_one', { name: partner.name })
                  : t('blocked_many', { name: partner.name, count: blockedTodayCount })}
            </Typography>
          </Box>
        )
      )}

      {isValidStatusKey(partner.status) && (
        <Box display="flex" alignItems="center" gap={0.8} mt={0.8}
          sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 1.5, py: 0.8, width: 'fit-content' }}>
          <Box component="span" sx={{ fontSize: 14, display: 'flex', opacity: 0.8 }}>
            <Icon icon="mdi:heart-pulse" />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85 }}>
            {ts(partner.status as StatusKey)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
