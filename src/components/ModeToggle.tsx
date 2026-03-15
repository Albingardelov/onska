import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { Icon } from '@iconify/react'
import { useMode } from '../contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggleMode } = useMode()
  const isLight = mode === 'fint'
  return (
    <Tooltip title={isLight ? 'Byt till Dark' : 'Byt till Light'}>
      <IconButton onClick={toggleMode} size="small" color="primary" aria-label="Byt läge"
        sx={{ opacity: 0.85, '&:hover': { opacity: 1 } }}>
        <Icon icon={isLight ? 'mdi:weather-sunny' : 'mdi:weather-night'} />
      </IconButton>
    </Tooltip>
  )
}
