import Chip from '@mui/material/Chip'
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import { useMode } from '../contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggleMode } = useMode()
  return (
    <Chip
      icon={mode === 'light' ? <WbSunnyRoundedIcon /> : <DarkModeRoundedIcon />}
      label={mode === 'light' ? 'Light' : 'Dark'}
      onClick={toggleMode}
      color="primary"
      variant={mode === 'light' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
    />
  )
}
