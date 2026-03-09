import Chip from '@mui/material/Chip'
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import { useMode } from '../contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggleMode } = useMode()
  return (
    <Chip
      icon={mode === 'fint' ? <WbSunnyRoundedIcon /> : <DarkModeRoundedIcon />}
      label={mode === 'fint' ? 'Light' : 'Dark'}
      onClick={toggleMode}
      color="primary"
      variant={mode === 'fint' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
    />
  )
}
