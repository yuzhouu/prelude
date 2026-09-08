import type { TFunction } from 'i18next'

import { getRecentBookmarks, searchBookmarks } from '../bookmarks/model.ts'
import type { BookmarkMatch } from '../bookmarks/model.ts'
import { filterOpenTabs } from '../tabs/model.ts'
import type { OpenTab, OpenTabWindow } from '../tabs/model.ts'

const BOOKMARK_RESULT_LIMIT = 8
const TAB_RESULT_LIMIT = 6
const SUPPORTED_EXPLICIT_URL = /^(?:https?:\/\/|chrome:\/\/|file:\/\/)/i
const LOCAL_URL =
  /^(?:localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?#].*)?$/i
const DOMAIN_URL =
  /^(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+[\p{L}]{2,}(?::\d+)?(?:[/?#].*)?$/iu

export type OmniboxSuggestion =
  | {
      id: string
      kind: 'navigate' | 'bookmark'
      title: string
      description: string
      url: string
    }
  | {
      id: string
      kind: 'search'
      title: string
      description: string
      query: string
    }
  | {
      id: string
      kind: 'tab'
      title: string
      description: string
      tab: OpenTab
    }

export function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function getNavigableUrl(value: string) {
  const query = value.trim()
  if (!query || /\s/.test(query)) return undefined

  if (SUPPORTED_EXPLICIT_URL.test(query)) {
    try {
      return new URL(query).toString()
    } catch {
      return undefined
    }
  }

  if (LOCAL_URL.test(query)) return `http://${query}`
  if (DOMAIN_URL.test(query)) return `https://${query}`
  return undefined
}

export function buildOmniboxSuggestions({
  bookmarks,
  openTabWindows,
  rawQuery,
  t,
}: {
  bookmarks: Array<BookmarkMatch>
  openTabWindows: Array<OpenTabWindow>
  rawQuery: string
  t: TFunction<'translation'>
}) {
  const query = rawQuery.trim()
  if (!query) {
    return getRecentBookmarks(bookmarks)
      .slice(0, 4)
      .map(({ node, path }): OmniboxSuggestion => ({
        id: `bookmark:${node.id}`,
        kind: 'bookmark',
        title: node.title || getHostname(node.url ?? ''),
        description: path.join(' / ') || getHostname(node.url ?? ''),
        url: node.url ?? '',
      }))
  }

  const navigableUrl = getNavigableUrl(query)
  const primarySuggestion: OmniboxSuggestion = navigableUrl
    ? {
        id: 'primary:navigate',
        kind: 'navigate',
        title: navigableUrl,
        description: t('search.visitUrl'),
        url: navigableUrl,
      }
    : {
        id: 'primary:search',
        kind: 'search',
        title: t('search.searchFor', { query }),
        description: t('search.defaultProvider'),
        query,
      }

  const bookmarkSuggestions: Array<OmniboxSuggestion> = searchBookmarks(
    bookmarks,
    query,
  ).map(({ node, path }) => {
    const url = node.url ?? '#'
    return {
      id: `bookmark:${node.id}`,
      kind: 'bookmark',
      title: node.title || getHostname(url),
      description: path.join(' / ') || getHostname(url),
      url,
    }
  })

  const tabSuggestions: Array<OmniboxSuggestion> = filterOpenTabs(
    openTabWindows,
    query,
  )
    .flatMap((window) => window.tabs)
    .map((tab) => ({
      id: `tab:${tab.id}`,
      kind: 'tab',
      title: tab.title || getHostname(tab.url),
      description: getHostname(tab.url),
      tab,
    }))

  const normalizedQuery = query.toLocaleLowerCase()
  const matchScore = (suggestion: OmniboxSuggestion) => {
    const title = suggestion.title.toLocaleLowerCase()
    const url =
      suggestion.kind === 'tab'
        ? suggestion.tab.url
        : suggestion.kind === 'bookmark'
          ? suggestion.url
          : ''
    const host = getHostname(url).toLocaleLowerCase()
    if (title === normalizedQuery || host === normalizedQuery) return 3
    if (
      title.startsWith(normalizedQuery) ||
      host.split('.')[0] === normalizedQuery
    )
      return 2
    return 1
  }
  // Rank before limiting so an exact match later in the tree is not discarded.
  const localSuggestions = [...bookmarkSuggestions, ...tabSuggestions]
    .sort(
      (a, b) =>
        matchScore(b) - matchScore(a) ||
        Number(b.kind === 'tab') - Number(a.kind === 'tab'),
    )
    .slice(0, BOOKMARK_RESULT_LIMIT + TAB_RESULT_LIMIT)

  // Explicit addresses keep direct navigation as the default action.
  return navigableUrl
    ? [primarySuggestion, ...localSuggestions]
    : [...localSuggestions, primarySuggestion]
}
