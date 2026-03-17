'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { Navbar } from '@/src/components/Navbar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login')
      else if (!profile?.partner_id) router.replace('/pairing')
    }
  }, [user, profile, loading, router])

  if (loading || !user || !profile?.partner_id) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
        <CircularProgress color="primary" />
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" height="100dvh" bgcolor="background.default">
      <Box component="main" flex={1} overflow="auto" sx={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        {children}
      </Box>
      <Navbar />
    </Box>
  )
}
