import { createContext, useContext, useState, useEffect } from 'react'
import type { Theme } from '@mui/material/styles'
import { fintTheme, snuskTheme } from '../lib/themes'
import type { Mode } from '../types'

interface ModeContextType {
  mode: Mode
  toggleMode: () => void
  theme: Theme
  isFint: boolean
  isSnusk: boolean
}

const ModeContext = createContext<ModeContextType | null>(null)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    return (localStorage.getItem('onska-mode') as Mode) ?? 'fint'
  })

  useEffect(() => {
    localStorage.setItem('onska-mode', mode)
  }, [mode])

  function toggleMode() {
    setMode(m => m === 'fint' ? 'snusk' : 'fint')
  }

  const theme = mode === 'fint' ? fintTheme : snuskTheme

  return (
    <ModeContext.Provider value={{ mode, toggleMode, theme, isFint: mode === 'fint', isSnusk: mode === 'snusk' }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}
