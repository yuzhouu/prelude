import { useCallback, useEffect, useState } from 'react'

import { demoOpenTabWindows } from './demo-data'
import type { OpenTab, OpenTabWindow } from './model'

interface ChromeEvent {
  addListener: (callback: () => void) => void
  removeListener: (callback: () => void) => void
}

interface ChromeTab {
  id?: number
  windowId: number
  title?: string
  url?: string
  active: boolean
  pinned: boolean
  audible?: boolean
}

interface ChromeApi {
  runtime?: {
    id?: string
  }
  tabs?: {
    query: (queryInfo: Record<string, never>) => Promise<Array<ChromeTab>>
    update: (
      tabId: number,
      updateProperties: { active: boolean },
    ) => Promise<ChromeTab | undefined>
    onActivated: ChromeEvent
    onAttached: ChromeEvent
    onCreated: ChromeEvent
    onDetached: ChromeEvent
    onMoved: ChromeEvent
    onRemoved: ChromeEvent
    onUpdated: ChromeEvent
  }
  windows?: {
    getCurrent: () => Promise<{ id?: number }>
    update: (
      windowId: number,
      updateInfo: { focused: boolean },
    ) => Promise<unknown>
    onCreated: ChromeEvent
    onFocusChanged: ChromeEvent
    onRemoved: ChromeEvent
  }
}

function getChromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
}

function groupTabs(
  tabs: Array<ChromeTab>,
  currentWindowId: number | undefined,
  extensionId: string | undefined,
) {
  const windows = new Map<number, OpenTabWindow>()
  const ownUrlPrefix = extensionId
    ? `chrome-extension://${extensionId}/index.html`
    : undefined

  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url || !tab.title) continue
    if (ownUrlPrefix && tab.url.startsWith(ownUrlPrefix)) continue

    const window = windows.get(tab.windowId) ?? {
      id: tab.windowId,
      focused: tab.windowId === currentWindowId,
      tabs: [],
    }

    window.tabs.push({
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible ?? false,
    })
    windows.set(tab.windowId, window)
  }

  return [...windows.values()].sort((a, b) => {
    if (a.focused !== b.focused) return a.focused ? -1 : 1
    return a.id - b.id
  })
}

export function useOpenTabs() {
  const [windows, setWindows] =
    useState<Array<OpenTabWindow>>(demoOpenTabWindows)
  const [isChromeSource, setIsChromeSource] = useState(false)

  useEffect(() => {
    const chromeApi = getChromeApi()
    if (!chromeApi?.tabs || !chromeApi.windows) return

    const tabsApi = chromeApi.tabs
    const windowsApi = chromeApi.windows
    let active = true

    const refresh = () => {
      void Promise.all([tabsApi.query({}), windowsApi.getCurrent()]).then(
        ([tabs, currentWindow]) => {
          if (!active) return
          setWindows(groupTabs(tabs, currentWindow.id, chromeApi.runtime?.id))
          setIsChromeSource(true)
        },
      )
    }

    const events = [
      tabsApi.onActivated,
      tabsApi.onAttached,
      tabsApi.onCreated,
      tabsApi.onDetached,
      tabsApi.onMoved,
      tabsApi.onRemoved,
      tabsApi.onUpdated,
      windowsApi.onCreated,
      windowsApi.onFocusChanged,
      windowsApi.onRemoved,
    ]

    refresh()
    events.forEach((event) => event.addListener(refresh))

    return () => {
      active = false
      events.forEach((event) => event.removeListener(refresh))
    }
  }, [])

  const activateTab = useCallback((tab: OpenTab) => {
    const chromeApi = getChromeApi()
    if (chromeApi?.tabs && chromeApi.windows) {
      void Promise.all([
        chromeApi.tabs.update(tab.id, { active: true }),
        chromeApi.windows.update(tab.windowId, { focused: true }),
      ])
      return
    }

    setWindows((current) =>
      current.map((window) => ({
        ...window,
        focused: window.id === tab.windowId,
        tabs: window.tabs.map((candidate) => ({
          ...candidate,
          active:
            candidate.windowId === tab.windowId
              ? candidate.id === tab.id
              : candidate.active,
        })),
      })),
    )
  }, [])

  return { windows, isChromeSource, activateTab }
}
