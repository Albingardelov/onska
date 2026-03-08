import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ModeProvider, useMode } from './contexts/ModeContext'
import { LoginPage } from './pages/LoginPage'
import { PairingPage } from './pages/PairingPage'
import { HomePage } from './pages/HomePage'
import { OrdersPage } from './pages/OrdersPage'
import { CalendarPage } from './pages/CalendarPage'
import { MyServicesPage } from './pages/MyServicesPage'
import { Navbar } from './components/Navbar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const { theme } = useMode()

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
          <CircularProgress color="primary" />
        </Box>
      </ThemeProvider>
    )
  }

  if (!user) return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoginPage />
    </ThemeProvider>
  )

  if (!profile?.partner_id) return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PairingPage />
    </ThemeProvider>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100dvh" bgcolor="background.default">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bestallningar" element={<OrdersPage />} />
          <Route path="/kalender" element={<CalendarPage />} />
          <Route path="/mina-tjanster" element={<MyServicesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Navbar />
      </Box>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModeProvider>
          <AppRoutes />
        </ModeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
