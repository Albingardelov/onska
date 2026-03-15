'use client'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { ModeProvider, useMode } from '@/src/contexts/ModeContext'
import { LocaleProvider } from '@/src/contexts/LocaleContext'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useMode()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <LocaleProvider>
        <AuthProvider>
          <ModeProvider>
            <ThemeWrapper>{children}</ThemeWrapper>
          </ModeProvider>
        </AuthProvider>
      </LocaleProvider>
    </AppRouterCacheProvider>
  )
}
