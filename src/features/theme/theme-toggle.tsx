import { useEffect, useState } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'

import {
  applyTheme,
  getThemePreference,
  resolveTheme,
  saveThemePreference,
  subscribeToSystemTheme,
} from './theme'
import type { ThemePreference } from './theme'

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', icon: Laptop },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
] as const

export function ThemeToggle() {
  const [preference, setPreference] =
    useState<ThemePreference>(getThemePreference)

  useEffect(() => {
    const updateTheme = () => applyTheme(preference, resolveTheme(preference))
    updateTheme()

    if (preference !== 'system') return
    return subscribeToSystemTheme(updateTheme)
  }, [preference])

  const selectTheme = (nextPreference: ThemePreference) => {
    setPreference(nextPreference)
    saveThemePreference(nextPreference)
  }

  return (
    <div className="theme-control">
      <span className="theme-control-label">外观</span>
      <div className="theme-options" role="group" aria-label="外观主题">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className="theme-option"
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={preference === value}
            onClick={() => selectTheme(value)}
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  )
}
