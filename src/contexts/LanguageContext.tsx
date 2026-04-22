import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type UiLanguage = 'en' | 'am'

interface LanguageContextValue {
  language: UiLanguage
  setLanguage: (language: UiLanguage) => void
  toggleLanguage: () => void
}

const STORAGE_KEY = 'eotc-ui-language'

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function getInitialLanguage(): UiLanguage {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'am' ? 'am' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language === 'am' ? 'am' : 'en'
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((current) => (current === 'en' ? 'am' : 'en')),
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useUiLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useUiLanguage must be used within LanguageProvider')
  }
  return context
}
