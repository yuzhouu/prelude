import { useEffect, useState } from 'react'

import {
  getShortcutPreferences,
  SHORTCUT_PREFERENCES_CHANGED_EVENT,
  SHORTCUT_PREFERENCES_STORAGE_KEY,
  syncShortcutPreferencesFromStorage,
} from './shortcut-preferences'

export function useShortcutPreferences() {
  const [preferences, setPreferences] = useState(getShortcutPreferences)

  useEffect(() => {
    const handlePreferenceChange = () => {
      setPreferences(getShortcutPreferences())
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SHORTCUT_PREFERENCES_STORAGE_KEY) return
      setPreferences(syncShortcutPreferencesFromStorage(event.newValue))
    }

    window.addEventListener(
      SHORTCUT_PREFERENCES_CHANGED_EVENT,
      handlePreferenceChange,
    )
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(
        SHORTCUT_PREFERENCES_CHANGED_EVENT,
        handlePreferenceChange,
      )
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return preferences
}
