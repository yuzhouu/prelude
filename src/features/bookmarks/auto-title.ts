export const AUTO_TITLE_STORAGE_PREFIX = 'bookmark-auto-title:'
export const AUTO_TITLE_TAB_SESSION_PREFIX = 'bookmark-auto-title-tab:'

export interface AutoTitleMarker {
  bookmarkId: string
  fallbackTitle: string
  url: string
}

export interface AutoTitleNavigation {
  sourceUrl: string
  startedAt: number
}

export interface AutoTitleTabCandidate {
  active?: boolean
  lastAccessed?: number
  title?: string
  url?: string
}

export function getAutoTitleStorageKey(bookmarkId: string) {
  return `${AUTO_TITLE_STORAGE_PREFIX}${bookmarkId}`
}

export function getAutoTitleTabSessionKey(tabId: number) {
  return `${AUTO_TITLE_TAB_SESSION_PREFIX}${tabId}`
}

export function normalizeAutoTitleUrl(value: string) {
  try {
    const url = new URL(value)
    url.hash = ''
    return url.toString()
  } catch {
    return undefined
  }
}

export function parseAutoTitleMarker(
  value: unknown,
): AutoTitleMarker | undefined {
  if (!value || typeof value !== 'object') return undefined

  const marker = value as Partial<AutoTitleMarker>
  if (
    typeof marker.bookmarkId !== 'string' ||
    typeof marker.fallbackTitle !== 'string' ||
    typeof marker.url !== 'string'
  ) {
    return undefined
  }

  const normalizedUrl = normalizeAutoTitleUrl(marker.url)
  if (!normalizedUrl) return undefined

  return {
    bookmarkId: marker.bookmarkId,
    fallbackTitle: marker.fallbackTitle,
    url: normalizedUrl,
  }
}

export function parseAutoTitleNavigation(
  value: unknown,
): AutoTitleNavigation | undefined {
  if (!value || typeof value !== 'object') return undefined

  const navigation = value as Partial<AutoTitleNavigation>
  if (
    typeof navigation.sourceUrl !== 'string' ||
    typeof navigation.startedAt !== 'number'
  ) {
    return undefined
  }

  const sourceUrl = normalizeAutoTitleUrl(navigation.sourceUrl)
  if (!sourceUrl) return undefined

  return { sourceUrl, startedAt: navigation.startedAt }
}

export function getUsableAutoTitle({
  fallbackTitle,
  pageTitle,
  pageUrl,
}: {
  fallbackTitle: string
  pageTitle: string | undefined
  pageUrl: string | undefined
}) {
  const title = pageTitle?.trim()
  if (!title || title === fallbackTitle) return undefined

  const normalizedPageUrl = pageUrl ? normalizeAutoTitleUrl(pageUrl) : undefined
  const normalizedTitle = normalizeAutoTitleUrl(title)
  if (normalizedPageUrl && normalizedTitle === normalizedPageUrl) {
    return undefined
  }

  return title
}

export function getOpenTabAutoTitle({
  fallbackTitle,
  pageUrl,
  tabs,
}: {
  fallbackTitle: string
  pageUrl: string
  tabs: Array<AutoTitleTabCandidate>
}) {
  const normalizedPageUrl = normalizeAutoTitleUrl(pageUrl)
  if (!normalizedPageUrl) return undefined

  let bestMatch:
    | {
        active: boolean
        lastAccessed: number
        title: string
      }
    | undefined

  for (const tab of tabs) {
    if (normalizeAutoTitleUrl(tab.url ?? '') !== normalizedPageUrl) continue

    const title = getUsableAutoTitle({
      fallbackTitle,
      pageTitle: tab.title,
      pageUrl: tab.url,
    })
    if (!title) continue

    const active = tab.active === true
    const lastAccessed = tab.lastAccessed ?? 0
    if (
      !bestMatch ||
      (active && !bestMatch.active) ||
      (active === bestMatch.active && lastAccessed > bestMatch.lastAccessed)
    ) {
      bestMatch = { active, lastAccessed, title }
    }
  }

  return bestMatch?.title
}
