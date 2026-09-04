import type {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SortableTree,
  SortableTreeDropZone,
  SortableTreeItem,
} from '../../components/sortable-tree'
import type { SortableTreeItemState } from '../../components/sortable-tree'
import {
  buildBookmarkTreeIndex,
  canMoveBookmarkNode,
  canUseBookmarkDropTarget,
  getBookmarkNodePosition,
  isSameBookmarkTreePosition,
  projectBookmarkNodeMove,
} from './bookmark-drag'
import type {
  BookmarkDropProjection,
  BookmarkDropTarget,
  BookmarkTreePosition,
} from './bookmark-drag'
import {
  BookmarkSortableTreeContext,
  useBookmarkSortableTree,
} from './bookmark-sortable-tree-context'
import type { BookmarkSortableTreeContextValue } from './bookmark-sortable-tree-context'
import { moveBookmarkNode } from './chrome-bookmarks'
import type { BookmarkNode } from './model'

interface BookmarkDragData extends Record<string, unknown> {
  bookmarkDropTarget: BookmarkDropTarget
}

interface FolderExpansionSnapshot {
  id: string
  wasCollapsed: boolean
}

interface BookmarkDragSession {
  activeId: string
  expansion?: FolderExpansionSnapshot
  projection: BookmarkDropProjection | null
  snapshot: Array<BookmarkNode>
}

interface PendingBookmarkMove {
  id: string
  position: BookmarkTreePosition
}

function isBookmarkDragData(value: unknown): value is BookmarkDragData {
  if (!value || typeof value !== 'object') return false
  if (!('bookmarkDropTarget' in value)) return false

  const target = value.bookmarkDropTarget
  return Boolean(
    target &&
    typeof target === 'object' &&
    'type' in target &&
    (target.type === 'node' || target.type === 'container'),
  )
}

function getDomBookmarkDropTargetAtPoint({ x, y }: { x: number; y: number }) {
  if (
    typeof document === 'undefined' ||
    typeof document.elementsFromPoint !== 'function'
  ) {
    return null
  }

  for (const element of globalThis.document.elementsFromPoint(x, y)) {
    const explicitNode = element.closest<HTMLElement>(
      '[data-bookmark-drop-node-id][data-bookmark-drop-mode]',
    )
    const explicitNodeId = explicitNode?.dataset.bookmarkDropNodeId
    const explicitMode = explicitNode?.dataset.bookmarkDropMode
    if (
      explicitNode &&
      explicitNodeId &&
      (explicitMode === 'before' ||
        explicitMode === 'after' ||
        explicitMode === 'inside')
    ) {
      return {
        rectangle: explicitNode.getBoundingClientRect(),
        target: {
          type: 'node',
          id: explicitNodeId,
          mode: explicitMode,
        } satisfies BookmarkDropTarget,
      }
    }

    const container = element.closest<HTMLElement>(
      '[data-bookmark-drop-parent-id][data-bookmark-drop-edge]',
    )
    const parentId = container?.dataset.bookmarkDropParentId
    const edge = container?.dataset.bookmarkDropEdge
    if (container && parentId && (edge === 'start' || edge === 'end')) {
      return {
        rectangle: container.getBoundingClientRect(),
        target: {
          type: 'container',
          edge,
          parentId,
        } satisfies BookmarkDropTarget,
      }
    }

    const bookmark = element.closest<HTMLElement>('[data-bookmark-id]')
    const bookmarkId = bookmark?.dataset.bookmarkId
    if (bookmark && bookmarkId) {
      return {
        rectangle: bookmark.getBoundingClientRect(),
        target: { type: 'node', id: bookmarkId } satisfies BookmarkDropTarget,
      }
    }

    const folderHeader = element.closest<HTMLElement>('.bookmark-group-header')
    const folder = folderHeader?.closest<HTMLElement>('[data-folder-id]')
    const folderId = folder?.dataset.folderId
    if (folderHeader && folderId) {
      return {
        rectangle: folderHeader.getBoundingClientRect(),
        target: { type: 'node', id: folderId } satisfies BookmarkDropTarget,
      }
    }
  }

  return null
}

function getOperationProjection(
  operation: DragMoveEvent['operation'],
  session: BookmarkDragSession,
  isInsideManagedTree: boolean,
) {
  const pointer = operation.position.current
  const isPointerOperation =
    typeof globalThis.PointerEvent !== 'undefined' &&
    operation.activatorEvent instanceof globalThis.PointerEvent
  const domTarget = isPointerOperation
    ? getDomBookmarkDropTargetAtPoint(pointer)
    : null
  const operationTarget = operation.target
  const operationRectangle = operationTarget?.shape?.boundingRectangle
  const fallbackTarget =
    operationTarget &&
    operationRectangle &&
    isBookmarkDragData(operationTarget.data)
      ? {
          rectangle: operationRectangle,
          target: operationTarget.data.bookmarkDropTarget,
        }
      : null
  const hit = isPointerOperation ? domTarget : fallbackTarget
  if (!hit) return null

  if (
    hit.target.type === 'node' &&
    hit.target.id === session.activeId &&
    hit.target.mode === undefined &&
    session.projection
  ) {
    return session.projection
  }

  if (
    import.meta.env.DEV &&
    new URLSearchParams(globalThis.location.search).has('bookmark-dnd-demo')
  ) {
    globalThis.document.documentElement.dataset.bookmarkDndProjection =
      JSON.stringify({
        pointerY: pointer.y,
        rectangle: {
          height: hit.rectangle.height,
          top: hit.rectangle.top,
        },
        target: hit.target,
      })
  }

  return projectBookmarkNodeMove({
    draggedId: session.activeId,
    isInsideManagedTree,
    pointerY: pointer.y,
    rectangle: {
      height: hit.rectangle.height,
      top: hit.rectangle.top,
    },
    roots: session.snapshot,
    target: hit.target,
  })
}

function isSameProjection(
  first: BookmarkDropProjection | null,
  second: BookmarkDropProjection | null,
) {
  if (!first || !second) return first === second
  return (
    first.mode === second.mode &&
    first.targetId === second.targetId &&
    isSameBookmarkTreePosition(first.position, second.position)
  )
}

export function BookmarkSortableTree({
  canMove,
  children,
  isInsideManagedTree = false,
  renderOverlay,
  roots,
}: {
  canMove: boolean
  children: (previewTree: Array<BookmarkNode>) => ReactNode
  isInsideManagedTree?: boolean
  renderOverlay: (node: BookmarkNode) => ReactNode
  roots: Array<BookmarkNode>
}) {
  const { t } = useTranslation()
  const [previewTree, setPreviewTree] = useState<Array<BookmarkNode> | null>(
    null,
  )
  const [activeNode, setActiveNode] = useState<BookmarkNode | null>(null)
  const [projection, setProjection] = useState<BookmarkDropProjection | null>(
    null,
  )
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [hasMoveError, setHasMoveError] = useState(false)
  const rootsRef = useRef(roots)
  const collapsedFolderIdsRef = useRef(collapsedFolderIds)
  const sessionRef = useRef<BookmarkDragSession | null>(null)
  const pendingMoveRef = useRef<PendingBookmarkMove | null>(null)
  const displayTree = previewTree ?? roots
  const tree = useMemo(
    () => buildBookmarkTreeIndex(displayTree, isInsideManagedTree),
    [displayTree, isInsideManagedTree],
  )

  rootsRef.current = roots
  collapsedFolderIdsRef.current = collapsedFolderIds

  useEffect(() => {
    const pendingMove = pendingMoveRef.current
    if (!pendingMove) return

    const actualPosition = getBookmarkNodePosition(
      roots,
      pendingMove.id,
      isInsideManagedTree,
    )
    if (
      actualPosition &&
      isSameBookmarkTreePosition(actualPosition, pendingMove.position)
    ) {
      pendingMoveRef.current = null
      setPreviewTree(null)
    }
  }, [isInsideManagedTree, roots])

  const restoreFolderExpansion = useCallback(
    (expansion: FolderExpansionSnapshot | undefined) => {
      if (!expansion) return
      setCollapsedFolderIds((current) => {
        const next = new Set(current)
        if (expansion.wasCollapsed) next.add(expansion.id)
        else next.delete(expansion.id)
        return next
      })
    },
    [],
  )

  const clearTransientDragState = useCallback(
    (session: BookmarkDragSession) => {
      restoreFolderExpansion(session.expansion)
      sessionRef.current = null
      setActiveNode(null)
      setProjection(null)
    },
    [restoreFolderExpansion],
  )

  const restoreSnapshot = useCallback((session: BookmarkDragSession) => {
    setPreviewTree(
      session.snapshot === rootsRef.current ? null : session.snapshot,
    )
  }, [])

  const applyOperationProjection = useCallback(
    (operation: DragMoveEvent['operation'], clearWhenMissing: boolean) => {
      const session = sessionRef.current
      if (!session) return

      const nextProjection = getOperationProjection(
        operation,
        session,
        isInsideManagedTree,
      )
      if (!nextProjection && !clearWhenMissing) return
      if (isSameProjection(session.projection, nextProjection)) return

      session.projection = nextProjection
      setProjection(nextProjection)
      setPreviewTree(nextProjection?.tree ?? session.snapshot)
    },
    [isInsideManagedTree],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const sourceId = event.operation.source?.id
      if (sourceId === undefined || !canMove) return

      const activeId = String(sourceId)
      const snapshot = rootsRef.current
      const snapshotIndex = buildBookmarkTreeIndex(
        snapshot,
        isInsideManagedTree,
      )
      const activeEntry = snapshotIndex.entriesById.get(activeId)
      if (!activeEntry || !canMoveBookmarkNode(snapshotIndex, activeId)) return

      const expansion =
        activeEntry.node.url === undefined
          ? {
              id: activeId,
              wasCollapsed: collapsedFolderIdsRef.current.has(activeId),
            }
          : undefined
      const session: BookmarkDragSession = {
        activeId,
        expansion,
        projection: null,
        snapshot,
      }
      sessionRef.current = session
      pendingMoveRef.current = null
      setHasMoveError(false)
      setActiveNode(activeEntry.node)
      setProjection(null)
      setPreviewTree(snapshot)

      if (expansion && !expansion.wasCollapsed) {
        setCollapsedFolderIds((current) => new Set(current).add(activeId))
      }
    },
    [canMove, isInsideManagedTree],
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      applyOperationProjection(event.operation, false)
    },
    [applyOperationProjection],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // The preview tree is the only source of ordering. Prevent dnd-kit's
      // optimistic DOM reparenting from creating a second, competing layout.
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
        : getOperationProjection(event.operation, session, isInsideManagedTree)
      clearTransientDragState(session)

      if (event.canceled || !finalProjection || finalProjection.isNoop) {
        pendingMoveRef.current = null
        restoreSnapshot(session)
        return
      }

      setPreviewTree(finalProjection.tree)
      pendingMoveRef.current = {
        id: session.activeId,
        position: finalProjection.position,
      }

      void moveBookmarkNode({
        id: session.activeId,
        index: finalProjection.position.index,
        parentId: finalProjection.position.parentId,
      }).catch(() => {
        pendingMoveRef.current = null
        restoreSnapshot(session)
        setHasMoveError(true)
      })
    },
    [clearTransientDragState, isInsideManagedTree, restoreSnapshot],
  )

  const activeId = activeNode?.id ?? null
  const canDrag = useCallback(
    (id: string) => canMove && canMoveBookmarkNode(tree, id),
    [canMove, tree],
  )
  const canDrop = useCallback(
    (target: BookmarkDropTarget) => {
      if (!canMove) return false
      if (activeId) return canUseBookmarkDropTarget(tree, activeId, target)

      if (target.type === 'container') {
        const parent = tree.entriesById.get(target.parentId)
        return Boolean(parent && !parent.isManaged && !parent.node.url)
      }

      const targetEntry = tree.entriesById.get(target.id)
      return Boolean(targetEntry && !targetEntry.isManaged)
    },
    [activeId, canMove, tree],
  )
  const setFolderExpanded = useCallback((id: string, expanded: boolean) => {
    setCollapsedFolderIds((current) => {
      if (current.has(id) === !expanded) return current
      const next = new Set(current)
      if (expanded) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const contextValue = useMemo<BookmarkSortableTreeContextValue>(
    () => ({
      activeId,
      canDrag,
      canDrop,
      collapsedFolderIds,
      projection,
      setFolderExpanded,
      tree,
    }),
    [
      activeId,
      canDrag,
      canDrop,
      collapsedFolderIds,
      projection,
      setFolderExpanded,
      tree,
    ],
  )

  return (
    <BookmarkSortableTreeContext.Provider value={contextValue}>
      <SortableTree
        overlay={activeNode ? renderOverlay(activeNode) : null}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <div
          className={`bookmark-sortable-tree${activeNode ? ' is-dragging' : ''}`}
        >
          {children(displayTree)}
        </div>
      </SortableTree>
      {hasMoveError ? (
        <p className="bookmark-sort-error" role="alert">
          {t('bookmarks.errors.sortFailed')}
        </p>
      ) : null}
    </BookmarkSortableTreeContext.Provider>
  )
}

export function BookmarkSortableItem({
  children,
  id,
  index,
  parentId,
}: {
  children: (state: SortableTreeItemState) => ReactNode
  id: string
  index: number
  parentId: string
}) {
  const context = useBookmarkSortableTree()
  const target = useMemo<BookmarkDropTarget>(() => ({ type: 'node', id }), [id])

  return (
    <SortableTreeItem
      id={id}
      index={index}
      group={parentId}
      data={{ bookmarkDropTarget: target } satisfies BookmarkDragData}
      dragDisabled={!context.canDrag(id)}
      dropDisabled={context.activeId === id || !context.canDrop(target)}
    >
      {children}
    </SortableTreeItem>
  )
}

export function BookmarkContainerDropZone({
  children,
  edge,
  parentId,
  zoneId,
}: {
  children: (state: {
    isDropTarget: boolean
    setNodeRef: (element: Element | null) => void
  }) => ReactNode
  edge: 'end' | 'start'
  parentId: string
  zoneId: string
}) {
  const context = useBookmarkSortableTree()
  const target = useMemo<BookmarkDropTarget>(
    () => ({ type: 'container', edge, parentId }),
    [edge, parentId],
  )

  return (
    <SortableTreeDropZone
      id={`bookmark-container:${parentId}:${edge}:${zoneId}`}
      data={{ bookmarkDropTarget: target } satisfies BookmarkDragData}
      disabled={!context.canDrop(target)}
    >
      {children}
    </SortableTreeDropZone>
  )
}

export function BookmarkNodeDropZone({
  children,
  mode,
  nodeId,
  zoneId,
}: {
  children: (state: {
    isDropTarget: boolean
    setNodeRef: (element: Element | null) => void
  }) => ReactNode
  mode: 'after' | 'before' | 'inside'
  nodeId: string
  zoneId: string
}) {
  const context = useBookmarkSortableTree()
  const target = useMemo<BookmarkDropTarget>(
    () => ({ type: 'node', id: nodeId, mode }),
    [mode, nodeId],
  )

  return (
    <SortableTreeDropZone
      id={`bookmark-node-zone:${nodeId}:${mode}:${zoneId}`}
      data={{ bookmarkDropTarget: target } satisfies BookmarkDragData}
      disabled={!context.canDrop(target)}
    >
      {children}
    </SortableTreeDropZone>
  )
}

export function BookmarkListDropBoundaries({ parentId }: { parentId: string }) {
  return (
    <>
      <BookmarkContainerDropZone
        edge="start"
        parentId={parentId}
        zoneId="list-start"
      >
        {({ isDropTarget, setNodeRef }) => (
          <span
            ref={setNodeRef}
            className={`bookmark-list-drop-boundary is-start${isDropTarget ? ' is-drop-target' : ''}`}
            data-bookmark-drop-edge="start"
            data-bookmark-drop-parent-id={parentId}
            data-bookmark-drop-zone="list-start"
            aria-hidden="true"
          />
        )}
      </BookmarkContainerDropZone>
      <BookmarkContainerDropZone
        edge="end"
        parentId={parentId}
        zoneId="list-end"
      >
        {({ isDropTarget, setNodeRef }) => (
          <span
            ref={setNodeRef}
            className={`bookmark-list-drop-boundary is-end${isDropTarget ? ' is-drop-target' : ''}`}
            data-bookmark-drop-edge="end"
            data-bookmark-drop-parent-id={parentId}
            data-bookmark-drop-zone="list-end"
            aria-hidden="true"
          />
        )}
      </BookmarkContainerDropZone>
    </>
  )
}
