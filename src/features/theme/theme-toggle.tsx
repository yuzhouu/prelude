import { useEffect, useState } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  applyTheme,
  getThemePreference,
  resolveTheme,
  saveThemePreference,
  subscribeToSystemTheme,
} from './theme'
import type { ThemePreference } from './theme'

const THEME_OPTIONS = [
  { value: 'system', labelKey: 'theme.system', icon: Laptop },
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
] as const

export function ThemeToggle() {
  const { t } = useTranslation()
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
    <div
      className="theme-options"
      role="group"
      aria-label={t('theme.groupLabel')}
    >
      {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
        const label = t(labelKey)
        return (
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
        )
      })}
    </div>
  )
}
