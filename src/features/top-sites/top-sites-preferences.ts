export const HIDDEN_TOP_SITES_STORAGE_KEY = 'prelude:hidden-top-sites:v1'
const PREFERENCES_CHANGED_EVENT = 'prelude:hidden-top-sites-changed'

export function parseHiddenTopSites(value: string | null): Array<string> {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((url): url is string => typeof url === 'string')
      : []
  } catch {
    return []
  }
}

export function getHiddenTopSitesSnapshot() {
  try {
    return window.localStorage.getItem(HIDDEN_TOP_SITES_STORAGE_KEY)
  } catch {
    return null
  }
}

export function hideTopSite(url: string) {
  // Read immediately before writing so other open Prelude pages are respected.
  const hidden = new Set(parseHiddenTopSites(getHiddenTopSitesSnapshot()))
  hidden.add(url)
  window.localStorage.setItem(
    HIDDEN_TOP_SITES_STORAGE_KEY,
    JSON.stringify([...hidden]),
  )
  window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
}

export function restoreHiddenTopSites() {
  window.localStorage.removeItem(HIDDEN_TOP_SITES_STORAGE_KEY)
  window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
}

export function subscribeToHiddenTopSites(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === HIDDEN_TOP_SITES_STORAGE_KEY)
      onChange()
  }
  window.addEventListener(PREFERENCES_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PREFERENCES_CHANGED_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
