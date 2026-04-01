'use client'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { SectionLabel } from './SectionLabel'
import type { Service, Profile, Mode } from '../../types'

interface ServiceGridProps {
  services: Service[]
  loading: boolean
  mode: Mode
  partner: Profile
  selectedService: Service | null
  selectedDate: string | null
  partnerMarkedIds: Set<string>
  todayMarkedIds: Set<string>
  onSelect: (service: Service | null) => void
}

export function ServiceGrid({
  services, loading, mode, partner, selectedService,
  selectedDate, partnerMarkedIds, todayMarkedIds, onSelect,
}: ServiceGridProps) {
  const t = useTranslations('home')

  return (
    <Box>
      <SectionLabel>
        {mode === 'snusk' ? t('ideas_label_snusk', { name: partner.name }) : t('ideas_label', { name: partner.name })}
      </SectionLabel>

      {loading ? (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : services.length === 0 ? (
        <Box sx={{ p: 4, borderRadius: 2, border: '1.5px dashed', borderColor: 'divider', textAlign: 'center' }}>
          <Box component="span" sx={{ fontSize: 38, display: 'flex', justifyContent: 'center', mb: 1.5, opacity: 0.2 }}>
            <Icon icon="mdi:heart-outline" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {mode === 'snusk' ? t('no_ideas_snusk', { name: partner.name }) : t('no_ideas', { name: partner.name })}
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {services.map((service, index) => {
            const selected = selectedService?.id === service.id
            const markedIds = selectedDate ? partnerMarkedIds : todayMarkedIds
            const isBlocked = mode === 'snusk'
              ? !markedIds.has(service.id)
              : markedIds.has(service.id)
            return (
              <Box key={service.id}
                onClick={() => { if (!isBlocked) onSelect(selected ? null : service) }}
                sx={{
                  p: 2.5, borderRadius: 3, cursor: isBlocked ? 'not-allowed' : 'pointer',
                  border: '2px solid',
                  borderColor: selected ? 'success.main' : 'divider',
                  ...(mode === 'snusk' && !selected
                    ? { background: 'linear-gradient(135deg, #150208 0%, #0E0106 100%)' }
                    : { bgcolor: 'background.paper' }
                  ),
                  boxShadow: selected
                    ? '0 0 0 3px rgba(46,155,95,0.12), 0 2px 8px rgba(0,0,0,0.06)'
                    : mode === 'snusk'
                      ? '0 2px 8px rgba(0,0,0,0.3)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                  opacity: isBlocked ? 0.45 : 1,
                  transition: 'all 0.18s ease',
                  '@keyframes cardIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                  animation: `cardIn 0.32s cubic-bezier(0.4,0,0.2,1) ${index * 55}ms both`,
                  '&:hover': !isBlocked ? {
                    borderColor: selected ? 'success.main' : 'primary.main',
                    boxShadow: mode === 'snusk'
                      ? '0 4px 16px rgba(196,18,48,0.2)'
                      : '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-1px)',
                  } : {},
                }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  <Box flex={1}>
                    <Typography fontWeight={700} fontSize="1rem" letterSpacing="-0.01em">
                      {service.title}
                    </Typography>
                    {service.description && (
                      <Typography variant="body2" color="text.secondary" mt={0.3}>
                        {service.description}
                      </Typography>
                    )}
                    {isBlocked && (
                      <Typography variant="caption" color="text.disabled" mt={0.5}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon icon="mdi:clock-outline" width={12} />
                        {selectedDate ? t('blocked_date') : t('blocked_today')}
                      </Typography>
                    )}
                  </Box>
                  <Box component="span" sx={{
                    fontSize: 22, flexShrink: 0, display: 'flex',
                    color: selected ? 'success.main' : 'divider',
                    transition: 'color 0.15s',
                  }}>
                    <Icon icon={selected ? 'mdi:check-circle' : 'mdi:circle-outline'} />
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
