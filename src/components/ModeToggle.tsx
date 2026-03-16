'use client'
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'
import { useMode } from '../contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggleMode } = useMode()
  const isLight = mode === 'fint'

  return (
    <Box
      onClick={toggleMode}
      aria-label="Byt läge"
      role="switch"
      aria-checked={!isLight}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: 64,
        height: 32,
        borderRadius: '16px',
        bgcolor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)',
        p: '3px',
        cursor: 'pointer',
        userSelect: 'none',
        flexShrink: 0,
        '&:active': { opacity: 0.8 },
      }}
    >
      {/* Sliding indicator */}
      <Box sx={{
        position: 'absolute',
        top: '3px',
        left: isLight ? '3px' : '31px',
        width: 26,
        height: 26,
        borderRadius: '13px',
        bgcolor: 'primary.main',
        transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />

      {/* Sun icon */}
      <Box sx={{
        position: 'relative', zIndex: 1,
        width: 26, height: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isLight ? '#fff' : 'text.disabled',
        transition: 'color 0.2s',
        fontSize: 14,
      }}>
        <Icon icon="mdi:weather-sunny" />
      </Box>

      {/* Moon icon */}
      <Box sx={{
        position: 'relative', zIndex: 1,
        width: 26, height: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: !isLight ? '#fff' : 'text.disabled',
        transition: 'color 0.2s',
        fontSize: 14,
      }}>
        <Icon icon="mdi:weather-night" />
      </Box>
    </Box>
  )
}
