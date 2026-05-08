'use client'
import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { getCustomStatusText, getStatusesForMode, isCustomStatus, serializeCustomStatus } from '../../lib/statuses'
import type { StatusKey } from '../../lib/statuses'
import type { Mode, Profile } from '../../types'

interface StatusPillsProps {
  mode: Mode
  profile: Profile
  onUpdate: (key: string | null) => void
}

export function StatusPills({ mode, profile, onUpdate }: StatusPillsProps) {
  const ts = useTranslations('statuses')
  const customText = useMemo(() => getCustomStatusText(profile.status), [profile.status])
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState(customText ?? '')
  const [customError, setCustomError] = useState<string | null>(null)

  const maxLen = 80

  function openCustomEditor(prefill?: string) {
    setCustomError(null)
    setCustomValue(prefill ?? customText ?? '')
    setCustomOpen(true)
  }

  function closeCustomEditor() {
    setCustomError(null)
    setCustomOpen(false)
  }

  function validate(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return { ok: false as const, error: ts('custom_error_empty') }
    if (trimmed.length > maxLen) return { ok: false as const, error: ts('custom_error_too_long', { max: maxLen }) }
    return { ok: true as const, value: trimmed }
  }

  function saveCustom() {
    const res = validate(customValue)
    if (!res.ok) {
      setCustomError(res.error)
      return
    }
    onUpdate(serializeCustomStatus(res.value))
    setCustomOpen(false)
  }

  return (
    <Box px={2.5} pt={1.5} pb={0.5}>
      <Box display="flex" gap={0.75} flexWrap="wrap">
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
              {ts(key as StatusKey)}
            </Box>
          )
        })}

        {customText && (
          <Box
            component="button"
            onClick={() => openCustomEditor(customText)}
            sx={{
              border: '1.5px solid',
              borderColor: isCustomStatus(profile.status) ? 'primary.main' : 'divider',
              borderRadius: 10,
              px: 1.5, py: 0.6,
              cursor: 'pointer',
              bgcolor: isCustomStatus(profile.status) ? 'primary.main' : 'transparent',
              color: isCustomStatus(profile.status) ? 'primary.contrastText' : 'text.secondary',
              fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', gap: 0.5,
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                color: isCustomStatus(profile.status) ? 'primary.contrastText' : 'primary.main',
              },
            }}
            title={customText}
          >
            <Box component="span" sx={{ fontSize: 11, display: 'flex', opacity: 0.9 }}>
              <Icon icon="mdi:pencil" />
            </Box>
            {customText}
          </Box>
        )}

        <Box
          component="button"
          onClick={() => (customOpen ? closeCustomEditor() : openCustomEditor())}
          sx={{
            border: '1.5px dashed',
            borderColor: customOpen ? 'primary.main' : 'divider',
            borderRadius: 10,
            px: 1.5, py: 0.6,
            cursor: 'pointer',
            bgcolor: 'transparent',
            color: customOpen ? 'primary.main' : 'text.secondary',
            fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
            letterSpacing: '0.01em',
            display: 'flex', alignItems: 'center', gap: 0.5,
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          <Box component="span" sx={{ fontSize: 12, display: 'flex', opacity: 0.9 }}>
            <Icon icon="mdi:plus" />
          </Box>
          {ts('custom_open')}
        </Box>
      </Box>

      {customOpen && (
        <Box mt={1.25} display="flex" gap={1} flexWrap="wrap" alignItems="flex-start">
          <TextField
            value={customValue}
            onChange={e => { setCustomValue(e.target.value); setCustomError(null) }}
            size="small"
            placeholder={ts('custom_placeholder')}
            error={!!customError}
            helperText={customError ?? ' '}
            inputProps={{ maxLength: maxLen }}
            sx={{
              flex: '1 1 220px',
              minWidth: 220,
              '& .MuiInputBase-root': { borderRadius: 2.5 },
            }}
          />
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="contained" size="small" onClick={saveCustom}>
              {ts('custom_save')}
            </Button>
            <Button variant="outlined" size="small" onClick={closeCustomEditor}>
              {ts('custom_cancel')}
            </Button>
            <Button
              variant="text"
              size="small"
              color="inherit"
              onClick={() => { onUpdate(null); closeCustomEditor() }}
              sx={{ color: 'text.secondary' }}
            >
              {ts('custom_clear')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
