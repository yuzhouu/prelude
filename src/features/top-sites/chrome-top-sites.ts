import { hasTopSitesPermission } from './top-sites-access.ts'

export interface TopSite {
  title: string
  url: string
  hostname: string
}

interface ChromeApi {
  topSites?: {
    get: () => Promise<Array<{ title: string; url: string }>>
  }
}

export async function getTopSites(): Promise<Array<TopSite> | undefined> {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeApi })
    .chrome
  if (!chromeApi?.topSites || !(await hasTopSitesPermission())) return undefined

  const sites = await chromeApi.topSites.get()
  return sites.flatMap((site) => {
    try {
      const url = new URL(site.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return []
      const hostname = url.hostname.replace(/^www\./, '')
      return [{ title: site.title.trim() || hostname, url: site.url, hostname }]
    } catch {
      return []
    }
  })
}
