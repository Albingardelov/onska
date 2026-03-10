import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Mode } from '../types'

interface ModeContextType {
  mode: Mode
  toggleMode: () => void
  isFint: boolean
  isSnusk: boolean
}

const ModeContext = createContext<ModeContextType | null>(null)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('fint')

  useEffect(() => {
    AsyncStorage.getItem('couply-mode').then(val => {
      if (val === 'fint' || val === 'snusk') setMode(val)
    })
  }, [])

  function toggleMode() {
    const next: Mode = mode === 'fint' ? 'snusk' : 'fint'
    setMode(next)
    AsyncStorage.setItem('couply-mode', next)
  }

  return (
    <ModeContext.Provider value={{ mode, toggleMode, isFint: mode === 'fint', isSnusk: mode === 'snusk' }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}
