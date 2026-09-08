import { useEffect, useState, useSyncExternalStore } from 'react'

import {
  getTopSitesEnabledSnapshot,
  getTopSitesPermissions,
  hasTopSitesPermission,
  subscribeToTopSitesPreference,
} from './top-sites-access'

export function useTopSitesAccess() {
  const preference = useSyncExternalStore(
    subscribeToTopSitesPreference,
    getTopSitesEnabledSnapshot,
  )
  const [granted, setGranted] = useState<boolean | null>(null)
  const api = getTopSitesPermissions()

  useEffect(() => {
    let active = true
    let revision = 0
    const check = async () => {
      const request = ++revision
      const next = await hasTopSitesPermission().catch(() => false)
      if (active && request === revision) setGranted(next)
    }
    const onRemoved = (value: { permissions?: Array<string> }) => {
      if (value.permissions?.includes('topSites')) {
        revision++
        setGranted(false)
      }
    }
    const onAdded = (value: { permissions?: Array<string> }) => {
      if (value.permissions?.includes('topSites')) void check()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }
    void check()
    api?.onAdded.addListener(onAdded)
    api?.onRemoved.addListener(onRemoved)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      api?.onAdded.removeListener(onAdded)
      api?.onRemoved.removeListener(onRemoved)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [api, preference])

  return {
    enabled: preference && granted === true,
    ready: granted !== null,
    available: api !== undefined,
  }
}
