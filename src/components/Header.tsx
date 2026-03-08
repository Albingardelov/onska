import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import LogoutIcon from '@mui/icons-material/Logout'
import Tooltip from '@mui/material/Tooltip'
import { ModeToggle } from './ModeToggle'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { partner, signOut } = useAuth()
  return (
    <AppBar position="sticky" color="inherit" elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{title}</Typography>
          {partner && (
            <Typography variant="caption" color="text.secondary">med {partner.name}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ModeToggle />
          <Tooltip title="Logga ut">
            <IconButton onClick={signOut} size="small" color="inherit">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
