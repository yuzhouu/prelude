import { useCallback, useEffect, useState } from 'react'

import { demoOpenTabWindows } from './demo-data'
import type { OpenTab, OpenTabMoveDestination, OpenTabWindow } from './model'

interface ChromeEvent {
  addListener: (callback: () => void) => void
  removeListener: (callback: () => void) => void
}

interface ChromeTab {
  id?: number
  windowId: number
  index: number
  groupId: number
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
    query: (queryInfo: { windowType: 'normal' }) => Promise<Array<ChromeTab>>
    update: (
      tabId: number,
      updateProperties: { active: boolean },
    ) => Promise<ChromeTab | undefined>
    remove: (tabId: number) => Promise<void>
    move: (
      tabId: number,
      moveProperties: { index: number; windowId: number },
    ) => Promise<ChromeTab | Array<ChromeTab>>
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
      nativeIndex: tab.index,
      groupId: tab.groupId,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible ?? false,
    })
    windows.set(tab.windowId, window)
  }

  windows.forEach((window) => {
    window.tabs.sort((a, b) => a.nativeIndex - b.nativeIndex)
  })

  return [...windows.values()].sort((a, b) => {
    if (a.focused !== b.focused) return a.focused ? -1 : 1
    return a.id - b.id
  })
}

export function useOpenTabs() {
  const [windows, setWindows] =
    useState<Array<OpenTabWindow>>(demoOpenTabWindows)
  const [isChromeSource, setIsChromeSource] = useState(false)
  const [isTabSourceReady, setIsTabSourceReady] = useState(false)

  useEffect(() => {
    const chromeApi = getChromeApi()
    if (!chromeApi?.tabs || !chromeApi.windows) {
      setIsTabSourceReady(true)
      return
    }

    const tabsApi = chromeApi.tabs
    const windowsApi = chromeApi.windows
    let active = true

    const refresh = () => {
      void Promise.all([
        tabsApi.query({ windowType: 'normal' }),
        windowsApi.getCurrent(),
      ]).then(([tabs, currentWindow]) => {
        if (!active) return
        setWindows(groupTabs(tabs, currentWindow.id, chromeApi.runtime?.id))
        setIsChromeSource(true)
        setIsTabSourceReady(true)
      })
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

  const closeTab = useCallback(async (tab: OpenTab) => {
    const tabsApi = getChromeApi()?.tabs
    if (!tabsApi) throw new Error('Chrome tabs API is unavailable')

    await tabsApi.remove(tab.id)
    setWindows((current) =>
      current.flatMap((window) => {
        const tabs = window.tabs.filter((candidate) => candidate.id !== tab.id)
        return tabs.length > 0 ? [{ ...window, tabs }] : []
      }),
    )
  }, [])

  const moveTab = useCallback(
    async (tab: OpenTab, destination: OpenTabMoveDestination) => {
      const tabsApi = getChromeApi()?.tabs
      if (!tabsApi) {
        if (!import.meta.env.DEV) {
          throw new Error('Chrome tabs API is unavailable')
        }

        setWindows((current) => {
          const sourceWindow = current.find((candidate) =>
            candidate.tabs.some((candidateTab) => candidateTab.id === tab.id),
          )
          const destinationWindow = current.find(
            (candidate) => candidate.id === destination.windowId,
          )
          const source = sourceWindow?.tabs.find(
            (candidate) => candidate.id === tab.id,
          )
          if (!sourceWindow || !destinationWindow || !source) return current

          const isCrossWindow = sourceWindow.id !== destinationWindow.id
          const sourceTabIndex = sourceWindow.tabs.findIndex(
            (candidate) => candidate.id === tab.id,
          )
          let sourceTabs = sourceWindow.tabs.filter(
            (candidate) => candidate.id !== tab.id,
          )
          if (isCrossWindow && source.active && sourceTabs.length) {
            const nextActiveIndex = Math.min(
              sourceTabIndex,
              sourceTabs.length - 1,
            )
            sourceTabs = sourceTabs.map((candidate, index) => ({
              ...candidate,
              active: index === nextActiveIndex,
            }))
          }

          const destinationTabs = (
            sourceWindow.id === destinationWindow.id
              ? sourceTabs
              : destinationWindow.tabs
          ).map((candidate) =>
            isCrossWindow && source.active
              ? { ...candidate, active: false }
              : candidate,
          )
          const destinationIndex = Math.max(
            0,
            Math.min(destination.index, destinationTabs.length),
          )
          destinationTabs.splice(destinationIndex, 0, {
            ...source,
            windowId: destinationWindow.id,
          })

          const normalizeTabs = (windowId: number, tabs: Array<OpenTab>) =>
            tabs.map((candidate, nativeIndex) => ({
              ...candidate,
              nativeIndex,
              windowId,
            }))

          return current.flatMap((window) => {
            if (
              sourceWindow.id === destinationWindow.id &&
              window.id === sourceWindow.id
            ) {
              return [
                {
                  ...window,
                  tabs: normalizeTabs(window.id, destinationTabs),
                },
              ]
            }
            if (window.id === sourceWindow.id) {
              return sourceTabs.length
                ? [
                    {
                      ...window,
                      tabs: normalizeTabs(window.id, sourceTabs),
                    },
                  ]
                : []
            }
            if (window.id === destinationWindow.id) {
              return [
                {
                  ...window,
                  tabs: normalizeTabs(window.id, destinationTabs),
                },
              ]
            }
            return [window]
          })
        })
        return
      }

      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          await tabsApi.move(tab.id, {
            index: destination.index,
            windowId: destination.windowId,
          })
          break
        } catch (error) {
          const isNativeDragInProgress = String(error).includes(
            'Tabs cannot be edited right now',
          )
          if (!isNativeDragInProgress || attempt === 3) throw error
          await new Promise<void>((resolve) => {
            globalThis.setTimeout(resolve, 50)
          })
        }
      }
    },
    [],
  )

  return {
    windows,
    isChromeSource,
    canReorderTabs: isChromeSource || (import.meta.env.DEV && isTabSourceReady),
    activateTab,
    closeTab,
    moveTab,
  }
}
