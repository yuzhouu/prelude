import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useState } from 'react'
import {
  AlertTriangle,
  AudioLines,
  AppWindow,
  Check,
  Inbox,
  LoaderCircle,
  Pin,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getFaviconUrl } from '../bookmarks/chrome-bookmarks'
import {
  executeCapture,
  getCloseAfterCapturePreference,
  prepareTabCapture,
} from '../capture/chrome-capture'
import { isCaptureableUrl, normalizeCapturedUrl } from '../capture/model'
import type { CapturePlan } from '../capture/model'
import type { OpenTab, OpenTabWindow } from './model'

type TabCaptureStatus = 'error' | 'idle' | 'saved' | 'saving'

interface PendingDuplicate {
  captureKey: string
  closeAfterCapture: boolean
  plan: CapturePlan
}

function getTabCaptureKey(tab: OpenTab) {
  return `${tab.id}:${normalizeCapturedUrl(tab.url)}`
}

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
  canCapture,
  captureStatus,
  isBookmarked,
  tab,
  isCurrent,
  onActivate,
  onCapture,
}: {
  canCapture: boolean
  captureStatus: TabCaptureStatus
  isBookmarked: boolean
  tab: OpenTab
  isCurrent: boolean
  onActivate: (tab: OpenTab) => void
  onCapture: (tab: OpenTab) => void
}) {
  const { t } = useTranslation()
  const isSupported = isCaptureableUrl(tab.url)
  const displayStatus =
    captureStatus === 'idle' && isBookmarked ? 'bookmarked' : captureStatus
  const captureLabel = !canCapture
    ? t('tabs.capture.extensionRequired')
    : !isSupported
      ? t('tabs.capture.unsupported')
      : displayStatus === 'saving'
        ? t('tabs.capture.saving', { title: tab.title })
        : displayStatus === 'saved'
          ? t('tabs.capture.saved', { title: tab.title })
          : displayStatus === 'error'
            ? t('tabs.capture.failed', { title: tab.title })
            : displayStatus === 'bookmarked'
              ? t('tabs.capture.bookmarked', { title: tab.title })
              : t('tabs.capture.action', { title: tab.title })

  return (
    <div className={`open-tab-row${isCurrent ? ' is-active' : ''}`}>
      <button
        className="open-tab-main"
        type="button"
        onClick={() => onActivate(tab)}
      >
        <TabFavicon tab={tab} />
        <span className="open-tab-copy">
          <strong>{tab.title || getHostname(tab.url)}</strong>
          <span>{getHostname(tab.url)}</span>
        </span>
      </button>
      <span className="open-tab-meta">
        {tab.pinned ? <Pin aria-label={t('tabs.pinned')} /> : null}
        {tab.audible ? <AudioLines aria-label={t('tabs.audible')} /> : null}
        {isCurrent ? (
          <span className="active-tab-label">{t('tabs.current')}</span>
        ) : null}
        <button
          className={`open-tab-capture-action is-${displayStatus}`}
          type="button"
          disabled={!canCapture || !isSupported || captureStatus === 'saving'}
          aria-label={captureLabel}
          title={captureLabel}
          onClick={() => onCapture(tab)}
        >
          {displayStatus === 'saving' ? (
            <LoaderCircle className="is-spinning" />
          ) : displayStatus === 'saved' || displayStatus === 'bookmarked' ? (
            <Check />
          ) : displayStatus === 'error' ? (
            <AlertTriangle />
          ) : (
            <Inbox />
          )}
        </button>
        {captureStatus === 'saved' || captureStatus === 'error' ? (
          <span className="sr-only" role="status">
            {captureLabel}
          </span>
        ) : null}
      </span>
    </div>
  )
}

export function OpenTabsContents({
  bookmarkedUrlKeys,
  canCapture,
  windows,
  onActivate,
}: {
  bookmarkedUrlKeys: ReadonlySet<string>
  canCapture: boolean
  windows: Array<OpenTabWindow>
  onActivate: (tab: OpenTab) => void
}) {
  const { t } = useTranslation()
  const [captureStatuses, setCaptureStatuses] = useState<
    Record<string, TabCaptureStatus>
  >({})
  const [pendingDuplicate, setPendingDuplicate] = useState<PendingDuplicate>()

  const setCaptureStatus = (captureKey: string, status: TabCaptureStatus) => {
    setCaptureStatuses((current) => ({ ...current, [captureKey]: status }))
  }

  const saveCapturePlan = async (
    pending: PendingDuplicate,
    duplicatePolicy: 'save' | 'skip',
  ) => {
    setPendingDuplicate(undefined)
    setCaptureStatus(pending.captureKey, 'saving')
    try {
      const result = await executeCapture({
        closeAfterCapture: pending.closeAfterCapture,
        duplicatePolicy,
        plan: pending.plan,
      })
      setCaptureStatus(
        pending.captureKey,
        result.savedCount > 0 ? 'saved' : 'idle',
      )
    } catch {
      setCaptureStatus(pending.captureKey, 'error')
    }
  }

  const captureTab = async (tab: OpenTab) => {
    const captureKey = getTabCaptureKey(tab)
    if (!canCapture || captureStatuses[captureKey] === 'saving') return

    setCaptureStatus(captureKey, 'saving')
    try {
      const [plan, closeAfterCapture] = await Promise.all([
        prepareTabCapture(tab),
        getCloseAfterCapturePreference(),
      ])
      if (!plan.items.length) {
        setCaptureStatus(captureKey, 'error')
        return
      }

      const pending = { captureKey, closeAfterCapture, plan }
      if (plan.duplicateCount > 0) {
        setCaptureStatus(captureKey, 'idle')
        setPendingDuplicate(pending)
        return
      }

      await saveCapturePlan(pending, 'skip')
    } catch {
      setCaptureStatus(captureKey, 'error')
    }
  }

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
    <>
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
                  canCapture={canCapture}
                  captureStatus={
                    captureStatuses[getTabCaptureKey(tab)] ?? 'idle'
                  }
                  isBookmarked={bookmarkedUrlKeys.has(
                    normalizeCapturedUrl(tab.url),
                  )}
                  onActivate={onActivate}
                  onCapture={(candidate) => void captureTab(candidate)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <AlertDialog.Root
        open={pendingDuplicate !== undefined}
        onOpenChange={(open) => {
          if (!open) setPendingDuplicate(undefined)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="bookmark-dialog-backdrop" />
          <AlertDialog.Viewport className="bookmark-dialog-viewport">
            <AlertDialog.Popup className="bookmark-dialog-popup is-compact">
              <AlertDialog.Title className="bookmark-dialog-title">
                {t('tabs.capture.duplicateTitle')}
              </AlertDialog.Title>
              <AlertDialog.Description className="bookmark-dialog-description">
                {t('tabs.capture.duplicateDescription', {
                  title: pendingDuplicate?.plan.items[0]?.tab.title ?? '',
                })}
              </AlertDialog.Description>
              <div className="bookmark-dialog-actions">
                <AlertDialog.Close type="button">
                  {t('common.cancel')}
                </AlertDialog.Close>
                <button
                  className="is-primary"
                  type="button"
                  onClick={() => {
                    if (pendingDuplicate) {
                      void saveCapturePlan(pendingDuplicate, 'save')
                    }
                  }}
                >
                  {t('tabs.capture.saveAnyway')}
                </button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
