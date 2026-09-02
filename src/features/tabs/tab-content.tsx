import { AlertDialog } from '@base-ui/react/alert-dialog'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { useEffect, useRef, useState } from 'react'
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
import { FULL_ROW_SORTABLE_SENSORS } from '../../lib/sortable'
import { getFaviconUrl } from '../bookmarks/chrome-bookmarks'
import {
  executeCapture,
  getCloseAfterCapturePreference,
  prepareTabCapture,
} from '../capture/chrome-capture'
import { isCaptureableUrl, normalizeCapturedUrl } from '../capture/model'
import type { CapturePlan } from '../capture/model'
import { getSortableTabEntries, projectOpenTabMove } from './model'
import type {
  OpenTab,
  OpenTabMoveDestination,
  OpenTabWindow,
  SortableTabEntry,
} from './model'

type TabCaptureStatus = 'error' | 'idle' | 'saved' | 'saving'
type TabCloseStatus = 'closing' | 'error' | 'idle'

interface PendingDuplicate {
  captureKey: string
  closeAfterCapture: boolean
  plan: CapturePlan
}

interface SortableTabData {
  sortGroup: string
  sortIndex: number
  sortType: string
  tab: OpenTab
  windowId: number
}

interface OptimisticTabMove {
  destinationWindowId: number
  destinationWindowTabIds: Array<number>
  windows: Array<OpenTabWindow>
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
  canReorder?: boolean
  captureStatus: TabCaptureStatus
  closeStatus: TabCloseStatus
  isBookmarked: boolean
  isCurrent: boolean
  isDragging?: boolean
  tab: OpenTab
  sortableRef?: (element: Element | null) => void
  onActivate: (tab: OpenTab) => void
  onCapture: (tab: OpenTab) => void
  onClose: (tab: OpenTab) => void
}

function TabRow({
  canCapture,
  canClose,
  canReorder = false,
  captureStatus,
  closeStatus,
  isBookmarked,
  isCurrent,
  isDragging = false,
  tab,
  sortableRef,
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
      ref={sortableRef}
      className={`open-tab-row${isCurrent ? ' is-active' : ''}${canReorder ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}`}
      data-tab-id={tab.id}
    >
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
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="tooltip-disabled-trigger">
                <button
                  className={`open-tab-capture-action is-${displayStatus}`}
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

function SortableTabRow({
  canReorder,
  entry,
  ...rowProps
}: Omit<TabRowProps, 'canReorder' | 'sortableRef' | 'tab'> & {
  canReorder: boolean
  entry: SortableTabEntry
}) {
  const { isDragging, isDropping, ref } = useSortable<SortableTabData>({
    id: entry.tab.id,
    index: entry.sortIndex,
    group: entry.sortGroup,
    type: entry.sortType,
    accept: (source) => {
      const sourceData = source.data as SortableTabData | undefined
      if (!sourceData) return false
      return sourceData.windowId === entry.tab.windowId
        ? sourceData.sortGroup === entry.sortGroup
        : sourceData.sortType === entry.sortType
    },
    disabled: !canReorder,
    data: {
      sortGroup: entry.sortGroup,
      sortIndex: entry.sortIndex,
      sortType: entry.sortType,
      tab: entry.tab,
      windowId: entry.tab.windowId,
    },
    transition: {
      duration: 180,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      idle: true,
    },
  })

  return (
    <TabRow
      {...rowProps}
      tab={entry.tab}
      canReorder={canReorder}
      isDragging={isDragging || isDropping}
      sortableRef={ref}
    />
  )
}

function TabDragPreview({ tab }: { tab: OpenTab }) {
  return (
    <div className="open-tab-drag-preview">
      <TabFavicon tab={tab} />
      <span className="open-tab-copy">
        <strong>{tab.title || getHostname(tab.url)}</strong>
        <span>{getHostname(tab.url)}</span>
      </span>
    </div>
  )
}

function SortableTabWindow({
  bookmarkedUrlKeys,
  canCapture,
  canClose,
  canReorder,
  captureStatuses,
  closeStatuses,
  displayNumber,
  hasMoveError,
  hasPendingMove,
  window,
  onActivate,
  onCapture,
  onClose,
}: {
  bookmarkedUrlKeys: ReadonlySet<string>
  canCapture: boolean
  canClose: boolean
  canReorder: boolean
  captureStatuses: Record<string, TabCaptureStatus>
  closeStatuses: Record<number, TabCloseStatus>
  displayNumber: number
  hasMoveError: boolean
  hasPendingMove: boolean
  window: OpenTabWindow
  onActivate: (tab: OpenTab) => void
  onCapture: (tab: OpenTab) => void
  onClose: (tab: OpenTab) => void
}) {
  const { t } = useTranslation()
  const entries = getSortableTabEntries(window.tabs)

  return (
    <section className="tab-window-group">
      <header className="tab-window-header">
        <div>
          <AppWindow />
          <h2>
            {window.focused
              ? t('tabs.currentWindow')
              : t('tabs.window', { number: displayNumber })}
          </h2>
        </div>
        <span>{t('common.tabCount', { count: window.tabs.length })}</span>
      </header>
      <div className="open-tab-list">
        {entries.map((entry) => (
          <SortableTabRow
            key={entry.tab.id}
            entry={entry}
            isCurrent={window.focused && entry.tab.active}
            canCapture={canCapture}
            canClose={canClose}
            canReorder={canReorder && !hasPendingMove}
            captureStatus={
              captureStatuses[getTabCaptureKey(entry.tab)] ?? 'idle'
            }
            closeStatus={closeStatuses[entry.tab.id] ?? 'idle'}
            isBookmarked={bookmarkedUrlKeys.has(
              normalizeCapturedUrl(entry.tab.url),
            )}
            onActivate={onActivate}
            onCapture={onCapture}
            onClose={onClose}
          />
        ))}
      </div>
      {hasMoveError ? (
        <p className="open-tab-sort-error" role="alert">
          {t('tabs.reorder.failed')}
        </p>
      ) : null}
    </section>
  )
}

export function OpenTabsContents({
  bookmarkedUrlKeys,
  canCapture,
  canClose,
  canReorder,
  windows,
  onActivate,
  onClose,
  onReorder,
}: {
  bookmarkedUrlKeys: ReadonlySet<string>
  canCapture: boolean
  canClose: boolean
  canReorder: boolean
  windows: Array<OpenTabWindow>
  onActivate: (tab: OpenTab) => void
  onClose: (tab: OpenTab) => Promise<void>
  onReorder: (
    tab: OpenTab,
    destination: OpenTabMoveDestination,
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
  const [optimisticMove, setOptimisticMove] = useState<OptimisticTabMove>()
  const [dragPreviewWindows, setDragPreviewWindows] =
    useState<Array<OpenTabWindow>>()
  const [moveErrorWindowId, setMoveErrorWindowId] = useState<number>()
  const moveVersionRef = useRef(0)
  const dragDestinationRef = useRef<SortableTabData | null>(null)
  const dragSnapshotWindowsRef = useRef<Array<OpenTabWindow> | null>(null)
  const dragSourceDataRef = useRef<SortableTabData | null>(null)
  const displayWindows =
    dragPreviewWindows ?? optimisticMove?.windows ?? windows

  useEffect(() => {
    if (!optimisticMove) return

    const destinationWindow = windows.find(
      (window) => window.id === optimisticMove.destinationWindowId,
    )
    const destinationTabIds = destinationWindow?.tabs.map((tab) => tab.id)
    if (
      destinationTabIds?.length ===
        optimisticMove.destinationWindowTabIds.length &&
      destinationTabIds.every(
        (tabId, index) =>
          tabId === optimisticMove.destinationWindowTabIds[index],
      )
    ) {
      setOptimisticMove(undefined)
    }
  }, [optimisticMove, windows])

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

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation
    const sourceData = source?.data as SortableTabData | undefined
    const targetData = target?.data as SortableTabData | undefined
    if (
      !source ||
      !target ||
      source.id === target.id ||
      !sourceData ||
      !targetData
    ) {
      return
    }

    if (sourceData.sortType !== targetData.sortType) return
    dragDestinationRef.current = targetData
    if (sourceData.windowId === targetData.windowId) return

    setDragPreviewWindows((current) => {
      const currentWindows =
        current ?? dragSnapshotWindowsRef.current ?? windows
      const sourceWindow = currentWindows.find((window) =>
        window.tabs.some((tab) => tab.id === sourceData.tab.id),
      )
      const sourceEntry = sourceWindow
        ? getSortableTabEntries(sourceWindow.tabs).find(
            (entry) => entry.tab.id === sourceData.tab.id,
          )
        : undefined
      if (
        sourceWindow?.id === targetData.windowId &&
        sourceEntry?.sortGroup === targetData.sortGroup &&
        sourceEntry.sortIndex === targetData.sortIndex
      ) {
        return current
      }

      return (
        projectOpenTabMove({
          destinationSortGroup: targetData.sortGroup,
          destinationSortIndex: targetData.sortIndex,
          destinationWindowId: targetData.windowId,
          sourceTabId: sourceData.tab.id,
          windows: currentWindows,
        })?.windows ?? current
      )
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    dragDestinationRef.current = null
    dragSnapshotWindowsRef.current = windows
    dragSourceDataRef.current =
      (event.operation.source?.data as SortableTabData | undefined) ?? null
    setDragPreviewWindows(undefined)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const previewWindows = dragPreviewWindows
    const snapshotWindows = dragSnapshotWindowsRef.current ?? windows
    const initialSourceData = dragSourceDataRef.current
    setDragPreviewWindows(undefined)
    dragSnapshotWindowsRef.current = null
    dragSourceDataRef.current = null
    if (event.canceled || !isSortableOperation(event.operation)) {
      dragDestinationRef.current = null
      return
    }

    const { source } = event.operation
    const sourceData = source?.data as SortableTabData | undefined
    if (!source || !sourceData) return

    const originData = initialSourceData ?? sourceData
    const finalWindows = previewWindows ?? displayWindows
    const finalSourceWindow = finalWindows.find((window) =>
      window.tabs.some((tab) => tab.id === sourceData.tab.id),
    )
    const finalSourceEntry = finalSourceWindow
      ? getSortableTabEntries(finalSourceWindow.tabs).find(
          (entry) => entry.tab.id === sourceData.tab.id,
        )
      : undefined
    const projectedSortGroup =
      finalSourceEntry?.sortGroup ?? String(source.group)
    const projectedDestinationEntry = finalWindows
      .flatMap((window) => getSortableTabEntries(window.tabs))
      .find((entry) => entry.sortGroup === projectedSortGroup)
    const observedDestination = dragDestinationRef.current
    dragDestinationRef.current = null
    const hasProjectedDestination = projectedDestinationEntry !== undefined
    const destinationSortGroup = hasProjectedDestination
      ? projectedSortGroup
      : (observedDestination?.sortGroup ?? projectedSortGroup)
    const destinationEntry = hasProjectedDestination
      ? projectedDestinationEntry
      : (observedDestination ?? projectedDestinationEntry)
    if (!destinationEntry) return

    const destinationWindowId = destinationEntry.tab.windowId
    const isSameWindow = originData.windowId === destinationWindowId
    const canMoveToTarget = isSameWindow
      ? originData.sortGroup === destinationSortGroup
      : originData.sortType === destinationEntry.sortType
    const destinationSortIndex = hasProjectedDestination
      ? source.index
      : destinationEntry.sortIndex
    if (
      !canMoveToTarget ||
      (isSameWindow &&
        originData.sortIndex === destinationSortIndex &&
        originData.sortGroup === destinationSortGroup)
    ) {
      return
    }

    const projection = projectOpenTabMove({
      destinationSortGroup,
      destinationSortIndex,
      destinationWindowId,
      sourceTabId: originData.tab.id,
      windows: snapshotWindows,
    })
    if (!projection) return

    const destinationWindow = projection.windows.find(
      (window) => window.id === destinationWindowId,
    )
    if (!destinationWindow) return

    const version = moveVersionRef.current + 1
    moveVersionRef.current = version
    setMoveErrorWindowId(undefined)
    setOptimisticMove({
      destinationWindowId,
      destinationWindowTabIds: destinationWindow.tabs.map((tab) => tab.id),
      windows: projection.windows,
    })

    void onReorder(originData.tab, projection.destination).catch(() => {
      if (moveVersionRef.current !== version) return
      setOptimisticMove(undefined)
      setMoveErrorWindowId(destinationWindowId)
    })
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
      <DragDropProvider
        sensors={FULL_ROW_SORTABLE_SENSORS}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="tab-window-sections">
          {displayWindows.map((window, index) => (
            <SortableTabWindow
              key={window.id}
              bookmarkedUrlKeys={bookmarkedUrlKeys}
              canCapture={canCapture}
              canClose={canClose}
              canReorder={canReorder}
              captureStatuses={captureStatuses}
              closeStatuses={closeStatuses}
              displayNumber={index + 1}
              hasMoveError={moveErrorWindowId === window.id}
              hasPendingMove={optimisticMove !== undefined}
              window={window}
              onActivate={onActivate}
              onCapture={(candidate) => void captureTab(candidate)}
              onClose={(candidate) => void closeTab(candidate)}
            />
          ))}
        </div>
        <DragOverlay
          className="open-tab-drag-overlay"
          dropAnimation={{
            duration: 180,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {(source) => (
            <TabDragPreview tab={(source.data as SortableTabData).tab} />
          )}
        </DragOverlay>
      </DragDropProvider>

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
