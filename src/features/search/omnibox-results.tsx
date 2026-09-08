import {
  ArrowUpRight,
  CornerDownLeft,
  Globe2,
  PanelsTopLeft,
  Search,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { BookmarkFavicon } from '../bookmarks/bookmark-favicon'
import type { OmniboxSuggestion } from './omnibox-model'

function SuggestionIcon({ suggestion }: { suggestion: OmniboxSuggestion }) {
  if (suggestion.kind === 'bookmark') {
    return <BookmarkFavicon title={suggestion.title} url={suggestion.url} />
  }

  if (suggestion.kind === 'tab') {
    return <BookmarkFavicon title={suggestion.title} url={suggestion.tab.url} />
  }

  return (
    <span className="search-result-leading-icon" aria-hidden="true">
      {suggestion.kind === 'navigate' ? <Globe2 /> : <Search />}
    </span>
  )
}

export function getSuggestionActionKey(kind: OmniboxSuggestion['kind']) {
  const keys = {
    bookmark: 'search.actionBookmark',
    tab: 'search.actionTab',
    search: 'search.actionSearch',
    navigate: 'search.actionNavigate',
  } as const satisfies Record<OmniboxSuggestion['kind'], `search.${string}`>
  return keys[kind]
}

function SuggestionTail({ suggestion }: { suggestion: OmniboxSuggestion }) {
  if (suggestion.kind === 'tab') return <PanelsTopLeft aria-hidden="true" />
  if (suggestion.kind === 'bookmark') return <ArrowUpRight aria-hidden="true" />
  return <CornerDownLeft aria-hidden="true" />
}

export function OmniboxResults({
  activeIndex,
  listboxId,
  onActiveIndexChange,
  onSelect,
  suggestions,
}: {
  activeIndex: number
  listboxId: string
  onActiveIndexChange: (index: number) => void
  onSelect: (suggestion: OmniboxSuggestion) => void
  suggestions: Array<OmniboxSuggestion>
}) {
  const { t } = useTranslation()
  const listboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listboxRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div
      ref={listboxRef}
      id={listboxId}
      className="omnibox-results"
      role="listbox"
      aria-label={t('search.suggestions')}
    >
      {suggestions.map((suggestion, index) => {
        const isActive = index === activeIndex
        return (
          <button
            id={`${listboxId}-option-${index}`}
            className={`search-result-row${isActive ? ' is-active' : ''}`}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={isActive}
            data-active={isActive}
            key={suggestion.id}
            onMouseEnter={() => onActiveIndexChange(index)}
            onClick={() => onSelect(suggestion)}
          >
            <SuggestionIcon suggestion={suggestion} />
            <span className="search-result-copy">
              <strong>{suggestion.title}</strong>
              <span>{suggestion.description}</span>
            </span>
            <span className="search-result-action">
              <span>{t(getSuggestionActionKey(suggestion.kind))}</span>
              <SuggestionTail suggestion={suggestion} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
