import { useEffect, useState } from 'react'

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
  tabs?: {
    create: (properties: { url: string }) => Promise<unknown>
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

export function hasDefaultBookmarkContainer(nodes: Array<BookmarkNode>) {
  return Boolean(findFolderByTitle(nodes, DEFAULT_BOOKMARK_CONTAINER_TITLE))
}

async function createFolders() {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const tree = await bookmarksApi.getTree()
  const existing = findFolderByTitle(tree, DEFAULT_BOOKMARK_CONTAINER_TITLE)
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
  parentId,
  title,
  url,
}: {
  parentId: string
  title: string
  url: string
}) {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  return bookmarksApi.create({ parentId, title, url })
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
