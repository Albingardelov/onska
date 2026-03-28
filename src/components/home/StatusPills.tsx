'use client'
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { getStatusesForMode } from '../../lib/statuses'
import type { StatusKey } from '../../lib/statuses'
import type { Mode, Profile } from '../../types'

interface StatusPillsProps {
  mode: Mode
  profile: Profile
  onUpdate: (key: string | null) => void
}

export function StatusPills({ mode, profile, onUpdate }: StatusPillsProps) {
  const ts = useTranslations('statuses')

  return (
    <Box px={2.5} pt={1.5} pb={0.5} display="flex" gap={0.75} flexWrap="wrap">
      {getStatusesForMode(mode).map(key => {
        const isActive = profile.status === key
        return (
          <Box
            key={key}
            component="button"
            onClick={() => onUpdate(isActive ? null : key)}
            sx={{
              border: '1.5px solid',
              borderColor: isActive ? 'primary.main' : 'divider',
              borderRadius: 10,
              px: 1.5, py: 0.6,
              cursor: 'pointer',
              bgcolor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.secondary',
              fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', gap: 0.5,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                color: isActive ? 'primary.contrastText' : 'primary.main',
              },
            }}
          >
            {isActive && (
              <Box component="span" sx={{ fontSize: 11, display: 'flex', opacity: 0.9 }}>
                <Icon icon="mdi:check" />
              </Box>
            )}
            {ts(key)}
          </Box>
        )
      })}
    </Box>
  )
}
