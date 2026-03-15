import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { Icon } from '@iconify/react'
import Tooltip from '@mui/material/Tooltip'
import { ModeToggle } from './ModeToggle'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { partner, signOut } = useAuth()
  const router = useRouter()
  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60, px: 2.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em" lineHeight={1.2}>
            {title}
          </Typography>
          {partner && (
            <Typography variant="caption" color="text.secondary" letterSpacing="0.01em">
              med {partner.name}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ModeToggle />
          <Tooltip title="Inställningar">
            <IconButton onClick={() => router.push('/settings')} size="small" color="inherit"
              aria-label="Inställningar"
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
              <Icon icon="mdi:cog" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logga ut">
            <IconButton onClick={signOut} size="small" color="inherit"
              aria-label="Logga ut"
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
              <Icon icon="mdi:logout" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
