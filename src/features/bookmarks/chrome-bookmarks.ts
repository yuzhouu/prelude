import { useEffect, useState } from 'react'

import { demoBookmarkTree } from './demo-data'
import type { BookmarkNode } from './model'

interface ChromeEvent {
  addListener: (callback: () => void) => void
  removeListener: (callback: () => void) => void
}

interface ChromeApi {
  bookmarks?: {
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

function getChromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
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
