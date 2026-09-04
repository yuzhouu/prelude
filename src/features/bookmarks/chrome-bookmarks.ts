import { useEffect, useState } from 'react'

import { i18n } from '../../i18n'
import { READ_LATER_FOLDER_STORAGE_KEY } from '../capture/model'
import {
  getAutoTitleStorageKey,
  getOpenTabAutoTitle,
  normalizeAutoTitleUrl,
} from './auto-title'
import { moveBookmarkNodeToPosition } from './bookmark-drag'
import { demoBookmarkTree } from './demo-data'
import { findNode } from './model'
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
    move: (
      id: string,
      destination: { index?: number; parentId?: string },
    ) => Promise<BookmarkNode>
    remove: (id: string) => Promise<void>
    removeTree: (id: string) => Promise<void>
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

const DEFAULT_BOOKMARK_CONTAINER_TITLES = ['序幕', 'Prelude'] as const

const LEGACY_DEFAULT_BOOKMARK_CONTAINER_TITLES = [
  '开篇',
  '今巡',
  '书签 · 新标签页',
] as const

let defaultFolderCreationPromise: Promise<BookmarkNode> | undefined
let bookmarkDndDemoApi: ChromeApi | undefined

interface BookmarkDndDemoDiagnostics {
  moveCalls: Array<{
    id: string
    index: number
    parentId: string
  }>
}

function cloneBookmarkTree(tree: ReadonlyArray<BookmarkNode>) {
  return structuredClone(tree) as Array<BookmarkNode>
}

function updateBookmarkTreeNode(
  nodes: ReadonlyArray<BookmarkNode>,
  id: string,
  update: (node: BookmarkNode) => BookmarkNode | null,
): { changed: boolean; nodes: Array<BookmarkNode> } {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node.id === id) {
      const updated = update(node)
      return {
        changed: true,
        nodes: updated
          ? [...nodes.slice(0, index), updated, ...nodes.slice(index + 1)]
          : [...nodes.slice(0, index), ...nodes.slice(index + 1)],
      }
    }

    if (!node.children) continue
    const children = updateBookmarkTreeNode(node.children, id, update)
    if (!children.changed) continue

    const nextNodes = [...nodes]
    nextNodes[index] = { ...node, children: children.nodes }
    return { changed: true, nodes: nextNodes }
  }

  return { changed: false, nodes: [...nodes] }
}

function createBookmarkDndDemoApi() {
  let tree = cloneBookmarkTree(demoBookmarkTree)
  let nextId = 1
  const listeners = new Set<() => void>()
  const moveCalls: BookmarkDndDemoDiagnostics['moveCalls'] = []
  const event: ChromeEvent = {
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
  }
  const notify = () => queueMicrotask(() => listeners.forEach((run) => run()))
  const diagnostics: BookmarkDndDemoDiagnostics = { moveCalls }

  const bookmarks: NonNullable<ChromeApi['bookmarks']> = {
    create: async ({ parentId, title, url }) => {
      const node: BookmarkNode = {
        id: `bookmark-dnd-demo-${nextId++}`,
        title,
        ...(url ? { url } : { children: [] }),
      }
      if (!parentId) throw new Error('The demo requires a parent folder.')

      const result = updateBookmarkTreeNode(tree, parentId, (parent) => ({
        ...parent,
        children: [...(parent.children ?? []), node],
      }))
      if (!result.changed) throw new Error('Parent folder not found.')
      tree = result.nodes
      notify()
      return structuredClone(node)
    },
    getTree: async () => cloneBookmarkTree(tree),
    move: async (id, destination) => {
      if (
        destination.parentId === undefined ||
        destination.index === undefined
      ) {
        throw new Error('The demo requires an exact destination.')
      }

      moveCalls.push({
        id,
        index: destination.index,
        parentId: destination.parentId,
      })
      globalThis.document.documentElement.dataset.bookmarkDndMoveCalls = String(
        moveCalls.length,
      )
      globalThis.document.documentElement.dataset.bookmarkDndLastMove = [
        id,
        destination.parentId,
        destination.index,
      ].join(':')
      if (
        new URLSearchParams(globalThis.location.search).has('bookmark-dnd-fail')
      ) {
        throw new Error('Intentional bookmark move failure.')
      }

      const nextTree = moveBookmarkNodeToPosition({
        draggedId: id,
        position: {
          index: destination.index,
          parentId: destination.parentId,
        },
        roots: tree,
      })
      if (!nextTree) throw new Error('Invalid bookmark destination.')

      tree = nextTree
      const moved = findNode(tree, id)
      if (!moved) throw new Error('Moved bookmark not found.')
      notify()
      return structuredClone(moved)
    },
    remove: async (id) => {
      const result = updateBookmarkTreeNode(tree, id, () => null)
      if (!result.changed) throw new Error('Bookmark not found.')
      tree = result.nodes
      notify()
    },
    removeTree: async (id) => {
      const result = updateBookmarkTreeNode(tree, id, () => null)
      if (!result.changed) throw new Error('Folder not found.')
      tree = result.nodes
      notify()
    },
    update: async (id, changes) => {
      let updated: BookmarkNode | undefined
      const result = updateBookmarkTreeNode(tree, id, (node) => {
        updated = { ...node, ...changes }
        return updated
      })
      if (!result.changed || !updated) throw new Error('Bookmark not found.')
      tree = result.nodes
      notify()
      return structuredClone(updated)
    },
    onChanged: event,
    onChildrenReordered: event,
    onCreated: event,
    onMoved: event,
    onRemoved: event,
  }

  ;(
    globalThis as typeof globalThis & {
      __PRELUDE_BOOKMARK_DND_DEMO__?: BookmarkDndDemoDiagnostics
    }
  ).__PRELUDE_BOOKMARK_DND_DEMO__ = diagnostics
  globalThis.document.documentElement.dataset.bookmarkDndDemo = 'true'
  globalThis.document.documentElement.dataset.bookmarkDndMoveCalls = '0'

  return { bookmarks } satisfies ChromeApi
}

function getChromeApi() {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeApi })
    .chrome
  if (chromeApi?.bookmarks) return chromeApi

  if (
    import.meta.env.DEV &&
    new URLSearchParams(globalThis.location.search).has('bookmark-dnd-demo')
  ) {
    bookmarkDndDemoApi ??= createBookmarkDndDemoApi()
    return bookmarkDndDemoApi
  }

  return chromeApi
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
  return DEFAULT_BOOKMARK_CONTAINER_TITLES.map((title) =>
    findFolderByTitle(nodes, title),
  ).find((container) => container !== undefined)
}

export function getDefaultBookmarkFolderTitles() {
  return {
    container: i18n.t('defaultFolders.names.container'),
    pinned: i18n.t('defaultFolders.names.pinned'),
    readLater: i18n.t('defaultFolders.names.readLater'),
    favorites: i18n.t('defaultFolders.names.favorites'),
  }
}

async function migrateDefaultBookmarkContainerTitle(
  nodes: Array<BookmarkNode>,
  bookmarksApi: NonNullable<ChromeApi['bookmarks']>,
) {
  if (findDefaultBookmarkContainer(nodes)) return nodes

  const legacyContainer = LEGACY_DEFAULT_BOOKMARK_CONTAINER_TITLES.map(
    (title) => findFolderByTitle(nodes, title),
  ).find((container) => container !== undefined)
  if (!legacyContainer) return nodes

  await bookmarksApi.update(legacyContainer.id, {
    title: getDefaultBookmarkFolderTitles().container,
  })
  return bookmarksApi.getTree()
}

async function createFolders() {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const tree = await bookmarksApi.getTree()
  const existing = findDefaultBookmarkContainer(tree)
  if (existing) return existing

  const titles = getDefaultBookmarkFolderTitles()

  const container = await bookmarksApi.create({
    title: titles.container,
  })

  const [, readLater] = await Promise.all([
    bookmarksApi.create({
      parentId: container.id,
      title: titles.pinned,
    }),
    bookmarksApi.create({
      parentId: container.id,
      title: titles.readLater,
    }),
    bookmarksApi.create({
      parentId: container.id,
      title: titles.favorites,
    }),
  ])

  await getChromeApi()
    ?.storage?.local.set({ [READ_LATER_FOLDER_STORAGE_KEY]: readLater.id })
    .catch(() => undefined)

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

export async function deleteBookmarkFolder(id: string) {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  await bookmarksApi.removeTree(id)
}

export async function moveBookmarkNode({
  id,
  index,
  parentId,
}: {
  id: string
  index: number
  parentId: string
}) {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  return bookmarksApi.move(id, { index, parentId })
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
      void bookmarksApi
        .getTree()
        .then((nextTree) =>
          migrateDefaultBookmarkContainerTitle(nextTree, bookmarksApi),
        )
        .then((nextTree) => {
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
