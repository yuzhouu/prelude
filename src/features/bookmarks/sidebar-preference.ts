export const SIDEBAR_EXPANDED_STORAGE_KEY = 'prelude:sidebar-expanded:v1'

export function getInitialSidebarExpanded() {
  try {
    return window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function persistSidebarExpanded(isExpanded: boolean) {
  try {
    window.localStorage.setItem(
      SIDEBAR_EXPANDED_STORAGE_KEY,
      String(isExpanded),
    )
  } catch {
    // Keep the in-memory preference when browser storage is unavailable.
  }
}
