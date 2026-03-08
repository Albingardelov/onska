import { useLocation, useNavigate } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import HomeIcon from '@mui/icons-material/Home'
import ListAltIcon from '@mui/icons-material/ListAlt'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SpaIcon from '@mui/icons-material/Spa'

const tabs = [
  { to: '/', icon: <HomeIcon />, label: 'Hem' },
  { to: '/bestallningar', icon: <ListAltIcon />, label: 'Beställningar' },
  { to: '/kalender', icon: <CalendarMonthIcon />, label: 'Kalender' },
  { to: '/mina-tjanster', icon: <SpaIcon />, label: 'Mina tjänster' },
]

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = tabs.findIndex(t => t.to === location.pathname)

  return (
    <Paper
      elevation={3}
      sx={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        flexShrink: 0,
      }}
    >
      <BottomNavigation
        value={current === -1 ? 0 : current}
        onChange={(_, v) => navigate(tabs[v].to)}
      >
        {tabs.map(tab => (
          <BottomNavigationAction key={tab.to} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
