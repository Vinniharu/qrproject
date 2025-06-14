'use client'

import * as React from 'react'
import { Moon, Sun, Zap } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Zap className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative overflow-hidden group bg-gradient-to-r from-purple-500/10 to-violet-500/10 hover:from-purple-500/20 hover:to-violet-500/20 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-400/10 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
      ) : (
        <Sun className="h-4 w-4 text-yellow-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
      )}
      
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/0 via-purple-400/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 