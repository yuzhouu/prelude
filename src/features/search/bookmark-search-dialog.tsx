import { Dialog } from '@base-ui/react/dialog'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { BookmarkMatch } from '../bookmarks/model'
import type { OpenTab, OpenTabWindow } from '../tabs/model'
import { searchWithDefaultProvider } from './chrome-search'
import { buildOmniboxSuggestions } from './omnibox-model'
import type { OmniboxSuggestion } from './omnibox-model'
import { OmniboxResults } from './omnibox-results'

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
      }),
    [bookmarks, openTabWindows, query],
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (isOpen) inputRef.current?.focus()
        else onOpenChange(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onOpenChange])

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
    if (!suggestions.length) return

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
            <Dialog.Title className="sr-only">搜索或输入网址</Dialog.Title>
            <form className="search-dialog-form" onSubmit={handleSubmit}>
              <Search aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                value={query}
                placeholder="搜索或输入网址"
                aria-label="搜索或输入网址"
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
                aria-label="关闭搜索"
              >
                <X />
              </Dialog.Close>
            </form>

            <div className="search-dialog-results" aria-live="polite">
              {!trimmedQuery ? (
                <div className="search-dialog-hint">
                  <span className="search-dialog-hint-icon">
                    <Search aria-hidden="true" />
                  </span>
                  <strong>像 Chrome 地址栏一样使用</strong>
                  <p>输入网址直接访问，其他内容使用默认搜索引擎搜索。</p>
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
              <span>书签、标签页与 Chrome 默认搜索引擎</span>
              <span>↑↓ 选择 · Enter 打开 · Esc 关闭</span>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
