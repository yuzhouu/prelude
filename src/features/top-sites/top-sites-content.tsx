import { useMemo, useState, useSyncExternalStore } from 'react'
import { Compass, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BookmarkFavicon } from '../bookmarks/bookmark-favicon'
import { normalizeCapturedUrl } from '../capture/model'
import {
  getHiddenTopSitesSnapshot,
  hideTopSite,
  parseHiddenTopSites,
  restoreHiddenTopSites,
  subscribeToHiddenTopSites,
} from './top-sites-preferences'
import { useTopSites } from './use-top-sites'

export function TopSitesContents() {
  const { t } = useTranslation()
  const { state, refresh } = useTopSites(true)
  const [saveError, setSaveError] = useState(false)
  const hiddenSnapshot = useSyncExternalStore(
    subscribeToHiddenTopSites,
    getHiddenTopSitesSnapshot,
  )
  const hidden = useMemo(
    () => parseHiddenTopSites(hiddenSnapshot),
    [hiddenSnapshot],
  )
  const hiddenKeys = new Set(hidden.map(normalizeCapturedUrl))
  const sites = state.sites.filter(
    (site) => !hiddenKeys.has(normalizeCapturedUrl(site.url)),
  )
  const changeHidden = (url?: string) => {
    try {
      if (url) hideTopSite(url)
      else restoreHiddenTopSites()
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }

  return (
    <section aria-label={t('topSites.title')}>
      <div className="top-sites-toolbar">
        <p>{t('topSites.listDescription')}</p>
        {hidden.length > 0 ? (
          <button
            className="settings-text-link"
            type="button"
            onClick={() => changeHidden()}
          >
            {t('topSites.restore', { count: hidden.length })}
          </button>
        ) : null}
      </div>
      {saveError ? (
        <p role="alert" className="search-top-sites-notice">
          {t('topSites.saveError')}
        </p>
      ) : null}
      {sites.length > 0 ? (
        <div className="bookmark-list">
          {sites.map((site) => (
            <div className="bookmark-row" key={site.url}>
              <a className="bookmark-main-link" href={site.url}>
                <BookmarkFavicon title={site.title} url={site.url} />
                <span className="bookmark-copy">
                  <strong>{site.title}</strong>
                  <span>{site.hostname}</span>
                </span>
              </a>
              <button
                className="bookmark-action bookmark-direct-action"
                type="button"
                aria-label={t('topSites.hide', { title: site.title })}
                onClick={() => changeHidden(site.url)}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <div className="empty-state-icon">
            <Compass />
          </div>
          <strong>
            {t(
              state.status === 'unavailable'
                ? 'topSites.unavailable'
                : state.status === 'error'
                  ? 'topSites.error'
                  : state.status === 'ready'
                    ? 'topSites.empty'
                    : 'topSites.loading',
            )}
          </strong>
          {state.status === 'error' ? (
            <button
              type="button"
              className="settings-text-link"
              onClick={refresh}
            >
              {t('topSites.retry')}
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
