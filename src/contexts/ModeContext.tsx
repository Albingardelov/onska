import { createContext, useContext, useState, useEffect } from 'react'
import type { Theme } from '@mui/material/styles'
import { lightTheme, darkTheme } from '../lib/themes'
import type { Mode } from '../types'

interface ModeContextType {
  mode: Mode
  toggleMode: () => void
  theme: Theme
  isLight: boolean
  isDark: boolean
}

const ModeContext = createContext<ModeContextType | null>(null)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('onska-mode') as Mode) ?? 'light'
  })

  useEffect(() => {
    localStorage.setItem('onska-mode', mode)
  }, [mode])

  function toggleMode() {
    setMode(m => m === 'light' ? 'dark' : 'light')
  }

  const theme = mode === 'light' ? lightTheme : darkTheme

  return (
    <ModeContext.Provider value={{ mode, toggleMode, theme, isLight: mode === 'light', isDark: mode === 'dark' }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}
