import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { Icon } from '@iconify/react'
import Tooltip from '@mui/material/Tooltip'
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import { useAuth } from '../contexts/AuthContext'
import { useTranslations } from 'next-intl'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { partner, signOut } = useAuth()
  const t = useTranslations('header')
  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60, px: 2.5 }}>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box component="span" sx={{ fontSize: 20, color: 'primary.main', display: 'flex' }}>
              <Icon icon="mdi:heart" />
            </Box>
            <Typography variant="h6" fontWeight={900} color="primary" letterSpacing="-0.03em" lineHeight={1.2}>
              Couply
            </Typography>
          </Box>
          {partner && (
            <Typography variant="caption" color="text.secondary" letterSpacing="0.01em">
              {t('with_partner', { name: partner.name })}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ModeToggle />
          <Tooltip title={t('settings')}>
            <IconButton component={Link} href="/settings" size="small" color="inherit"
              aria-label={t('settings')}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
              <Icon icon="mdi:cog" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('sign_out')}>
            <IconButton onClick={signOut} size="small" color="inherit"
              aria-label={t('sign_out')}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
              <Icon icon="mdi:logout" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
