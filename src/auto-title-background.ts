import {
  AUTO_TITLE_STORAGE_PREFIX,
  getAutoTitleStorageKey,
  getAutoTitleTabSessionKey,
  getUsableAutoTitle,
  normalizeAutoTitleUrl,
  parseAutoTitleMarker,
  parseAutoTitleNavigation,
} from './features/bookmarks/auto-title'
import type { AutoTitleMarker } from './features/bookmarks/auto-title'
import type { BookmarkNode } from './features/bookmarks/model'

interface StorageArea {
  get: (
    keys?: string | Array<string> | Record<string, unknown> | null,
  ) => Promise<Record<string, unknown>>
  remove: (keys: string | Array<string>) => Promise<void>
  set: (items: Record<string, unknown>) => Promise<void>
}

interface ChromeTab {
  status?: 'loading' | 'complete'
  title?: string
  url?: string
}

interface ChromeApi {
  bookmarks: {
    get: (idOrIdList: string | Array<string>) => Promise<Array<BookmarkNode>>
    update: (id: string, changes: { title: string }) => Promise<BookmarkNode>
    onChanged: {
      addListener: (
        callback: (
          id: string,
          changeInfo: { title?: string; url?: string },
        ) => void,
      ) => void
    }
    onRemoved: {
      addListener: (
        callback: (id: string, removeInfo: { node: BookmarkNode }) => void,
      ) => void
    }
  }
  storage: {
    local: StorageArea
    session: StorageArea
  }
  tabs: {
    onRemoved: {
      addListener: (callback: (tabId: number) => void) => void
    }
    onUpdated: {
      addListener: (
        callback: (
          tabId: number,
          changeInfo: { status?: 'loading' | 'complete'; title?: string },
          tab: ChromeTab,
        ) => void,
      ) => void
    }
  }
  webNavigation: {
    onBeforeNavigate: {
      addListener: (
        callback: (details: {
          frameId: number
          tabId: number
          url: string
        }) => void,
      ) => void
    }
  }
}

const chromeApi = (
  globalThis as typeof globalThis & {
    chrome: ChromeApi
  }
).chrome
const MAX_NAVIGATION_AGE_MS = 5 * 60_000

async function getAutoTitleMarkers() {
  const storedValues = await chromeApi.storage.local.get(null)
  const markers: Array<AutoTitleMarker> = []

  for (const [key, value] of Object.entries(storedValues)) {
    if (!key.startsWith(AUTO_TITLE_STORAGE_PREFIX)) continue

    const marker = parseAutoTitleMarker(value)
    if (marker) markers.push(marker)
  }

  return markers
}

async function getBookmark(id: string) {
  try {
    return (await chromeApi.bookmarks.get(id))[0]
  } catch {
    return undefined
  }
}

async function resolveMarkerTitle(marker: AutoTitleMarker, tab: ChromeTab) {
  const bookmark = await getBookmark(marker.bookmarkId)
  const bookmarkUrl = bookmark?.url
    ? normalizeAutoTitleUrl(bookmark.url)
    : undefined

  if (
    !bookmark ||
    bookmarkUrl !== marker.url ||
    bookmark.title !== marker.fallbackTitle
  ) {
    await chromeApi.storage.local.remove(
      getAutoTitleStorageKey(marker.bookmarkId),
    )
    return true
  }

  const title = getUsableAutoTitle({
    fallbackTitle: marker.fallbackTitle,
    pageTitle: tab.title,
    pageUrl: tab.url,
  })
  if (!title) return false

  try {
    await chromeApi.bookmarks.update(marker.bookmarkId, { title })
    await chromeApi.storage.local.remove(
      getAutoTitleStorageKey(marker.bookmarkId),
    )
    return true
  } catch {
    return false
  }
}

async function resolveAutoTitlesForTab(tabId: number, tab: ChromeTab) {
  const sessionKey = getAutoTitleTabSessionKey(tabId)
  const [storedNavigation, markers] = await Promise.all([
    chromeApi.storage.session.get(sessionKey),
    getAutoTitleMarkers(),
  ])
  const parsedNavigation = parseAutoTitleNavigation(
    storedNavigation[sessionKey],
  )
  const navigation =
    parsedNavigation &&
    Date.now() - parsedNavigation.startedAt <= MAX_NAVIGATION_AGE_MS
      ? parsedNavigation
      : undefined
  const currentUrl = tab.url ? normalizeAutoTitleUrl(tab.url) : undefined
  const candidateUrls = new Set(
    [navigation?.sourceUrl, currentUrl].filter(
      (url): url is string => url !== undefined,
    ),
  )
  const candidates = markers.filter((marker) => candidateUrls.has(marker.url))

  if (!candidates.length) {
    await chromeApi.storage.session.remove(sessionKey)
    return
  }

  const results = await Promise.all(
    candidates.map((marker) => resolveMarkerTitle(marker, tab)),
  )
  if (results.every(Boolean)) {
    await chromeApi.storage.session.remove(sessionKey)
  }
}

function collectBookmarkIds(node: BookmarkNode, ids: Array<string>) {
  ids.push(node.id)
  node.children?.forEach((child) => collectBookmarkIds(child, ids))
}

chromeApi.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0 || details.tabId < 0) return

  const sourceUrl = normalizeAutoTitleUrl(details.url)
  if (!sourceUrl) return

  void chromeApi.storage.session.set({
    [getAutoTitleTabSessionKey(details.tabId)]: {
      sourceUrl,
      startedAt: Date.now(),
    },
  })
})

chromeApi.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && tab.status !== 'complete') return
  void resolveAutoTitlesForTab(tabId, tab)
})

chromeApi.tabs.onRemoved.addListener((tabId) => {
  void chromeApi.storage.session.remove(getAutoTitleTabSessionKey(tabId))
})

chromeApi.bookmarks.onChanged.addListener((id, changeInfo) => {
  if (changeInfo.title === undefined && changeInfo.url === undefined) return
  void chromeApi.storage.local.remove(getAutoTitleStorageKey(id))
})

chromeApi.bookmarks.onRemoved.addListener((id, removeInfo) => {
  const removedIds: Array<string> = []
  collectBookmarkIds(removeInfo.node, removedIds)
  if (!removedIds.includes(id)) removedIds.push(id)

  void chromeApi.storage.local.remove(removedIds.map(getAutoTitleStorageKey))
})
