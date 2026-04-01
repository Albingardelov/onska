'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { useMode } from '../contexts/ModeContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function Navbar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { mode } = useMode()
  const { user } = useAuth()
  const [mySnuskOpenToday, setMySnuskOpenToday] = useState(0)

  useEffect(() => {
    if (mode !== 'snusk' || !user) { setMySnuskOpenToday(0); return }
    const today = format(new Date(), 'yyyy-MM-dd')
    supabase.from('service_availability')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('date', today)
      .then(({ count }) => setMySnuskOpenToday(count ?? 0))
  }, [mode, user, pathname])

  const isSnusk = mode === 'snusk'

  const tabs = [
    { to: '/', icon: 'mdi:home-outline', activeIcon: 'mdi:home', label: t('home') },
    { to: '/onskningar', icon: 'mdi:inbox-outline', activeIcon: 'mdi:inbox', label: t('orders') },
    { to: '/kalender', icon: 'mdi:calendar-outline', activeIcon: 'mdi:calendar-today', label: t('calendar') },
    { to: '/services', icon: 'mdi:heart-outline', activeIcon: 'mdi:heart', label: isSnusk ? t('services_snusk') : t('services') },
  ]

  return (
    <Box
      component="nav"
      aria-label={t('aria_label')}
      sx={{
        position: 'fixed',
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: '6px',
        borderRadius: '28px',
        bgcolor: isSnusk ? 'rgba(12,2,6,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isSnusk
          ? '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,18,48,0.15)'
          : '0 8px 28px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {tabs.map(tab => {
        const active = pathname === tab.to
        return (
          <Box
            key={tab.to}
            component={Link}
            href={tab.to}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              px: '14px',
              py: '7px',
              borderRadius: '20px',
              textDecoration: 'none',
              position: 'relative',
              bgcolor: active ? 'primary.main' : 'transparent',
              color: active ? 'primary.contrastText' : isSnusk ? '#BA7080' : 'text.secondary',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              minWidth: 54,
              '&:active': { transform: 'scale(0.91)' },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            <Box sx={{ fontSize: 22, display: 'flex', lineHeight: 1 }}>
              <Icon icon={active ? tab.activeIcon : tab.icon} />
            </Box>
            {tab.to === '/kalender' && isSnusk && mySnuskOpenToday === 0 && (
              <Box sx={{
                position: 'absolute', top: 6, right: 10,
                width: 7, height: 7, borderRadius: '50%',
                bgcolor: 'warning.main',
                border: '1.5px solid',
                borderColor: isSnusk ? 'rgba(12,2,6,0.92)' : 'rgba(255,255,255,0.92)',
              }} />
            )}
            <Typography sx={{
              fontSize: '0.58rem',
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.03em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              color: 'inherit',
            }}>
              {tab.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
