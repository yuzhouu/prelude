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
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { getFaviconUrl } from '../bookmarks/chrome-bookmarks'
import {
  executeCapture,
  getCloseAfterCapturePreference,
  prepareTabCapture,
} from '../capture/chrome-capture'
import { isCaptureableUrl, normalizeCapturedUrl } from '../capture/model'
import type { CapturePlan } from '../capture/model'
import type { OpenTab, OpenTabWindow } from './model'
import {
  OpenTabSortableItem,
  OpenTabSortableWindows,
  OpenTabWindowDropZone,
} from './tab-sortable-windows'
import type { OpenTabMoveDestination } from './tab-drag'
import type { SortableTreeItemState } from '../../components/sortable-tree'

type TabCaptureStatus = 'error' | 'idle' | 'saved' | 'saving'
type TabCloseStatus = 'closing' | 'error' | 'idle'

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

interface TabRowProps {
  canCapture: boolean
  canClose: boolean
  captureStatus: TabCaptureStatus
  closeStatus: TabCloseStatus
  isBookmarked: boolean
  isCurrent: boolean
  sortableState?: SortableTreeItemState
  tab: OpenTab
  onActivate: (tab: OpenTab) => void
  onCapture: (tab: OpenTab) => void
  onClose: (tab: OpenTab) => void
}

function TabRow({
  canCapture,
  canClose,
  captureStatus,
  closeStatus,
  isBookmarked,
  isCurrent,
  sortableState,
  tab,
  onActivate,
  onCapture,
  onClose,
}: TabRowProps) {
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
  const closeLabel = !canClose
    ? t('tabs.close.extensionRequired')
    : closeStatus === 'closing'
      ? t('tabs.close.closing', { title: tab.title })
      : closeStatus === 'error'
        ? t('tabs.close.failed', { title: tab.title })
        : t('tabs.close.action', { title: tab.title })

  return (
    <div
      ref={sortableState?.setNodeRef}
      className={`open-tab-row${isCurrent ? ' is-active' : ''}${sortableState ? ' is-sortable' : ''}${sortableState?.isDragSource ? ' is-drag-source' : ''}`}
      data-tab-id={tab.id}
      data-open-tab-drop-id={tab.id}
      onClickCapture={sortableState?.onClickCapture}
      onPointerDownCapture={sortableState?.onPointerDownCapture}
    >
      <button
        ref={sortableState?.setDragHandleRef}
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
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="tooltip-disabled-trigger">
                <button
                  className={`open-tab-capture-action is-${displayStatus}`}
                  data-no-drag
                  type="button"
                  disabled={
                    !canCapture || !isSupported || captureStatus === 'saving'
                  }
                  aria-label={captureLabel}
                  onClick={() => onCapture(tab)}
                >
                  {displayStatus === 'saving' ? (
                    <LoaderCircle className="is-spinning" />
                  ) : displayStatus === 'saved' ||
                    displayStatus === 'bookmarked' ? (
                    <Check />
                  ) : displayStatus === 'error' ? (
                    <AlertTriangle />
                  ) : (
                    <Inbox />
                  )}
                </button>
              </span>
            }
          />
          <TooltipContent>{captureLabel}</TooltipContent>
        </Tooltip>
        {captureStatus === 'saved' || captureStatus === 'error' ? (
          <span className="sr-only" role="status">
            {captureLabel}
          </span>
        ) : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="tooltip-disabled-trigger">
                <button
                  className={`open-tab-close-action is-${closeStatus}`}
                  data-no-drag
                  type="button"
                  disabled={!canClose || closeStatus === 'closing'}
                  aria-label={closeLabel}
                  onClick={() => onClose(tab)}
                >
                  {closeStatus === 'closing' ? (
                    <LoaderCircle className="is-spinning" />
                  ) : closeStatus === 'error' ? (
                    <AlertTriangle />
                  ) : (
                    <X />
                  )}
                </button>
              </span>
            }
          />
          <TooltipContent>{closeLabel}</TooltipContent>
        </Tooltip>
        {closeStatus === 'error' ? (
          <span className="sr-only" role="status">
            {closeLabel}
          </span>
        ) : null}
      </span>
    </div>
  )
}

function TabWindow({
  bookmarkedUrlKeys,
  canCapture,
  canClose,
  captureStatuses,
  closeStatuses,
  displayNumber,
  window,
  onActivate,
  onCapture,
  onClose,
}: {
  bookmarkedUrlKeys: ReadonlySet<string>
  canCapture: boolean
  canClose: boolean
  captureStatuses: Record<string, TabCaptureStatus>
  closeStatuses: Record<number, TabCloseStatus>
  displayNumber: number
  window: OpenTabWindow
  onActivate: (tab: OpenTab) => void
  onCapture: (tab: OpenTab) => void
  onClose: (tab: OpenTab) => void
}) {
  const { t } = useTranslation()

  return (
    <section className="tab-window-group">
      <header className="tab-window-header">
        <OpenTabWindowDropZone
          edge="start"
          windowId={window.id}
          zoneId="header"
        >
          {({ isDropTarget, setNodeRef }) => (
            <div
              ref={setNodeRef}
              className={`tab-window-drop-header${isDropTarget ? ' is-drop-target' : ''}`}
              data-open-tab-drop-edge="start"
              data-open-tab-drop-window-id={window.id}
            >
              <div>
                <AppWindow />
                <h2>
                  {window.focused
                    ? t('tabs.currentWindow')
                    : t('tabs.window', { number: displayNumber })}
                </h2>
              </div>
              <span>{t('common.tabCount', { count: window.tabs.length })}</span>
            </div>
          )}
        </OpenTabWindowDropZone>
      </header>
      <div className="open-tab-list">
        <OpenTabWindowDropZone
          edge="start"
          windowId={window.id}
          zoneId="list-start"
        >
          {({ isDropTarget, setNodeRef }) => (
            <span
              ref={setNodeRef}
              className={`open-tab-list-drop-boundary is-start${isDropTarget ? ' is-drop-target' : ''}`}
              data-open-tab-drop-edge="start"
              data-open-tab-drop-window-id={window.id}
              aria-hidden="true"
            />
          )}
        </OpenTabWindowDropZone>
        {window.tabs.map((tab, index) => (
          <OpenTabSortableItem
            key={tab.id}
            id={tab.id}
            index={index}
            windowId={window.id}
          >
            {(sortableState) => (
              <TabRow
                tab={tab}
                isCurrent={window.focused && tab.active}
                canCapture={canCapture}
                canClose={canClose}
                captureStatus={captureStatuses[getTabCaptureKey(tab)] ?? 'idle'}
                closeStatus={closeStatuses[tab.id] ?? 'idle'}
                isBookmarked={bookmarkedUrlKeys.has(
                  normalizeCapturedUrl(tab.url),
                )}
                sortableState={sortableState}
                onActivate={onActivate}
                onCapture={onCapture}
                onClose={onClose}
              />
            )}
          </OpenTabSortableItem>
        ))}
        <OpenTabWindowDropZone
          edge="end"
          windowId={window.id}
          zoneId="list-end"
        >
          {({ isDropTarget, setNodeRef }) => (
            <span
              ref={setNodeRef}
              className={`open-tab-list-drop-boundary is-end${isDropTarget ? ' is-drop-target' : ''}`}
              data-open-tab-drop-edge="end"
              data-open-tab-drop-window-id={window.id}
              aria-hidden="true"
            />
          )}
        </OpenTabWindowDropZone>
      </div>
    </section>
  )
}

export function OpenTabsContents({
  bookmarkedUrlKeys,
  canCapture,
  canClose,
  canMove,
  windows,
  onActivate,
  onClose,
  onMove,
}: {
  bookmarkedUrlKeys: ReadonlySet<string>
  canCapture: boolean
  canClose: boolean
  canMove: boolean
  windows: Array<OpenTabWindow>
  onActivate: (tab: OpenTab) => void
  onClose: (tab: OpenTab) => Promise<void>
  onMove: (
    tab: OpenTab,
    destination: OpenTabMoveDestination,
    projectedWindows: Array<OpenTabWindow>,
  ) => Promise<void>
}) {
  const { t } = useTranslation()
  const [captureStatuses, setCaptureStatuses] = useState<
    Record<string, TabCaptureStatus>
  >({})
  const [pendingDuplicate, setPendingDuplicate] = useState<PendingDuplicate>()
  const [closeStatuses, setCloseStatuses] = useState<
    Record<number, TabCloseStatus>
  >({})

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

  const closeTab = async (tab: OpenTab) => {
    if (!canClose || closeStatuses[tab.id] === 'closing') return

    setCloseStatuses((current) => ({ ...current, [tab.id]: 'closing' }))
    try {
      await onClose(tab)
    } catch {
      setCloseStatuses((current) => ({ ...current, [tab.id]: 'error' }))
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
      <OpenTabSortableWindows
        canMove={canMove}
        windows={windows}
        onMove={onMove}
        renderOverlay={(tab) => (
          <div className="open-tab-drag-preview">
            <TabFavicon tab={tab} />
            <span className="open-tab-copy">
              <strong>{tab.title || getHostname(tab.url)}</strong>
              <span>{getHostname(tab.url)}</span>
            </span>
            {tab.pinned ? <Pin aria-hidden="true" /> : null}
          </div>
        )}
      >
        {(previewWindows) => (
          <div className="tab-window-sections">
            {previewWindows.map((window, index) => (
              <TabWindow
                key={window.id}
                bookmarkedUrlKeys={bookmarkedUrlKeys}
                canCapture={canCapture}
                canClose={canClose}
                captureStatuses={captureStatuses}
                closeStatuses={closeStatuses}
                displayNumber={index + 1}
                window={window}
                onActivate={onActivate}
                onCapture={(candidate) => void captureTab(candidate)}
                onClose={(candidate) => void closeTab(candidate)}
              />
            ))}
          </div>
        )}
      </OpenTabSortableWindows>

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
