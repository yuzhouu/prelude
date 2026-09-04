import type {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SortableTree,
  SortableTreeDropZone,
  SortableTreeItem,
} from '../../components/sortable-tree'
import type { SortableTreeItemState } from '../../components/sortable-tree'
import type { OpenTab, OpenTabWindow } from './model'
import {
  canUseOpenTabDropTarget,
  getOpenTabPosition,
  isSameOpenTabPosition,
  projectOpenTabMove,
} from './tab-drag'
import type {
  OpenTabDropProjection,
  OpenTabDropTarget,
  OpenTabMoveDestination,
  OpenTabPosition,
} from './tab-drag'

interface OpenTabDragData extends Record<string, unknown> {
  openTabDropTarget: OpenTabDropTarget
}

interface OpenTabDragSession {
  activeId: number
  projection: OpenTabDropProjection | null
  snapshot: Array<OpenTabWindow>
}

interface PendingOpenTabMove {
  id: number
  position: OpenTabPosition
}

interface OpenTabSortableContextValue {
  activeId: number | null
  canDrag: (id: number) => boolean
  canDrop: (target: OpenTabDropTarget) => boolean
}

const OpenTabSortableContext =
  createContext<OpenTabSortableContextValue | null>(null)

function useOpenTabSortableContext() {
  const context = useContext(OpenTabSortableContext)
  if (!context) {
    throw new Error('Tab drag components must be rendered inside their list.')
  }
  return context
}

function isOpenTabDragData(value: unknown): value is OpenTabDragData {
  if (!value || typeof value !== 'object' || !('openTabDropTarget' in value)) {
    return false
  }

  const target = value.openTabDropTarget
  return Boolean(
    target &&
    typeof target === 'object' &&
    'type' in target &&
    (target.type === 'tab' || target.type === 'window'),
  )
}

function getDomOpenTabDropTargetAtPoint({ x, y }: { x: number; y: number }) {
  if (
    typeof document === 'undefined' ||
    typeof document.elementsFromPoint !== 'function'
  ) {
    return null
  }

  for (const element of document.elementsFromPoint(x, y)) {
    const boundary = element.closest<HTMLElement>(
      '[data-open-tab-drop-window-id][data-open-tab-drop-edge]',
    )
    const windowId = Number(boundary?.dataset.openTabDropWindowId)
    const edge = boundary?.dataset.openTabDropEdge
    if (
      boundary &&
      Number.isFinite(windowId) &&
      (edge === 'start' || edge === 'end')
    ) {
      return {
        rectangle: boundary.getBoundingClientRect(),
        target: {
          type: 'window',
          edge,
          windowId,
        } satisfies OpenTabDropTarget,
      }
    }

    const row = element.closest<HTMLElement>('[data-open-tab-drop-id]')
    const id = Number(row?.dataset.openTabDropId)
    if (row && Number.isFinite(id)) {
      return {
        rectangle: row.getBoundingClientRect(),
        target: { type: 'tab', id } satisfies OpenTabDropTarget,
      }
    }
  }

  return null
}

function getOperationProjection(
  operation: DragMoveEvent['operation'],
  session: OpenTabDragSession,
) {
  const pointer = operation.position.current
  const isPointerOperation =
    typeof globalThis.PointerEvent !== 'undefined' &&
    operation.activatorEvent instanceof globalThis.PointerEvent
  const domTarget = isPointerOperation
    ? getDomOpenTabDropTargetAtPoint(pointer)
    : null
  const operationTarget = operation.target
  const operationRectangle = operationTarget?.shape?.boundingRectangle
  const fallbackTarget =
    operationTarget &&
    operationRectangle &&
    isOpenTabDragData(operationTarget.data)
      ? {
          rectangle: operationRectangle,
          target: operationTarget.data.openTabDropTarget,
        }
      : null
  const hit = isPointerOperation ? domTarget : fallbackTarget
  if (!hit) return null

  if (
    hit.target.type === 'tab' &&
    hit.target.id === session.activeId &&
    hit.target.mode === undefined &&
    session.projection
  ) {
    return session.projection
  }

  if (
    import.meta.env.DEV &&
    new URLSearchParams(globalThis.location.search).has('tab-dnd-demo')
  ) {
    document.documentElement.dataset.tabDndProjection = JSON.stringify({
      pointerY: pointer.y,
      rectangle: {
        height: hit.rectangle.height,
        top: hit.rectangle.top,
      },
      target: hit.target,
    })
  }

  return projectOpenTabMove({
    draggedId: session.activeId,
    pointerY: pointer.y,
    rectangle: {
      height: hit.rectangle.height,
      top: hit.rectangle.top,
    },
    target: hit.target,
    windows: session.snapshot,
  })
}

function isSameProjection(
  first: OpenTabDropProjection | null,
  second: OpenTabDropProjection | null,
) {
  if (!first || !second) return first === second
  return (
    first.mode === second.mode &&
    first.targetId === second.targetId &&
    isSameOpenTabPosition(first.position, second.position)
  )
}

export function OpenTabSortableWindows({
  canMove,
  children,
  onMove,
  renderOverlay,
  windows,
}: {
  canMove: boolean
  children: (previewWindows: Array<OpenTabWindow>) => ReactNode
  onMove: (
    tab: OpenTab,
    destination: OpenTabMoveDestination,
    projectedWindows: Array<OpenTabWindow>,
  ) => Promise<void>
  renderOverlay: (tab: OpenTab) => ReactNode
  windows: Array<OpenTabWindow>
}) {
  const { t } = useTranslation()
  const [previewWindows, setPreviewWindows] =
    useState<Array<OpenTabWindow> | null>(null)
  const [activeTab, setActiveTab] = useState<OpenTab | null>(null)
  const [projection, setProjection] = useState<OpenTabDropProjection | null>(
    null,
  )
  const [hasMoveError, setHasMoveError] = useState(false)
  const windowsRef = useRef(windows)
  const sessionRef = useRef<OpenTabDragSession | null>(null)
  const pendingMoveRef = useRef<PendingOpenTabMove | null>(null)
  const displayWindows = previewWindows ?? windows

  windowsRef.current = windows

  useEffect(() => {
    const pendingMove = pendingMoveRef.current
    if (!pendingMove) return

    const actualPosition = getOpenTabPosition(windows, pendingMove.id)
    if (
      actualPosition &&
      isSameOpenTabPosition(actualPosition, pendingMove.position)
    ) {
      pendingMoveRef.current = null
      setPreviewWindows(null)
    }
  }, [windows])

  const clearTransientDragState = useCallback(() => {
    sessionRef.current = null
    setActiveTab(null)
    setProjection(null)
  }, [])

  const restoreSnapshot = useCallback((session: OpenTabDragSession) => {
    setPreviewWindows(
      session.snapshot === windowsRef.current ? null : session.snapshot,
    )
  }, [])

  const applyOperationProjection = useCallback(
    (operation: DragMoveEvent['operation'], clearWhenMissing: boolean) => {
      const session = sessionRef.current
      if (!session) return

      const nextProjection = getOperationProjection(operation, session)
      if (!nextProjection && !clearWhenMissing) return
      if (isSameProjection(session.projection, nextProjection)) return

      session.projection = nextProjection
      setProjection(nextProjection)
      setPreviewWindows(nextProjection?.windows ?? session.snapshot)
    },
    [],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const sourceId = Number(event.operation.source?.id)
      if (!canMove || !Number.isFinite(sourceId)) return

      const snapshot = windowsRef.current
      const sourceTab = snapshot
        .flatMap((window) => window.tabs)
        .find((tab) => tab.id === sourceId)
      if (!sourceTab) return

      const session: OpenTabDragSession = {
        activeId: sourceId,
        projection: null,
        snapshot,
      }
      sessionRef.current = session
      pendingMoveRef.current = null
      setHasMoveError(false)
      setActiveTab(sourceTab)
      setProjection(null)
      setPreviewWindows(snapshot)
    },
    [canMove],
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      applyOperationProjection(event.operation, false)
    },
    [applyOperationProjection],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      event.preventDefault()
      applyOperationProjection(event.operation, true)
    },
    [applyOperationProjection],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const session = sessionRef.current
      if (!session) return

      const finalProjection = event.canceled
        ? null
        : getOperationProjection(event.operation, session)
      const sourceTab = session.snapshot
        .flatMap((window) => window.tabs)
        .find((tab) => tab.id === session.activeId)
      clearTransientDragState()

      if (
        event.canceled ||
        !sourceTab ||
        !finalProjection ||
        finalProjection.isNoop
      ) {
        pendingMoveRef.current = null
        restoreSnapshot(session)
        return
      }

      setPreviewWindows(finalProjection.windows)
      pendingMoveRef.current = {
        id: session.activeId,
        position: finalProjection.position,
      }

      void onMove(
        sourceTab,
        finalProjection.destination,
        finalProjection.windows,
      ).catch(() => {
        pendingMoveRef.current = null
        restoreSnapshot(session)
        setHasMoveError(true)
      })
    },
    [clearTransientDragState, onMove, restoreSnapshot],
  )

  const activeId = activeTab?.id ?? null
  const canDrag = useCallback(() => canMove, [canMove])
  const canDrop = useCallback(
    (target: OpenTabDropTarget) =>
      canMove &&
      (activeId === null ||
        canUseOpenTabDropTarget(displayWindows, activeId, target)),
    [activeId, canMove, displayWindows],
  )
  const contextValue = useMemo<OpenTabSortableContextValue>(
    () => ({ activeId, canDrag, canDrop }),
    [activeId, canDrag, canDrop],
  )

  return (
    <OpenTabSortableContext.Provider value={contextValue}>
      <SortableTree
        overlay={activeTab ? renderOverlay(activeTab) : null}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <div
          className={`open-tab-sortable-windows${activeTab ? ' is-dragging' : ''}`}
          data-open-tab-projection-window={projection?.position.windowId}
          data-open-tab-projection-index={projection?.position.index}
        >
          {children(displayWindows)}
        </div>
      </SortableTree>
      {hasMoveError ? (
        <p className="open-tab-sort-error" role="alert">
          {t('tabs.errors.sortFailed')}
        </p>
      ) : null}
    </OpenTabSortableContext.Provider>
  )
}

export function OpenTabSortableItem({
  children,
  id,
  index,
  windowId,
}: {
  children: (state: SortableTreeItemState) => ReactNode
  id: number
  index: number
  windowId: number
}) {
  const context = useOpenTabSortableContext()
  const target = useMemo<OpenTabDropTarget>(() => ({ type: 'tab', id }), [id])

  return (
    <SortableTreeItem
      id={String(id)}
      index={index}
      group={String(windowId)}
      data={{ openTabDropTarget: target } satisfies OpenTabDragData}
      dragDisabled={!context.canDrag(id)}
      dropDisabled={context.activeId === id || !context.canDrop(target)}
    >
      {children}
    </SortableTreeItem>
  )
}

export function OpenTabWindowDropZone({
  children,
  edge,
  windowId,
  zoneId,
}: {
  children: (state: {
    isDropTarget: boolean
    setNodeRef: (element: Element | null) => void
  }) => ReactNode
  edge: 'end' | 'start'
  windowId: number
  zoneId: string
}) {
  const context = useOpenTabSortableContext()
  const target = useMemo<OpenTabDropTarget>(
    () => ({ type: 'window', edge, windowId }),
    [edge, windowId],
  )

  return (
    <SortableTreeDropZone
      id={`open-tab-window:${windowId}:${edge}:${zoneId}`}
      data={{ openTabDropTarget: target } satisfies OpenTabDragData}
      disabled={!context.canDrop(target)}
    >
      {children}
    </SortableTreeDropZone>
  )
}
