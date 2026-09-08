import type { TFunction } from 'i18next'

import { getRecentBookmarks, searchBookmarks } from '../bookmarks/model.ts'
import type { BookmarkMatch } from '../bookmarks/model.ts'
import { filterOpenTabs } from '../tabs/model.ts'
import type { OpenTab, OpenTabWindow } from '../tabs/model.ts'
import type { TopSite } from '../top-sites/chrome-top-sites.ts'
import { normalizeCapturedUrl } from '../capture/model.ts'

const BOOKMARK_RESULT_LIMIT = 8
const TAB_RESULT_LIMIT = 6
const DEFAULT_RESULT_LIMIT = 7
const DEFAULT_TOP_SITE_RESULT_LIMIT = 3
const SUPPORTED_EXPLICIT_URL = /^(?:https?:\/\/|chrome:\/\/|file:\/\/)/i
const LOCAL_URL =
  /^(?:localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?#].*)?$/i
const DOMAIN_URL =
  /^(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+[\p{L}]{2,}(?::\d+)?(?:[/?#].*)?$/iu

export type OmniboxSuggestion =
  | {
      id: string
      kind: 'navigate' | 'bookmark' | 'top-site'
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
  topSites = [],
  hiddenTopSiteUrls = [],
  t,
}: {
  bookmarks: Array<BookmarkMatch>
  openTabWindows: Array<OpenTabWindow>
  rawQuery: string
  topSites?: Array<TopSite>
  hiddenTopSiteUrls?: Array<string>
  t: TFunction<'translation'>
}) {
  const query = rawQuery.trim()
  const hidden = new Set(hiddenTopSiteUrls.map(normalizeCapturedUrl))
  const seenTopSites = new Set<string>()
  const topSiteSuggestions = topSites
    .filter((site) => {
      const key = normalizeCapturedUrl(site.url)
      if (hidden.has(key) || seenTopSites.has(key)) return false
      seenTopSites.add(key)
      return `${site.title} ${site.url}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())
    })
    .map((site) => ({
      id: `top-site:${site.url}`,
      kind: 'top-site' as const,
      title: site.title,
      description: site.hostname,
      url: site.url,
    }))
  if (!query) {
    const frequent = topSiteSuggestions.slice(0, DEFAULT_TOP_SITE_RESULT_LIMIT)
    const frequentUrls = new Set(
      frequent.map((site) => normalizeCapturedUrl(site.url)),
    )
    const recent = getRecentBookmarks(bookmarks)
      .filter(
        ({ node }) => !frequentUrls.has(normalizeCapturedUrl(node.url ?? '')),
      )
      .slice(0, DEFAULT_RESULT_LIMIT - frequent.length)
      .map(({ node, path }): OmniboxSuggestion => ({
        id: `bookmark:${node.id}`,
        kind: 'bookmark',
        title: node.title || getHostname(node.url ?? ''),
        description: path.join(' / ') || getHostname(node.url ?? ''),
        url: node.url ?? '',
      }))
    return [...frequent, ...recent]
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
        : 'url' in suggestion
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
  const existingUrls = new Set([
    ...bookmarkSuggestions.flatMap((item) =>
      'url' in item ? [normalizeCapturedUrl(item.url)] : [],
    ),
    ...tabSuggestions.flatMap((item) =>
      item.kind === 'tab' ? [normalizeCapturedUrl(item.tab.url)] : [],
    ),
  ])
  const uniqueTopSites = topSiteSuggestions.filter(
    (item) => !existingUrls.has(normalizeCapturedUrl(item.url)),
  )
  const sourcePriority = (item: OmniboxSuggestion) =>
    item.kind === 'tab' ? 2 : item.kind === 'bookmark' ? 1 : 0
  const localSuggestions = [
    ...bookmarkSuggestions,
    ...tabSuggestions,
    ...uniqueTopSites,
  ]
    .sort(
      (a, b) =>
        matchScore(b) - matchScore(a) || sourcePriority(b) - sourcePriority(a),
    )
    .slice(0, BOOKMARK_RESULT_LIMIT + TAB_RESULT_LIMIT)

  // Explicit addresses keep direct navigation as the default action.
  return navigableUrl
    ? [primarySuggestion, ...localSuggestions]
    : [...localSuggestions, primarySuggestion]
}
