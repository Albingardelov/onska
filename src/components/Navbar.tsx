import { usePathname, useRouter } from 'next/navigation'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'

const tabs = [
  { to: '/', icon: <HomeRoundedIcon />, label: 'Hem' },
  { to: '/bestallningar', icon: <InboxRoundedIcon />, label: 'Beställningar' },
  { to: '/kalender', icon: <CalendarTodayRoundedIcon />, label: 'Kalender' },
  { to: '/mina-tjanster', icon: <FavoriteBorderRoundedIcon />, label: 'Tjänster' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const current = tabs.findIndex(t => t.to === pathname)

  return (
    <Paper
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
