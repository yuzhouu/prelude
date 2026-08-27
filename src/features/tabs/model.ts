export interface OpenTab {
  id: number
  windowId: number
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
