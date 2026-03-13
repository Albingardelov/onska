import Chip from '@mui/material/Chip'
import { Icon } from '@iconify/react'
import { useMode } from '../contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggleMode } = useMode()
  return (
    <Chip
      icon={<Icon icon={mode === 'fint' ? 'mdi:weather-sunny' : 'mdi:weather-night'} />}
      label={mode === 'fint' ? 'Light' : 'Dark'}
      onClick={toggleMode}
      color="primary"
      variant={mode === 'fint' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
    />
  )
}
