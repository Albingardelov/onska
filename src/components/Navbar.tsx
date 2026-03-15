'use client'
import { usePathname, useRouter } from 'next/navigation'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'

export function Navbar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { to: '/', icon: <Icon icon="mdi:home" width={28} />, label: t('home') },
    { to: '/wishes', icon: <Icon icon="mdi:inbox" width={28} />, label: t('orders') },
    { to: '/calendar', icon: <Icon icon="mdi:calendar-today" width={28} />, label: t('calendar') },
    { to: '/ideas', icon: <Icon icon="mdi:heart-outline" width={28} />, label: t('services') },
  ]

  const current = tabs.findIndex(tab => tab.to === pathname)

  return (
    <Paper
      component="nav"
      aria-label={t('aria_label')}
      elevation={0}
      sx={{ paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}
    >
      <BottomNavigation
        value={current === -1 ? 0 : current}
        onChange={(_, v) => router.push(tabs[v].to)}
      >
        {tabs.map(tab => (
          <BottomNavigationAction
            key={tab.to}
            label={tab.label}
            icon={tab.icon}
            sx={{
              borderRadius: 2,
              mx: 0.5,
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
