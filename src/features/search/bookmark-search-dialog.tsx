import { Dialog } from '@base-ui/react/dialog'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { BookmarkMatch } from '../bookmarks/model'
import { isKeyboardShortcutMatch } from '../shortcuts/shortcut-preferences'
import { useShortcutPreferences } from '../shortcuts/use-shortcut-preferences'
import type { OpenTab, OpenTabWindow } from '../tabs/model'
import { searchWithDefaultProvider } from './chrome-search'
import { buildOmniboxSuggestions } from './omnibox-model'
import type { OmniboxSuggestion } from './omnibox-model'
import { getSuggestionActionKey, OmniboxResults } from './omnibox-results'

export function BookmarkSearchDialog({
  bookmarks,
  openTabWindows,
  isOpen,
  onActivateTab,
  onOpenChange,
}: {
  bookmarks: Array<BookmarkMatch>
  openTabWindows: Array<OpenTabWindow>
  isOpen: boolean
  onActivateTab: (tab: OpenTab) => void
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const shortcutPreferences = useShortcutPreferences()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const trimmedQuery = query.trim()
  const suggestions = useMemo(
    () =>
      buildOmniboxSuggestions({
        bookmarks,
        openTabWindows,
        rawQuery: query,
        t,
      }),
    [bookmarks, openTabWindows, query, t],
  )
  const selectedIndex = Math.min(
    activeIndex,
    Math.max(0, suggestions.length - 1),
  )
  const activeOptionId = suggestions.length
    ? `${listboxId}-option-${selectedIndex}`
    : undefined

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !event.defaultPrevented &&
        isKeyboardShortcutMatch(event, shortcutPreferences.search)
      ) {
        event.preventDefault()
        if (isOpen) inputRef.current?.focus()
        else onOpenChange(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onOpenChange, shortcutPreferences.search])

  const closeDialog = () => {
    setQuery('')
    setActiveIndex(0)
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
    onOpenChange(open)
  }

  const executeSuggestion = (suggestion: OmniboxSuggestion | undefined) => {
    if (!suggestion) return

    if (suggestion.kind === 'tab') {
      onActivateTab(suggestion.tab)
      closeDialog()
      return
    }

    if (suggestion.kind === 'search') {
      searchWithDefaultProvider(suggestion.query)
      return
    }

    window.location.assign(suggestion.url)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    executeSuggestion(suggestions[selectedIndex])
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || !suggestions.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      executeSuggestion(suggestions[selectedIndex])
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="search-dialog-backdrop" />
        <Dialog.Viewport className="search-dialog-viewport">
          <Dialog.Popup className="search-dialog-popup" initialFocus={inputRef}>
            <Dialog.Title className="sr-only">
              {t('search.dialogTitle')}
            </Dialog.Title>
            <form className="search-dialog-form" onSubmit={handleSubmit}>
              <Search aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                value={query}
                placeholder={t('search.dialogTitle')}
                aria-label={t('search.dialogTitle')}
                aria-autocomplete="list"
                aria-controls={suggestions.length ? listboxId : undefined}
                aria-expanded={suggestions.length > 0}
                aria-activedescendant={activeOptionId}
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleInputKeyDown}
              />
              <Dialog.Close
                className="search-dialog-close"
                type="button"
                aria-label={t('search.close')}
              >
                <X />
              </Dialog.Close>
            </form>

            <div className="search-dialog-results" aria-live="polite">
              {!trimmedQuery && suggestions.length > 0 ? (
                <p className="search-section-label">
                  {t('search.recentTitle')}
                </p>
              ) : null}
              {suggestions.length === 0 ? (
                <div className="search-dialog-hint">
                  <span className="search-dialog-hint-icon">
                    <Search aria-hidden="true" />
                  </span>
                  <strong>{t('search.hintTitle')}</strong>
                  <p>{t('search.hintDescription')}</p>
                </div>
              ) : (
                <OmniboxResults
                  activeIndex={selectedIndex}
                  listboxId={listboxId}
                  suggestions={suggestions}
                  onActiveIndexChange={setActiveIndex}
                  onSelect={executeSuggestion}
                />
              )}
            </div>

            <footer className="search-dialog-footer">
              <span className="search-enter-hint">
                {suggestions[selectedIndex]
                  ? t('search.enterAction', {
                      action: t(
                        getSuggestionActionKey(suggestions[selectedIndex].kind),
                      ),
                    })
                  : t('search.sources')}
              </span>
              <span>{t('search.keyboardHelp')}</span>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
