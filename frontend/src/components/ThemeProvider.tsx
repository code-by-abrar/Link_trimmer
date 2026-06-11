"use client"

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export type ColorTheme = 'classic' | 'cyberpunk' | 'emerald'

interface ThemeContextType {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function subscribe() {
  return () => {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('classic')

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    const savedTheme = localStorage.getItem('linktrim-color-theme') as ColorTheme
    if (savedTheme && ['classic', 'cyberpunk', 'emerald'].includes(savedTheme)) {
      setTimeout(() => setColorThemeState(savedTheme), 0)
    }
  }, [])

  const setColorTheme = (theme: ColorTheme) => {
    localStorage.setItem('linktrim-color-theme', theme)
    setColorThemeState(theme)
  }

  useEffect(() => {
    if (!mounted) return
    const root = window.document.documentElement
    // Remove existing themes
    root.classList.remove('theme-classic', 'theme-cyberpunk', 'theme-emerald')
    // Add current theme
    root.classList.add(`theme-${colorTheme}`)
  }, [colorTheme, mounted])

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeContext.Provider value={{ colorTheme, setColorTheme }}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  )
}

export function useColorTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ThemeProvider')
  }
  return context
}
