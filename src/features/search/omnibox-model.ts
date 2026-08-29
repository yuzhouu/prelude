import type { TFunction } from 'i18next'

import { searchBookmarks } from '../bookmarks/model'
import type { BookmarkMatch } from '../bookmarks/model'
import { filterOpenTabs } from '../tabs/model'
import type { OpenTab, OpenTabWindow } from '../tabs/model'

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
  if (!query) return []

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
  )
    .slice(0, BOOKMARK_RESULT_LIMIT)
    .map(({ node, path }) => {
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
    .slice(0, TAB_RESULT_LIMIT)
    .map((tab) => ({
      id: `tab:${tab.id}`,
      kind: 'tab',
      title: tab.title || getHostname(tab.url),
      description: getHostname(tab.url),
      tab,
    }))

  return [primarySuggestion, ...bookmarkSuggestions, ...tabSuggestions]
}
