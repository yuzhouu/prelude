export const TOP_SITES_ENABLED_STORAGE_KEY = 'prelude:top-sites-enabled:v1'
const ACCESS_CHANGED_EVENT = 'prelude:top-sites-access-changed'
const permission = { permissions: ['topSites'] }

interface Permissions {
  permissions?: Array<string>
}

interface PermissionEvent {
  addListener: (listener: (value: Permissions) => void) => void
  removeListener: (listener: (value: Permissions) => void) => void
}

interface ChromePermissions {
  contains: (value: Permissions) => Promise<boolean>
  request: (value: Permissions) => Promise<boolean>
  onAdded: PermissionEvent
  onRemoved: PermissionEvent
}

export function getTopSitesPermissions() {
  return (
    globalThis as typeof globalThis & {
      chrome?: { permissions?: ChromePermissions }
    }
  ).chrome?.permissions
}

export function getTopSitesEnabledSnapshot() {
  try {
    return window.localStorage.getItem(TOP_SITES_ENABLED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveEnabled(enabled: boolean) {
  window.localStorage.setItem(TOP_SITES_ENABLED_STORAGE_KEY, String(enabled))
  window.dispatchEvent(new Event(ACCESS_CHANGED_EVENT))
}

export function subscribeToTopSitesPreference(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOP_SITES_ENABLED_STORAGE_KEY)
      onChange()
  }
  window.addEventListener(ACCESS_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(ACCESS_CHANGED_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export async function hasTopSitesPermission() {
  return (await getTopSitesPermissions()?.contains(permission)) ?? false
}

export async function changeTopSitesAccess(enabled: boolean) {
  if (!enabled) {
    // Disabling is a local preference; keep Chrome's existing authorization.
    saveEnabled(false)
    return 'success'
  }

  const api = getTopSitesPermissions()
  if (!api) return 'unavailable'

  // Keep this before any await so Chrome receives the original click gesture.
  const granted = await api.request(permission)
  if (!granted) return 'denied'
  saveEnabled(true)
  return 'success'
}
