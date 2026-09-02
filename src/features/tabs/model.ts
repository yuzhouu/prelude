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
  tab: OpenTab
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
      tab,
    }
    sortIndex += 1
    return entry
  })
}

export function getNativeTabMoveIndex(
  source: OpenTab,
  nextTabs: Array<OpenTab>,
) {
  const sourceIndex = nextTabs.findIndex((tab) => tab.id === source.id)
  if (sourceIndex < 0) return source.nativeIndex

  if (sourceIndex + 1 < nextTabs.length) {
    const nextTab = nextTabs[sourceIndex + 1]
    return (
      nextTab.nativeIndex - (source.nativeIndex < nextTab.nativeIndex ? 1 : 0)
    )
  }

  if (sourceIndex > 0) {
    const previousTab = nextTabs[sourceIndex - 1]
    return (
      previousTab.nativeIndex -
      (source.nativeIndex < previousTab.nativeIndex ? 1 : 0) +
      1
    )
  }

  return source.nativeIndex
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
