'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import sv from '../../messages/sv.json'
import en from '../../messages/en.json'

type Locale = 'sv' | 'en'
const messages = { sv, en }

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'sv', setLocale: () => {} })

export function useLocale() {
  return useContext(LocaleContext)
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('sv')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored === 'sv' || stored === 'en') {
      setLocaleState(stored)
    } else {
      const browser = navigator.language.startsWith('sv') ? 'sv' : 'en'
      setLocaleState(browser)
    }
    setReady(true)
  }, [])

  function setLocale(l: Locale) {
    localStorage.setItem('locale', l)
    setLocaleState(l)
  }

  if (!ready) return null

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
