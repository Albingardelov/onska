import { useLocation, useNavigate } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import HomeIcon from '@mui/icons-material/Home'
import ListAltIcon from '@mui/icons-material/ListAlt'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import StarsIcon from '@mui/icons-material/Stars'

const tabs = [
  { to: '/', icon: <HomeIcon />, label: 'Hem' },
  { to: '/bestallningar', icon: <ListAltIcon />, label: 'Beställningar' },
  { to: '/kalender', icon: <CalendarMonthIcon />, label: 'Kalender' },
  { to: '/mina-tjanster', icon: <StarsIcon />, label: 'Mina' },
]

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = tabs.findIndex(t => t.to === location.pathname)

  return (
    <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
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
