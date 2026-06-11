"use client"

import { useState, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { useColorTheme, ColorTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Palette, Check, Zap, Leaf, Sparkles } from 'lucide-react'

function subscribe() {
  return () => {}
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div className="w-24 sm:w-36 h-9 bg-muted/10 animate-pulse rounded-xl border border-border/40"></div>
    )
  }

  const themes: { id: ColorTheme; label: string; icon: React.ElementType; colorClass: string }[] = [
    { 
      id: 'classic', 
      label: 'Classic Indigo', 
      icon: Sparkles,
      colorClass: 'bg-indigo-600'
    },
    { 
      id: 'cyberpunk', 
      label: 'Cyberpunk Neon', 
      icon: Zap,
      colorClass: 'bg-fuchsia-600' 
    },
    { 
      id: 'emerald', 
      label: 'Emerald Mint', 
      icon: Leaf,
      colorClass: 'bg-emerald-600' 
    },
  ]

  const toggleMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="relative flex items-center gap-1.5 sm:gap-2">
      {/* Light/Dark mode toggle icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        className="w-9 h-9 rounded-xl hover:bg-accent/40 relative cursor-pointer"
        title="Toggle Light/Dark Mode"
      >
        <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
      </Button>

      {/* Color Palette dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="h-9 px-2.5 gap-1.5 rounded-xl border border-border/60 bg-card/40 hover:bg-accent/20 cursor-pointer font-semibold text-xs transition-all duration-200"
        >
          <Palette className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold">
            {themes.find(t => t.id === colorTheme)?.label || 'Theme'}
          </span>
        </Button>

        {dropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2.5 w-44 rounded-xl border bg-card/95 backdrop-blur-md p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Theme Palette
              </div>
              <div className="h-px bg-border/40 my-1" />
              {themes.map((t) => {
                const IconComponent = t.icon
                const isActive = colorTheme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setColorTheme(t.id)
                      setDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-bold' 
                        : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.colorClass} ring-1 ring-background shrink-0`} />
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.label.split(' ')[0]}</span>
                    </div>
                    {isActive && <Check className="w-3 h-3 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
