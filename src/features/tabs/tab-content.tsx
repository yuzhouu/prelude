import { useState } from 'react'
import { AudioLines, AppWindow, Pin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getFaviconUrl } from '../bookmarks/chrome-bookmarks'
import type { OpenTab, OpenTabWindow } from './model'

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function TabFavicon({ tab }: { tab: OpenTab }) {
  const [hasError, setHasError] = useState(false)
  const faviconUrl = getFaviconUrl(tab.url)

  return (
    <span className="bookmark-favicon tab-favicon">
      {faviconUrl && !hasError ? (
        <img
          src={faviconUrl}
          alt=""
          width="20"
          height="20"
          onError={() => setHasError(true)}
        />
      ) : (
        <span aria-hidden="true">
          {tab.title.trim().charAt(0).toUpperCase() || '•'}
        </span>
      )}
    </span>
  )
}

function TabRow({
  tab,
  isCurrent,
  onActivate,
}: {
  tab: OpenTab
  isCurrent: boolean
  onActivate: (tab: OpenTab) => void
}) {
  const { t } = useTranslation()
  return (
    <button
      className={`open-tab-row${isCurrent ? ' is-active' : ''}`}
      type="button"
      onClick={() => onActivate(tab)}
    >
      <TabFavicon tab={tab} />
      <span className="open-tab-copy">
        <strong>{tab.title || getHostname(tab.url)}</strong>
        <span>{getHostname(tab.url)}</span>
      </span>
      <span className="open-tab-meta">
        {tab.pinned ? <Pin aria-label={t('tabs.pinned')} /> : null}
        {tab.audible ? <AudioLines aria-label={t('tabs.audible')} /> : null}
        {isCurrent ? (
          <span className="active-tab-label">{t('tabs.current')}</span>
        ) : null}
      </span>
    </button>
  )
}

export function OpenTabsContents({
  windows,
  onActivate,
}: {
  windows: Array<OpenTabWindow>
  onActivate: (tab: OpenTab) => void
}) {
  const { t } = useTranslation()
  if (!windows.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <AppWindow />
        </div>
        <strong>{t('tabs.emptyTitle')}</strong>
        <p>{t('tabs.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="tab-window-sections">
      {windows.map((window, index) => (
        <section className="tab-window-group" key={window.id}>
          <header className="tab-window-header">
            <div>
              <AppWindow />
              <h2>
                {window.focused
                  ? t('tabs.currentWindow')
                  : t('tabs.window', { number: index + 1 })}
              </h2>
            </div>
            <span>{t('common.tabCount', { count: window.tabs.length })}</span>
          </header>
          <div className="open-tab-list">
            {window.tabs.map((tab) => (
              <TabRow
                key={tab.id}
                tab={tab}
                isCurrent={window.focused && tab.active}
                onActivate={onActivate}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
