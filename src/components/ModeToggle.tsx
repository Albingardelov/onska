import Chip from '@mui/material/Chip'
import { useMode } from '../contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggleMode } = useMode()
  return (
    <Chip
      label={mode === 'fint' ? '🌸 Fint' : '🔥 Snusk'}
      onClick={toggleMode}
      color="primary"
      variant={mode === 'fint' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
    />
  )
}
