import { useEffect, useState } from 'react'

import {
  getAutoTitleStorageKey,
  getOpenTabAutoTitle,
  normalizeAutoTitleUrl,
} from './auto-title'
import { demoBookmarkTree } from './demo-data'
import type { BookmarkNode } from './model'

interface ChromeEvent {
  addListener: (callback: () => void) => void
  removeListener: (callback: () => void) => void
}

interface ChromeApi {
  bookmarks?: {
    create: (details: {
      parentId?: string
      title: string
      url?: string
    }) => Promise<BookmarkNode>
    getTree: () => Promise<Array<BookmarkNode>>
    remove: (id: string) => Promise<void>
    update: (
      id: string,
      changes: { title?: string; url?: string },
    ) => Promise<BookmarkNode>
    onChanged: ChromeEvent
    onChildrenReordered: ChromeEvent
    onCreated: ChromeEvent
    onMoved: ChromeEvent
    onRemoved: ChromeEvent
  }
  runtime?: {
    id?: string
    getURL: (path: string) => string
  }
  storage?: {
    local: {
      remove: (keys: string | Array<string>) => Promise<void>
      set: (items: Record<string, unknown>) => Promise<void>
    }
  }
  tabs?: {
    create: (properties: { url: string }) => Promise<unknown>
    query: (queryInfo: Record<string, never>) => Promise<
      Array<{
        active?: boolean
        lastAccessed?: number
        title?: string
        url?: string
      }>
    >
  }
}

export const DEFAULT_BOOKMARK_CONTAINER_TITLE = '书签 · 新标签页'
export const DEFAULT_PINNED_FOLDER_TITLE = '置顶'
export const DEFAULT_READ_LATER_FOLDER_TITLE = '待读'

let defaultFolderCreationPromise: Promise<BookmarkNode> | undefined

function getChromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
}

function findFolderByTitle(
  nodes: Array<BookmarkNode>,
  title: string,
): BookmarkNode | undefined {
  for (const node of nodes) {
    if (!node.url && node.title === title) return node

    const match = node.children
      ? findFolderByTitle(node.children, title)
      : undefined
    if (match) return match
  }

  return undefined
}

export function findDefaultBookmarkContainer(nodes: Array<BookmarkNode>) {
  return findFolderByTitle(nodes, DEFAULT_BOOKMARK_CONTAINER_TITLE)
}

async function createFolders() {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const tree = await bookmarksApi.getTree()
  const existing = findDefaultBookmarkContainer(tree)
  if (existing) return existing

  const container = await bookmarksApi.create({
    title: DEFAULT_BOOKMARK_CONTAINER_TITLE,
  })

  await Promise.all([
    bookmarksApi.create({
      parentId: container.id,
      title: DEFAULT_PINNED_FOLDER_TITLE,
    }),
    bookmarksApi.create({
      parentId: container.id,
      title: DEFAULT_READ_LATER_FOLDER_TITLE,
    }),
  ])

  return container
}

export async function createDefaultBookmarkFolders() {
  defaultFolderCreationPromise ??= createFolders()

  try {
    return await defaultFolderCreationPromise
  } catch (error) {
    defaultFolderCreationPromise = undefined
    throw error
  }
}

export async function createBookmark({
  autoTitle,
  parentId,
  title,
  url,
}: {
  autoTitle: boolean
  parentId: string
  title: string
  url: string
}) {
  const chromeApi = getChromeApi()
  const bookmarksApi = chromeApi?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  let resolvedAutoTitle: string | undefined
  if (autoTitle && chromeApi.tabs) {
    resolvedAutoTitle = await chromeApi.tabs
      .query({})
      .then((tabs) =>
        getOpenTabAutoTitle({ fallbackTitle: title, pageUrl: url, tabs }),
      )
      .catch(() => undefined)
  }

  const bookmark = await bookmarksApi.create({
    parentId,
    title: resolvedAutoTitle ?? title,
    url,
  })

  if (autoTitle && !resolvedAutoTitle) {
    const normalizedUrl = normalizeAutoTitleUrl(url)
    const storageApi = chromeApi.storage

    if (normalizedUrl && storageApi) {
      await storageApi.local
        .set({
          [getAutoTitleStorageKey(bookmark.id)]: {
            bookmarkId: bookmark.id,
            fallbackTitle: title,
            url: normalizedUrl,
          },
        })
        .catch(() => undefined)
    }
  }

  return bookmark
}

export async function createBookmarkFolder({
  parentId,
  title,
}: {
  parentId: string
  title: string
}) {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  return bookmarksApi.create({ parentId, title })
}

export async function updateBookmark({
  id,
  title,
  url,
}: {
  id: string
  title: string
  url: string
}) {
  const chromeApi = getChromeApi()
  const bookmarksApi = chromeApi?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const bookmark = await bookmarksApi.update(id, { title, url })
  await chromeApi.storage?.local
    .remove(getAutoTitleStorageKey(id))
    .catch(() => undefined)
  return bookmark
}

export async function deleteBookmark(id: string) {
  const chromeApi = getChromeApi()
  const bookmarksApi = chromeApi?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  await bookmarksApi.remove(id)
  await chromeApi.storage?.local
    .remove(getAutoTitleStorageKey(id))
    .catch(() => undefined)
}

export function useBookmarkTree() {
  const [tree, setTree] = useState<Array<BookmarkNode>>(demoBookmarkTree)
  const [isChromeSource, setIsChromeSource] = useState(false)

  useEffect(() => {
    const chromeApi = getChromeApi()
    if (!chromeApi?.bookmarks) return

    const bookmarksApi = chromeApi.bookmarks
    let active = true

    const refresh = () => {
      void bookmarksApi.getTree().then((nextTree) => {
        if (!active) return
        setTree(nextTree)
        setIsChromeSource(true)
      })
    }

    const events = [
      bookmarksApi.onChanged,
      bookmarksApi.onChildrenReordered,
      bookmarksApi.onCreated,
      bookmarksApi.onMoved,
      bookmarksApi.onRemoved,
    ]

    refresh()
    events.forEach((event) => event.addListener(refresh))

    return () => {
      active = false
      events.forEach((event) => event.removeListener(refresh))
    }
  }, [])

  return { tree, isChromeSource }
}

export function getFaviconUrl(pageUrl: string) {
  const chromeApi = getChromeApi()
  if (!chromeApi?.runtime?.id) return undefined

  const faviconUrl = new URL(chromeApi.runtime.getURL('/_favicon/'))
  faviconUrl.searchParams.set('pageUrl', pageUrl)
  faviconUrl.searchParams.set('size', '32')
  return faviconUrl.toString()
}

export function openBookmarkManager() {
  const chromeApi = getChromeApi()
  if (chromeApi?.tabs) {
    void chromeApi.tabs.create({ url: 'chrome://bookmarks/' })
    return
  }

  window.location.assign('chrome://bookmarks/')
}
