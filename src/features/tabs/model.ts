export interface OpenTab {
  id: number
  windowId: number
  nativeIndex: number
  groupId: number
  title: string
  url: string
  active: boolean
  pinned: boolean
  audible: boolean
}

export interface OpenTabWindow {
  id: number
  focused: boolean
  tabs: Array<OpenTab>
}

export interface SortableTabEntry {
  sortGroup: string
  sortIndex: number
  sortType: string
  tab: OpenTab
}

export interface OpenTabMoveDestination {
  index: number
  windowId: number
}

export interface ProjectedOpenTabMove {
  destination: OpenTabMoveDestination
  windows: Array<OpenTabWindow>
}

function getTabSortType(tab: OpenTab) {
  if (tab.groupId >= 0) return `group:${tab.windowId}:${tab.groupId}`
  return tab.pinned ? 'pinned' : 'regular'
}

export function getSortableTabEntries(tabs: Array<OpenTab>) {
  let region = -1
  let previousSignature: string | undefined
  let sortIndex = 0

  return tabs.map<SortableTabEntry>((tab) => {
    const signature = `${tab.pinned ? 'pinned' : 'regular'}:${tab.groupId}`
    if (signature !== previousSignature) {
      region += 1
      sortIndex = 0
      previousSignature = signature
    }

    const entry = {
      sortGroup: `${tab.windowId}:${region}:${signature}`,
      sortIndex,
      sortType: getTabSortType(tab),
      tab,
    }
    sortIndex += 1
    return entry
  })
}

export function getNativeTabMoveIndex(
  source: OpenTab,
  nextTabs: Array<OpenTab>,
  destinationWindowId = source.windowId,
) {
  const sourceIndex = nextTabs.findIndex((tab) => tab.id === source.id)
  if (sourceIndex < 0) return source.nativeIndex
  const isSameWindow = source.windowId === destinationWindowId

  if (sourceIndex + 1 < nextTabs.length) {
    const nextTab = nextTabs[sourceIndex + 1]
    return (
      nextTab.nativeIndex -
      (isSameWindow && source.nativeIndex < nextTab.nativeIndex ? 1 : 0)
    )
  }

  if (sourceIndex > 0) {
    const previousTab = nextTabs[sourceIndex - 1]
    return (
      previousTab.nativeIndex -
      (isSameWindow && source.nativeIndex < previousTab.nativeIndex ? 1 : 0) +
      1
    )
  }

  return isSameWindow ? source.nativeIndex : 0
}

function normalizeProjectedTabs(windowId: number, tabs: Array<OpenTab>) {
  return tabs.map((tab, nativeIndex) => ({
    ...tab,
    nativeIndex,
    windowId,
  }))
}

export function projectOpenTabMove({
  destinationSortGroup,
  destinationSortIndex,
  destinationWindowId,
  sourceTabId,
  windows,
}: {
  destinationSortGroup: string
  destinationSortIndex: number
  destinationWindowId: number
  sourceTabId: number
  windows: Array<OpenTabWindow>
}): ProjectedOpenTabMove | undefined {
  const sourceWindow = windows.find((window) =>
    window.tabs.some((tab) => tab.id === sourceTabId),
  )
  const destinationWindow = windows.find(
    (window) => window.id === destinationWindowId,
  )
  const sourceTab = sourceWindow?.tabs.find((tab) => tab.id === sourceTabId)
  if (!sourceWindow || !destinationWindow || !sourceTab) return undefined

  const isCrossWindow = sourceWindow.id !== destinationWindow.id
  const sourceTabIndex = sourceWindow.tabs.findIndex(
    (tab) => tab.id === sourceTabId,
  )
  let sourceTabs = sourceWindow.tabs.filter((tab) => tab.id !== sourceTabId)
  if (isCrossWindow && sourceTab.active && sourceTabs.length) {
    const nextActiveIndex = Math.min(sourceTabIndex, sourceTabs.length - 1)
    sourceTabs = sourceTabs.map((tab, index) => ({
      ...tab,
      active: index === nextActiveIndex,
    }))
  }

  const destinationTabs = (
    sourceWindow.id === destinationWindow.id
      ? sourceTabs
      : destinationWindow.tabs
  ).map((tab) =>
    isCrossWindow && sourceTab.active ? { ...tab, active: false } : tab,
  )
  const destinationEntries = getSortableTabEntries(destinationTabs).filter(
    (entry) => entry.sortGroup === destinationSortGroup,
  )
  if (!destinationEntries.length) return undefined

  const clampedSortIndex = Math.max(
    0,
    Math.min(destinationSortIndex, destinationEntries.length),
  )
  const insertionIndex =
    clampedSortIndex < destinationEntries.length
      ? destinationTabs.findIndex(
          (tab) => tab.id === destinationEntries[clampedSortIndex].tab.id,
        )
      : destinationTabs.findIndex(
          (tab) => tab.id === destinationEntries.at(-1)?.tab.id,
        ) + 1
  if (insertionIndex < 0) return undefined

  const nextDestinationTabs = destinationTabs.slice()
  nextDestinationTabs.splice(insertionIndex, 0, {
    ...sourceTab,
    windowId: destinationWindowId,
  })
  const destinationIndex = getNativeTabMoveIndex(
    sourceTab,
    nextDestinationTabs,
    destinationWindowId,
  )

  const nextWindows = windows.flatMap((window) => {
    if (
      sourceWindow.id === destinationWindow.id &&
      window.id === sourceWindow.id
    ) {
      return [
        {
          ...window,
          tabs: normalizeProjectedTabs(window.id, nextDestinationTabs),
        },
      ]
    }
    if (window.id === sourceWindow.id) {
      return sourceTabs.length
        ? [{ ...window, tabs: normalizeProjectedTabs(window.id, sourceTabs) }]
        : []
    }
    if (window.id === destinationWindow.id) {
      return [
        {
          ...window,
          tabs: normalizeProjectedTabs(window.id, nextDestinationTabs),
        },
      ]
    }
    return [window]
  })

  return {
    destination: { index: destinationIndex, windowId: destinationWindowId },
    windows: nextWindows,
  }
}

export function countOpenTabs(windows: Array<OpenTabWindow>) {
  return windows.reduce((total, window) => total + window.tabs.length, 0)
}

export function filterOpenTabs(
  windows: Array<OpenTabWindow>,
  rawQuery: string,
) {
  const query = rawQuery.trim().toLocaleLowerCase()
  if (!query) return windows

  return windows
    .map((window) => ({
      ...window,
      tabs: window.tabs.filter((tab) =>
        `${tab.title} ${tab.url}`.toLocaleLowerCase().includes(query),
      ),
    }))
    .filter((window) => window.tabs.length > 0)
}
