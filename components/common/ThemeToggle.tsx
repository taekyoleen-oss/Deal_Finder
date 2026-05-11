'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: '라이트' },
  { value: 'dark', icon: Moon, label: '다크' },
  { value: 'system', icon: Monitor, label: '시스템' },
]

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setTheme(stored)
    applyTheme(stored ?? 'system')
  }, [])

  function applyTheme(t: Theme) {
    const root = document.documentElement
    const isDark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)
  }

  function cycleTheme() {
    const idx = THEMES.findIndex(t => t.value === theme)
    const next = THEMES[(idx + 1) % THEMES.length].value
    setTheme(next)
    localStorage.setItem('theme', next)
    applyTheme(next)
  }

  const current = THEMES.find(t => t.value === theme)!
  const Icon = current.icon

  return (
    <button
      onClick={cycleTheme}
      title={`테마: ${current.label}`}
      className="p-2 rounded-lg transition-colors hover:opacity-70"
      style={{ color: 'var(--muted-fg)' }}
      aria-label={`테마 변경 (현재: ${current.label})`}
    >
      <Icon size={18} />
    </button>
  )
}
