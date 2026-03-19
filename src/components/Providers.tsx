'use client'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { ModeProvider, useMode } from '@/src/contexts/ModeContext'
import { LocaleProvider } from '@/src/contexts/LocaleContext'
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'

const globalKeyframes = (
  <GlobalStyles styles={{
    '@keyframes cardIn': {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to:   { opacity: 1, transform: 'translateY(0)' },
    },
    '@keyframes heartbeat': {
      '0%, 100%': { transform: 'scale(1)' },
      '14%':      { transform: 'scale(1.18)' },
      '28%':      { transform: 'scale(1)' },
      '42%':      { transform: 'scale(1.1)' },
      '56%':      { transform: 'scale(1)' },
    },
    '@keyframes heartPop': {
      '0%':   { transform: 'scale(1)' },
      '35%':  { transform: 'scale(1.6)' },
      '65%':  { transform: 'scale(0.88)' },
      '100%': { transform: 'scale(1)' },
    },
    '@keyframes shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '18%':      { transform: 'translateX(-7px)' },
      '36%':      { transform: 'translateX(7px)' },
      '54%':      { transform: 'translateX(-4px)' },
      '72%':      { transform: 'translateX(4px)' },
    },
  }} />
)

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useMode()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalKeyframes}
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
