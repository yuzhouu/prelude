import { useCallback, useEffect, useState } from 'react'

import { getTopSites } from './chrome-top-sites'
import type { TopSite } from './chrome-top-sites'

interface TopSitesState {
  status: 'idle' | 'loading' | 'unavailable' | 'error' | 'ready'
  sites: Array<TopSite>
}

export function useTopSites(enabled: boolean) {
  const [state, setState] = useState<TopSitesState>({
    status: 'idle',
    sites: [],
  })
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    if (!enabled) return
    let active = true
    let requestId = 0

    const load = async () => {
      const currentRequestId = ++requestId
      setState((current) => ({ ...current, status: 'loading' }))
      try {
        const sites = await getTopSites()
        if (!active || currentRequestId !== requestId) return
        setState(
          sites === undefined
            ? { status: 'unavailable', sites: [] }
            : { status: 'ready', sites },
        )
      } catch {
        if (active && currentRequestId === requestId) {
          setState({ status: 'error', sites: [] })
        }
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }

    void load()
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, revision])

  return { state, refresh }
}
