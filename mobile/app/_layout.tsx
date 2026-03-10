import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
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

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootGuard />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
