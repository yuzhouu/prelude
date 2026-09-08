import {
  ArrowUpRight,
  CornerDownLeft,
  Globe2,
  PanelsTopLeft,
  Search,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { BookmarkFavicon } from '../bookmarks/bookmark-favicon'
import type { OmniboxSuggestion } from './omnibox-model'

function SuggestionIcon({ suggestion }: { suggestion: OmniboxSuggestion }) {
  if (suggestion.kind === 'bookmark' || suggestion.kind === 'top-site') {
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
    'top-site': 'search.actionNavigate',
    tab: 'search.actionTab',
    search: 'search.actionSearch',
    navigate: 'search.actionNavigate',
  } as const satisfies Record<OmniboxSuggestion['kind'], `search.${string}`>
  return keys[kind]
}

function SuggestionTail({ suggestion }: { suggestion: OmniboxSuggestion }) {
  if (suggestion.kind === 'tab') return <PanelsTopLeft aria-hidden="true" />
  if (suggestion.kind === 'bookmark' || suggestion.kind === 'top-site')
    return <ArrowUpRight aria-hidden="true" />
  return <CornerDownLeft aria-hidden="true" />
}

export function OmniboxResults({
  activeIndex,
  listboxId,
  onActiveIndexChange,
  onSelect,
  suggestions,
  showSections = false,
  onHideTopSite,
}: {
  activeIndex: number
  listboxId: string
  onActiveIndexChange: (index: number) => void
  onSelect: (suggestion: OmniboxSuggestion) => void
  suggestions: Array<OmniboxSuggestion>
  showSections?: boolean
  onHideTopSite: (url: string) => void
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
      className={`omnibox-results${showSections ? ' is-default' : ''}`}
      role="grid"
      aria-label={t('search.suggestions')}
    >
      {suggestions.map((suggestion, index) => {
        const isActive = index === activeIndex
        const startsSection =
          showSections && suggestion.kind !== suggestions[index - 1]?.kind
        return (
          <Fragment key={suggestion.id}>
            {startsSection ? (
              <div role="row" className="search-section-label">
                <span role="columnheader">
                  {t(
                    suggestion.kind === 'top-site'
                      ? 'topSites.title'
                      : 'search.recentTitle',
                  )}
                </span>
              </div>
            ) : null}
            <div
              id={`${listboxId}-option-${index}`}
              className={`search-result-item${suggestion.kind === 'top-site' ? ' is-top-site' : ''}${isActive ? ' is-active' : ''}`}
              role="row"
              aria-selected={isActive}
              data-active={isActive}
              onMouseEnter={() => onActiveIndexChange(index)}
            >
              <div role="gridcell" className="search-result-main-cell">
                <button
                  className={`search-result-row${isActive ? ' is-active' : ''}`}
                  type="button"
                  tabIndex={-1}
                  onClick={() => onSelect(suggestion)}
                >
                  <SuggestionIcon suggestion={suggestion} />
                  <span className="search-result-copy">
                    <strong>{suggestion.title}</strong>
                    <span>{suggestion.description}</span>
                  </span>
                  <span className="search-result-action">
                    <span>
                      {t(
                        suggestion.kind === 'top-site'
                          ? 'topSites.title'
                          : getSuggestionActionKey(suggestion.kind),
                      )}
                    </span>
                    <SuggestionTail suggestion={suggestion} />
                  </span>
                </button>
              </div>
              <div role="gridcell" className="search-result-controls">
                {suggestion.kind === 'top-site' ? (
                  <button
                    className="search-result-hide"
                    type="button"
                    aria-label={t('topSites.hide', { title: suggestion.title })}
                    title={t('topSites.hide', { title: suggestion.title })}
                    onClick={() => onHideTopSite(suggestion.url)}
                  >
                    <X aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
