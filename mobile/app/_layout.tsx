import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ModeProvider, useMode } from '@/contexts/ModeContext'
import { lightTheme, darkTheme } from '@/theme'

function RootGuard() {
  const { user, profile, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inApp = segments[0] === '(app)'
    const inAuth = segments[0] === '(auth)'

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login')
    } else if (!profile?.partner_id) {
      if (segments[1] !== 'pairing') router.replace('/(auth)/pairing')
    } else {
      if (!inApp) router.replace('/(app)')
    }
  }, [user, profile, loading])

  return <Slot />
}

function ThemedApp() {
  const { mode } = useMode()
  const theme = mode === 'fint' ? lightTheme : darkTheme

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={mode === 'fint' ? 'dark' : 'light'} />
      <AuthProvider>
        <RootGuard />
      </AuthProvider>
    </PaperProvider>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ModeProvider>
        <ThemedApp />
      </ModeProvider>
    </SafeAreaProvider>
  )
}
