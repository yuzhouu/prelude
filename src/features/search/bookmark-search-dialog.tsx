import { Dialog } from '@base-ui/react/dialog'
import { Search, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useTranslation } from 'react-i18next'

import type { BookmarkMatch } from '../bookmarks/model'
import { isKeyboardShortcutMatch } from '../shortcuts/shortcut-preferences'
import { useShortcutPreferences } from '../shortcuts/use-shortcut-preferences'
import type { OpenTab, OpenTabWindow } from '../tabs/model'
import { useTopSites } from '../top-sites/use-top-sites'
import {
  getHiddenTopSitesSnapshot,
  hideTopSite,
  parseHiddenTopSites,
  restoreHiddenTopSites,
  subscribeToHiddenTopSites,
} from '../top-sites/top-sites-preferences'
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
  const [preferenceError, setPreferenceError] = useState(false)
  const {
    state: topSitesState,
    refresh: refreshTopSites,
    access: topSitesAccess,
  } = useTopSites(isOpen)
  const hiddenSnapshot = useSyncExternalStore(
    subscribeToHiddenTopSites,
    getHiddenTopSitesSnapshot,
  )
  const hiddenTopSiteUrls = useMemo(
    () => parseHiddenTopSites(hiddenSnapshot),
    [hiddenSnapshot],
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const trimmedQuery = query.trim()
  const suggestions = useMemo(
    () =>
      buildOmniboxSuggestions({
        bookmarks,
        openTabWindows,
        rawQuery: query,
        topSites: topSitesState.sites,
        hiddenTopSiteUrls,
        t,
      }),
    [
      bookmarks,
      openTabWindows,
      query,
      t,
      topSitesState.sites,
      hiddenTopSiteUrls,
    ],
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

  const updateHiddenSites = (url?: string) => {
    inputRef.current?.focus()
    try {
      if (url) hideTopSite(url)
      else restoreHiddenTopSites()
      setPreferenceError(false)
      setActiveIndex(0)
    } catch {
      setPreferenceError(true)
    }
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
                aria-haspopup="grid"
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
                  onHideTopSite={updateHiddenSites}
                  showSections={!trimmedQuery}
                />
              )}
            </div>

            {topSitesAccess.enabled && preferenceError ? (
              <p className="search-top-sites-notice" role="alert">
                {t('topSites.saveError')}
              </p>
            ) : null}
            {topSitesAccess.enabled &&
            (topSitesState.status === 'error' ||
              hiddenTopSiteUrls.length > 0) ? (
              <div className="search-top-sites-tools">
                {topSitesState.status === 'error' ? (
                  <span role="status">
                    {t('topSites.error')}
                    <button type="button" onClick={refreshTopSites}>
                      {t('topSites.retry')}
                    </button>
                  </span>
                ) : null}
                {hiddenTopSiteUrls.length > 0 ? (
                  <button type="button" onClick={() => updateHiddenSites()}>
                    {t('topSites.restore', { count: hiddenTopSiteUrls.length })}
                  </button>
                ) : null}
              </div>
            ) : null}

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
