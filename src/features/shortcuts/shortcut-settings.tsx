import { useEffect, useState } from 'react'
import { ExternalLink, Keyboard, Pencil, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  openChromeShortcutSettings,
  useCaptureCommandShortcut,
} from './chrome-commands'
import {
  areKeyboardShortcutsEqual,
  DEFAULT_SHORTCUT_PREFERENCES,
  formatChromeCommandShortcut,
  formatKeyboardShortcut,
  hasRequiredShortcutModifier,
  isApplePlatform,
  isBrowserReservedShortcut,
  keyboardShortcutFromEvent,
  parseChromeCommandShortcut,
  saveShortcutPreferences,
} from './shortcut-preferences'
import { useShortcutPreferences } from './use-shortcut-preferences'

type ShortcutError = 'conflict' | 'modifier' | 'reserved'

export function ShortcutSettings() {
  const { t } = useTranslation()
  const preferences = useShortcutPreferences()
  const captureCommand = useCaptureCommandShortcut()
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<ShortcutError>()
  const applePlatform = isApplePlatform()
  const searchShortcutLabel = formatKeyboardShortcut(
    preferences.search,
    applePlatform,
  )
  const captureShortcutLabel = captureCommand.shortcut
    ? formatChromeCommandShortcut(captureCommand.shortcut)
    : t('settings.shortcuts.unassigned')
  const isDefault = areKeyboardShortcutsEqual(
    preferences.search,
    DEFAULT_SHORTCUT_PREFERENCES.search,
  )

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopImmediatePropagation()

      if (event.key === 'Escape') {
        setIsRecording(false)
        setError(undefined)
        return
      }

      const shortcut = keyboardShortcutFromEvent(event)
      if (!shortcut) return
      if (!hasRequiredShortcutModifier(shortcut)) {
        setError('modifier')
        return
      }
      if (isBrowserReservedShortcut(shortcut)) {
        setError('reserved')
        return
      }

      const captureShortcut = parseChromeCommandShortcut(
        captureCommand.shortcut,
      )
      if (
        captureShortcut &&
        areKeyboardShortcutsEqual(shortcut, captureShortcut)
      ) {
        setError('conflict')
        return
      }

      saveShortcutPreferences({ search: shortcut })
      setIsRecording(false)
      setError(undefined)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [captureCommand.shortcut, isRecording])

  const resetShortcuts = () => {
    saveShortcutPreferences(DEFAULT_SHORTCUT_PREFERENCES)
    setIsRecording(false)
    setError(undefined)
  }

  const editChromeShortcut = () => {
    void openChromeShortcutSettings().catch(() => undefined)
  }

  return (
    <section
      className="settings-section settings-shortcuts-section"
      aria-labelledby="settings-shortcuts-title"
    >
      <div className="settings-shortcuts-header">
        <div className="settings-section-heading">
          <span className="settings-section-icon" aria-hidden="true">
            <Keyboard />
          </span>
          <div>
            <h2 id="settings-shortcuts-title">
              {t('settings.shortcuts.title')}
            </h2>
            <p>{t('settings.shortcuts.summary')}</p>
          </div>
        </div>
        <button
          className="settings-shortcuts-reset"
          type="button"
          disabled={isDefault}
          onClick={resetShortcuts}
        >
          <RotateCcw aria-hidden="true" />
          {t('settings.shortcuts.reset')}
        </button>
      </div>

      <div className="settings-shortcut-list">
        <div className="settings-shortcut-row">
          <div className="settings-shortcut-copy">
            <strong>{t('settings.shortcuts.search.title')}</strong>
            <span>{t('settings.shortcuts.search.description')}</span>
          </div>
          <button
            className={`settings-shortcut-recorder${isRecording ? ' is-recording' : ''}`}
            type="button"
            aria-pressed={isRecording}
            onClick={() => {
              setIsRecording(true)
              setError(undefined)
            }}
          >
            <kbd>
              {isRecording
                ? t('settings.shortcuts.recording')
                : searchShortcutLabel}
            </kbd>
            <span>
              {isRecording
                ? t('settings.shortcuts.cancelHint')
                : t('settings.shortcuts.change')}
            </span>
            <Pencil aria-hidden="true" />
          </button>
        </div>

        <div className="settings-shortcut-row">
          <div className="settings-shortcut-copy">
            <strong>{t('settings.shortcuts.capture.title')}</strong>
            <span>{t('settings.shortcuts.capture.description')}</span>
          </div>
          <div className="settings-chrome-shortcut-control">
            <kbd>{captureShortcutLabel}</kbd>
            <button
              type="button"
              disabled={!captureCommand.isExtension}
              onClick={editChromeShortcut}
            >
              {t(
                captureCommand.isExtension
                  ? 'settings.shortcuts.capture.action'
                  : 'settings.shortcuts.capture.extensionRequired',
              )}
              <ExternalLink aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="settings-shortcut-error" role="alert">
          {t(`settings.shortcuts.errors.${error}`)}
        </p>
      ) : null}
    </section>
  )
}
