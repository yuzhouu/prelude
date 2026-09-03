import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
  LoaderCircle,
  PanelsTopLeft,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { normalizeCapturedUrl } from '../capture/model'
import type { OpenTab, OpenTabWindow } from '../tabs/model'
import {
  createBookmark,
  createBookmarkFolder,
  deleteBookmark,
  deleteBookmarkFolder,
  moveBookmarkNode,
  updateBookmark,
} from './chrome-bookmarks'
import { BookmarkFavicon } from './bookmark-favicon'
import {
  buildBookmarkTreeIndex,
  canMoveBookmarkNode,
  resolveBookmarkBoundaryPlacement,
  resolveBookmarkNodePlacement,
} from './bookmark-drag'
import type {
  BookmarkDropPlacement,
  BookmarkNodeDropZone,
  BookmarkTreeIndex,
} from './bookmark-drag'
import { countBookmarks, countChildFolders } from './model'
import type { BookmarkMatch, BookmarkNode } from './model'

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function normalizeBookmarkUrl(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return undefined

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`

  try {
    const url = new URL(candidate)
    if (!['http:', 'https:', 'chrome:', 'file:'].includes(url.protocol)) {
      return undefined
    }
    return url.toString()
  } catch {
    return undefined
  }
}

function getDefaultBookmarkTitle(url: string) {
  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.hostname.replace(/^www\./, '') ||
      parsedUrl.pathname.split('/').filter(Boolean).at(-1) ||
      url
    )
  } catch {
    return url
  }
}

interface BookmarkOpenTabContextValue {
  openTabsByUrl: ReadonlyMap<string, OpenTab>
  onActivateTab: (tab: OpenTab) => void
}

const BookmarkOpenTabContext = createContext<
  BookmarkOpenTabContextValue | undefined
>(undefined)

export function BookmarkOpenTabScope({
  children,
  openTabWindows,
  onActivateTab,
}: {
  children: React.ReactNode
  openTabWindows: Array<OpenTabWindow>
  onActivateTab: (tab: OpenTab) => void
}) {
  const openTabsByUrl = useMemo(() => {
    const tabsByUrl = new Map<string, OpenTab>()

    for (const window of openTabWindows) {
      for (const tab of window.tabs) {
        const urlKey = normalizeCapturedUrl(tab.url)
        if (!tabsByUrl.has(urlKey)) tabsByUrl.set(urlKey, tab)
      }
    }

    return tabsByUrl
  }, [openTabWindows])
  const contextValue = useMemo(
    () => ({ openTabsByUrl, onActivateTab }),
    [onActivateTab, openTabsByUrl],
  )

  return (
    <BookmarkOpenTabContext.Provider value={contextValue}>
      {children}
    </BookmarkOpenTabContext.Provider>
  )
}

type BookmarkDragKind = 'bookmark' | 'folder'

interface BookmarkDragSession {
  id: string
  kind: BookmarkDragKind
  node: BookmarkNode
}

interface BookmarkPointerDrag {
  pointerId: number
  session: BookmarkDragSession
  source: HTMLElement
  startX: number
  startY: number
  started: boolean
}

interface BookmarkDragContextValue {
  collapsedFolderIds: ReadonlySet<string>
  draggedId: string | null
  draggedKind: BookmarkDragKind | null
  draggedNode: BookmarkNode | null
  dropPlacement: BookmarkDropPlacement | null
  canDrag: (id: string) => boolean
  canDropAtBoundary: (parentId: string, index: number) => boolean
  onPointerDown: (
    event: ReactPointerEvent<HTMLElement>,
    node: BookmarkNode,
  ) => void
  setFolderExpanded: (id: string, expanded: boolean) => void
}

const BookmarkDragContext = createContext<BookmarkDragContextValue | undefined>(
  undefined,
)

function getNodeDropZone(
  element: HTMLElement,
  clientY: number,
  node: BookmarkNode,
  isFirstSibling: boolean,
): BookmarkNodeDropZone {
  const rect = element.getBoundingClientRect()
  const progress = rect.height ? (clientY - rect.top) / rect.height : 0.5

  if (node.url !== undefined) return progress < 0.5 ? 'before' : 'after'
  if (progress < (isFirstSibling ? 0.42 : 0.28)) return 'before'
  if (progress > 0.72) return 'after'
  return 'inside'
}

function positionDragCursorPreview(
  element: HTMLDivElement,
  clientX: number,
  clientY: number,
  kind: BookmarkDragKind,
) {
  const previewWidth = Math.min(340, window.innerWidth - 16)
  const previewHeight = kind === 'folder' ? 39 : 52
  const left =
    clientX + previewWidth + 22 <= window.innerWidth
      ? clientX + 14
      : clientX - previewWidth - 14
  const top =
    clientY + previewHeight + 22 <= window.innerHeight
      ? clientY + 14
      : clientY - previewHeight - 14
  element.style.transform = `translate3d(${Math.max(8, left)}px, ${Math.max(8, top)}px, 0)`
}

function BookmarkDragScope({
  canMove,
  children,
  isInsideManagedTree = false,
  roots,
}: {
  canMove: boolean
  children: React.ReactNode
  isInsideManagedTree?: boolean
  roots: ReadonlyArray<BookmarkNode>
}) {
  const { t } = useTranslation()
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [dragSession, setDragSession] = useState<BookmarkDragSession | null>(
    null,
  )
  const [dropPlacement, setDropPlacement] =
    useState<BookmarkDropPlacement | null>(null)
  const [hasMoveError, setHasMoveError] = useState(false)
  const tree = useMemo(
    () => buildBookmarkTreeIndex(roots, isInsideManagedTree),
    [isInsideManagedTree, roots],
  )
  const treeRef = useRef<BookmarkTreeIndex>(tree)
  const dragSessionRef = useRef<BookmarkDragSession | null>(null)
  const dropPlacementRef = useRef<BookmarkDropPlacement | null>(null)
  const pointerDragRef = useRef<BookmarkPointerDrag | null>(null)
  const dragCursorPreviewRef = useRef<HTMLDivElement | null>(null)
  const pointerPositionRef = useRef({ x: 0, y: 0 })
  const isPersistingRef = useRef(false)
  const restoreExpandedFolderIdRef = useRef<string | null>(null)
  const suppressClickUntilRef = useRef(0)
  treeRef.current = tree

  const setFolderExpanded = useCallback((id: string, expanded: boolean) => {
    setCollapsedFolderIds((current) => {
      if (current.has(id) === !expanded) return current
      const next = new Set(current)
      if (expanded) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearDragVisuals = useCallback(() => {
    const folderId = restoreExpandedFolderIdRef.current
    if (folderId) {
      setFolderExpanded(folderId, true)
      restoreExpandedFolderIdRef.current = null
    }
    dragSessionRef.current = null
    dropPlacementRef.current = null
    dragCursorPreviewRef.current = null
    setDragSession(null)
    setDropPlacement(null)
  }, [setFolderExpanded])

  const canDrag = useCallback(
    (id: string) =>
      canMove &&
      !isPersistingRef.current &&
      canMoveBookmarkNode(treeRef.current, id),
    [canMove],
  )

  const showPlacement = useCallback(
    (placement: BookmarkDropPlacement | null) => {
      dropPlacementRef.current = placement
      setDropPlacement((current) =>
        current?.parentId === placement?.parentId &&
        current?.index === placement?.index &&
        current?.mode === placement?.mode &&
        current?.targetId === placement?.targetId
          ? current
          : placement,
      )
    },
    [],
  )

  const resolveBoundaryEvent = useCallback(
    (parentId: string, index: number) => {
      const session = dragSessionRef.current
      if (!session) return null
      return resolveBookmarkBoundaryPlacement(
        treeRef.current,
        session.id,
        parentId,
        index,
      )
    },
    [],
  )

  const resolvePointPlacement = useCallback(
    (clientX: number, clientY: number) => {
      const session = dragSessionRef.current
      if (!session) return null
      const elements = document.elementsFromPoint(clientX, clientY)

      for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue
        const targetElement = element.closest<HTMLElement>(
          '[data-bookmark-node-id]',
        )
        const targetId = targetElement?.dataset.bookmarkNodeId
        if (!targetElement || !targetId) continue
        const rect = targetElement.getBoundingClientRect()
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          continue
        }
        const target = treeRef.current.entriesById.get(targetId)
        if (!target) continue
        const placement = resolveBookmarkNodePlacement(
          treeRef.current,
          session.id,
          targetId,
          getNodeDropZone(
            targetElement,
            clientY,
            target.node,
            target.index === 0,
          ),
        )
        if (placement) return placement
      }

      for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue
        const gap = element.closest<HTMLElement>('.bookmark-drop-gap')
        if (!gap) continue
        const parentId = gap.dataset.dropParentId
        const index = Number(gap.dataset.dropIndex)
        if (!parentId || !Number.isInteger(index)) continue
        const placement = resolveBookmarkBoundaryPlacement(
          treeRef.current,
          session.id,
          parentId,
          index,
        )
        if (placement) return placement
      }

      return null
    },
    [],
  )

  const startPointerDrag = useCallback(
    (pointerDrag: BookmarkPointerDrag) => {
      const { session } = pointerDrag
      dragSessionRef.current = session
      dropPlacementRef.current = null
      const shouldCollapseFolder =
        session.kind === 'folder' && !collapsedFolderIds.has(session.id)
      restoreExpandedFolderIdRef.current = shouldCollapseFolder
        ? session.id
        : null
      suppressClickUntilRef.current = Number.POSITIVE_INFINITY
      setDragSession(session)
      setDropPlacement(null)
      setHasMoveError(false)
      if (shouldCollapseFolder) setFolderExpanded(session.id, false)
    },
    [collapsedFolderIds, setFolderExpanded],
  )

  const persistPlacement = useCallback(
    (placement: BookmarkDropPlacement | null) => {
      const session = dragSessionRef.current
      if (!session || !placement || placement.isNoop) {
        clearDragVisuals()
        return
      }

      isPersistingRef.current = true
      clearDragVisuals()
      void moveBookmarkNode({
        id: session.id,
        index: placement.index,
        parentId: placement.parentId,
      })
        .catch(() => setHasMoveError(true))
        .finally(() => {
          isPersistingRef.current = false
        })
    },
    [clearDragVisuals],
  )

  const releasePointerCapture = useCallback(
    (pointerDrag: BookmarkPointerDrag) => {
      if (!pointerDrag.source.hasPointerCapture(pointerDrag.pointerId)) return
      pointerDrag.source.releasePointerCapture(pointerDrag.pointerId)
    },
    [],
  )

  const completePointerDrag = useCallback(
    (pointerId: number) => {
      const pointerDrag = pointerDragRef.current
      if (!pointerDrag || pointerDrag.pointerId !== pointerId) return
      pointerDragRef.current = null
      releasePointerCapture(pointerDrag)
      if (!pointerDrag.started) return
      suppressClickUntilRef.current = performance.now() + 300
      persistPlacement(dropPlacementRef.current)
    },
    [persistPlacement, releasePointerCapture],
  )

  const cancelPointerDrag = useCallback(() => {
    const pointerDrag = pointerDragRef.current
    if (!pointerDrag) return
    pointerDragRef.current = null
    releasePointerCapture(pointerDrag)
    if (!pointerDrag.started) return
    suppressClickUntilRef.current = performance.now() + 300
    clearDragVisuals()
  }, [clearDragVisuals, releasePointerCapture])

  const movePointerDrag = useCallback(
    (pointerId: number, clientX: number, clientY: number) => {
      const pointerDrag = pointerDragRef.current
      if (!pointerDrag || pointerDrag.pointerId !== pointerId) return false
      if (!pointerDrag.started) {
        const distance = Math.hypot(
          clientX - pointerDrag.startX,
          clientY - pointerDrag.startY,
        )
        if (distance < 5) return false
        pointerDrag.started = true
        try {
          pointerDrag.source.setPointerCapture(pointerId)
        } catch {
          // Window-level pointer listeners still guarantee release cleanup.
        }
        startPointerDrag(pointerDrag)
      }

      pointerPositionRef.current = { x: clientX, y: clientY }
      if (dragCursorPreviewRef.current) {
        positionDragCursorPreview(
          dragCursorPreviewRef.current,
          clientX,
          clientY,
          pointerDrag.session.kind,
        )
      }
      showPlacement(resolvePointPlacement(clientX, clientY))
      return true
    },
    [resolvePointPlacement, showPlacement, startPointerDrag],
  )

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (movePointerDrag(event.pointerId, event.clientX, event.clientY)) {
        event.preventDefault()
      }
    }
    const handlePointerUp = (event: PointerEvent) => {
      completePointerDrag(event.pointerId)
    }
    const handlePointerCancel = () => cancelPointerDrag()
    const handleBlur = () => cancelPointerDrag()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelPointerDrag()
    }
    const suppressFinishedDragClick = (event: MouseEvent) => {
      if (performance.now() > suppressClickUntilRef.current) return
      suppressClickUntilRef.current = 0
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('pointerup', handlePointerUp, true)
    window.addEventListener('pointercancel', handlePointerCancel, true)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('click', suppressFinishedDragClick, true)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('pointerup', handlePointerUp, true)
      window.removeEventListener('pointercancel', handlePointerCancel, true)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('click', suppressFinishedDragClick, true)
    }
  }, [cancelPointerDrag, completePointerDrag, movePointerDrag])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, node: BookmarkNode) => {
      if (
        event.button !== 0 ||
        !event.isPrimary ||
        event.pointerType !== 'mouse' ||
        !canDrag(node.id) ||
        pointerDragRef.current
      ) {
        return
      }
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'button, input, textarea, select, [contenteditable="true"], a:not(.bookmark-main-link)',
        )
      ) {
        return
      }

      const source = event.currentTarget
      pointerDragRef.current = {
        pointerId: event.pointerId,
        session: {
          id: node.id,
          kind: node.url === undefined ? 'folder' : 'bookmark',
          node,
        },
        source,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
      }
    },
    [canDrag],
  )

  const setDragCursorPreviewElement = useCallback(
    (element: HTMLDivElement | null) => {
      dragCursorPreviewRef.current = element
      const session = dragSessionRef.current
      if (!element || !session) return
      positionDragCursorPreview(
        element,
        pointerPositionRef.current.x,
        pointerPositionRef.current.y,
        session.kind,
      )
    },
    [],
  )

  const canDropAtBoundary = useCallback(
    (parentId: string, index: number) =>
      resolveBoundaryEvent(parentId, index) !== null,
    [resolveBoundaryEvent],
  )

  const contextValue = useMemo<BookmarkDragContextValue>(
    () => ({
      collapsedFolderIds,
      draggedId: dragSession?.id ?? null,
      draggedKind: dragSession?.kind ?? null,
      draggedNode: dragSession?.node ?? null,
      dropPlacement,
      canDrag,
      canDropAtBoundary,
      onPointerDown,
      setFolderExpanded,
    }),
    [
      canDrag,
      canDropAtBoundary,
      collapsedFolderIds,
      dragSession,
      dropPlacement,
      onPointerDown,
      setFolderExpanded,
    ],
  )

  return (
    <BookmarkDragContext.Provider value={contextValue}>
      {children}
      {dragSession ? (
        <div
          ref={setDragCursorPreviewElement}
          className="bookmark-drag-cursor-preview"
          aria-hidden="true"
          inert
        >
          <BookmarkDragCursorPreview node={dragSession.node} />
        </div>
      ) : null}
      {hasMoveError ? (
        <p className="bookmark-sort-error" role="alert">
          {t('bookmarks.errors.sortFailed')}
        </p>
      ) : null}
    </BookmarkDragContext.Provider>
  )
}

const ActiveQuickAddEditorContext = createContext<string | null>(null)
const SetActiveQuickAddEditorContext = createContext<React.Dispatch<
  React.SetStateAction<string | null>
> | null>(null)

function QuickAddEditorScope({ children }: { children: React.ReactNode }) {
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null)

  return (
    <ActiveQuickAddEditorContext.Provider value={activeEditorId}>
      <SetActiveQuickAddEditorContext.Provider value={setActiveEditorId}>
        {children}
      </SetActiveQuickAddEditorContext.Provider>
    </ActiveQuickAddEditorContext.Provider>
  )
}

function useQuickAddEditor(editorId: string) {
  const activeEditorId = useContext(ActiveQuickAddEditorContext)
  const setActiveEditorId = useContext(SetActiveQuickAddEditorContext)

  if (!setActiveEditorId) {
    throw new Error('Quick-add editors must be rendered inside their scope.')
  }

  return {
    isEditing: activeEditorId === editorId,
    openEditor: () => setActiveEditorId(editorId),
    closeEditor: () =>
      setActiveEditorId((currentEditorId) =>
        currentEditorId === editorId ? null : currentEditorId,
      ),
  }
}

function QuickAddFolderRow({
  canCreate,
  parentId,
  parentTitle,
}: {
  canCreate: boolean
  parentId: string
  parentTitle: string
}) {
  const { t } = useTranslation()
  const editorId = useId()
  const {
    closeEditor: closeActiveEditor,
    isEditing,
    openEditor,
  } = useQuickAddEditor(editorId)
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<'nameRequired' | 'addFailed'>()
  const titleInputId = useId()

  const closeEditor = () => {
    closeActiveEditor()
    setTitle('')
    setError(undefined)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreate || isSubmitting) return

    const nextTitle = title.trim()
    if (!nextTitle) {
      setError('nameRequired')
      return
    }

    setIsSubmitting(true)
    setError(undefined)
    try {
      await createBookmarkFolder({ parentId, title: nextTitle })
      closeEditor()
    } catch {
      setError('addFailed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        className="folder-quick-add-trigger"
        type="button"
        aria-label={t('bookmarks.addFolder.actionIn', { parent: parentTitle })}
        onClick={openEditor}
      >
        <span className="folder-quick-add-line" aria-hidden="true" />
        <Plus />
        <span>{t('bookmarks.addFolder.action')}</span>
        <span className="folder-quick-add-line" aria-hidden="true" />
      </button>
    )
  }

  return (
    <form
      className="folder-quick-add-form"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSubmitting) closeEditor()
        if (event.key === 'Enter' && !isSubmitting) {
          event.preventDefault()
          event.currentTarget.requestSubmit()
        }
      }}
    >
      <label className="sr-only" htmlFor={titleInputId}>
        {t('bookmarks.addFolder.name')}
      </label>
      <input
        id={titleInputId}
        type="text"
        autoFocus
        autoComplete="off"
        placeholder={t('bookmarks.addFolder.name')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="folder-quick-add-actions">
        <button type="submit" disabled={!canCreate || isSubmitting}>
          {isSubmitting ? <LoaderCircle className="is-spinning" /> : null}
          {t('bookmarks.addFolder.action')}
        </button>
        <button type="button" disabled={isSubmitting} onClick={closeEditor}>
          {t('common.cancel')}
        </button>
        {!canCreate ? (
          <span>{t('bookmarks.addFolder.extensionRequired')}</span>
        ) : null}
        {error ? (
          <span className="is-error">
            {t(
              error === 'nameRequired'
                ? 'bookmarks.errors.folderNameRequired'
                : 'bookmarks.errors.addFailed',
            )}
          </span>
        ) : null}
      </div>
    </form>
  )
}

function QuickAddBookmarkRow({
  folderId,
  folderTitle,
  canCreate,
}: {
  folderId: string
  folderTitle: string
  canCreate: boolean
}) {
  const { t } = useTranslation()
  const editorId = useId()
  const {
    closeEditor: closeActiveEditor,
    isEditing,
    openEditor,
  } = useQuickAddEditor(editorId)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<'invalidUrl' | 'addFailed'>()
  const urlInputId = useId()
  const titleInputId = useId()

  const closeEditor = () => {
    closeActiveEditor()
    setUrl('')
    setTitle('')
    setError(undefined)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreate || isSubmitting) return

    const normalizedUrl = normalizeBookmarkUrl(url)
    if (!normalizedUrl) {
      setError('invalidUrl')
      return
    }

    setIsSubmitting(true)
    setError(undefined)

    try {
      const explicitTitle = title.trim()
      await createBookmark({
        autoTitle: explicitTitle.length === 0,
        parentId: folderId,
        title: explicitTitle || getDefaultBookmarkTitle(normalizedUrl),
        url: normalizedUrl,
      })
      closeEditor()
    } catch {
      setError('addFailed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        className="bookmark-quick-add-trigger"
        type="button"
        aria-label={t('bookmarks.addBookmark.actionIn', {
          folder: folderTitle,
        })}
        onClick={openEditor}
      >
        <Plus />
        <span>{t('bookmarks.addBookmark.action')}</span>
      </button>
    )
  }

  return (
    <form
      className="bookmark-quick-add-form"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSubmitting) closeEditor()
      }}
    >
      <div className="bookmark-quick-add-fields">
        <label className="sr-only" htmlFor={urlInputId}>
          {t('bookmarks.addBookmark.url')}
        </label>
        <input
          id={urlInputId}
          type="text"
          inputMode="url"
          autoFocus
          autoComplete="url"
          placeholder={t('bookmarks.addBookmark.urlPlaceholder')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <label className="sr-only" htmlFor={titleInputId}>
          {t('bookmarks.addBookmark.title')}
        </label>
        <input
          id={titleInputId}
          type="text"
          autoComplete="off"
          placeholder={t('bookmarks.addBookmark.titlePlaceholder')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="bookmark-quick-add-actions">
        <button type="submit" disabled={!canCreate || isSubmitting}>
          {isSubmitting ? <LoaderCircle className="is-spinning" /> : null}
          {t('bookmarks.addBookmark.shortAction')}
        </button>
        <button type="button" disabled={isSubmitting} onClick={closeEditor}>
          {t('common.cancel')}
        </button>
        {!canCreate ? (
          <span>{t('bookmarks.addBookmark.extensionRequired')}</span>
        ) : null}
        {error ? (
          <span className="is-error">
            {t(
              error === 'invalidUrl'
                ? 'bookmarks.errors.invalidUrl'
                : 'bookmarks.errors.addFailed',
            )}
          </span>
        ) : null}
      </div>
    </form>
  )
}

export function BookmarkRow({
  canMutate,
  isCursorPreview = false,
  isDragPreview = false,
  isNested = false,
  node,
  path,
}: {
  canMutate: boolean
  isCursorPreview?: boolean
  isDragPreview?: boolean
  isNested?: boolean
  node: BookmarkNode
  path?: Array<string>
}) {
  const { t } = useTranslation()
  const openTabContext = useContext(BookmarkOpenTabContext)
  const dragContext = useContext(BookmarkDragContext)
  const [copied, setCopied] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(node.title)
  const [editUrl, setEditUrl] = useState(node.url ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState<'invalidUrl' | 'saveFailed'>()
  const [deleteError, setDeleteError] = useState(false)
  const editTitleId = useId()
  const editUrlId = useId()
  const url = node.url ?? '#'
  const isPreview = isCursorPreview || isDragPreview
  const canDrag = Boolean(
    !isPreview && canMutate && dragContext?.canDrag(node.id),
  )
  const isDragging = !isPreview && dragContext?.draggedId === node.id
  const openTab = node.url
    ? openTabContext?.openTabsByUrl.get(normalizeCapturedUrl(node.url))
    : undefined

  const copyUrl = () => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_400)
    })
  }

  const openEditor = () => {
    setEditTitle(node.title)
    setEditUrl(url)
    setEditError(undefined)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canMutate || isSaving) return

    const normalizedUrl = normalizeBookmarkUrl(editUrl)
    if (!normalizedUrl) {
      setEditError('invalidUrl')
      return
    }

    setIsSaving(true)
    setEditError(undefined)
    try {
      await updateBookmark({
        id: node.id,
        title: editTitle.trim() || getDefaultBookmarkTitle(normalizedUrl),
        url: normalizedUrl,
      })
      setIsEditOpen(false)
    } catch {
      setEditError('saveFailed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canMutate || isDeleting) return

    setIsDeleting(true)
    setDeleteError(false)
    try {
      await deleteBookmark(node.id)
      setIsDeleteOpen(false)
    } catch {
      setDeleteError(true)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className={`bookmark-row${canDrag ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}${isNested ? ' is-nested' : ''}${isDragPreview ? ' is-drop-preview' : ''}${isCursorPreview ? ' is-cursor-preview' : ''}`}
        data-bookmark-node-id={isPreview ? undefined : node.id}
        data-bookmark-drop-preview-id={isDragPreview ? node.id : undefined}
        data-bookmark-cursor-preview-id={isCursorPreview ? node.id : undefined}
        draggable={false}
        onPointerDown={
          isPreview
            ? undefined
            : (event) => dragContext?.onPointerDown(event, node)
        }
      >
        <a className="bookmark-main-link" href={url} draggable={false}>
          <BookmarkFavicon title={node.title} url={url} />
          <span className="bookmark-copy">
            <strong>{node.title || getHostname(url)}</strong>
            <span>{getHostname(url)}</span>
          </span>
          {path?.length ? (
            <span className="bookmark-path">{path.join(' / ')}</span>
          ) : null}
        </a>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="tooltip-disabled-trigger bookmark-danger-action-group">
                <button
                  className="bookmark-action bookmark-direct-action bookmark-delete-action"
                  type="button"
                  disabled={!canMutate}
                  aria-label={t('bookmarks.actions.delete', {
                    title: node.title,
                  })}
                  onClick={() => {
                    setDeleteError(false)
                    setIsDeleteOpen(true)
                  }}
                >
                  <Trash2 />
                </button>
              </span>
            }
          />
          <TooltipContent>
            {canMutate
              ? t('bookmarks.actions.deleteShort')
              : t('bookmarks.actions.extensionRequiredModify')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="tooltip-disabled-trigger">
                <button
                  className="bookmark-action bookmark-direct-action"
                  type="button"
                  disabled={!canMutate}
                  aria-label={t('bookmarks.actions.edit', {
                    title: node.title,
                  })}
                  onClick={openEditor}
                >
                  <Pencil />
                </button>
              </span>
            }
          />
          <TooltipContent>
            {canMutate
              ? t('bookmarks.actions.editShort')
              : t('bookmarks.actions.extensionRequiredModify')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                className="bookmark-action bookmark-secondary-action"
                type="button"
                aria-label={
                  copied
                    ? t('bookmarks.actions.copied')
                    : t('bookmarks.actions.copy', { title: node.title })
                }
                onClick={copyUrl}
              >
                {copied ? <Check /> : <Copy />}
              </button>
            }
          />
          <TooltipContent>
            {copied
              ? t('bookmarks.actions.copiedShort')
              : t('bookmarks.actions.copyShort')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                className="bookmark-action bookmark-secondary-action"
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={t('bookmarks.actions.openNewTab', {
                  title: node.title,
                })}
              >
                <ExternalLink />
              </a>
            }
          />
          <TooltipContent>
            {t('bookmarks.actions.openNewTabShort')}
          </TooltipContent>
        </Tooltip>
        {openTab ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="bookmark-action bookmark-open-tab-action"
                  type="button"
                  aria-label={t('bookmarks.actions.switchToOpenTab', {
                    title: node.title,
                  })}
                  onClick={() => openTabContext?.onActivateTab(openTab)}
                >
                  <PanelsTopLeft aria-hidden="true" />
                  <span className="bookmark-open-tab-label">
                    {t('bookmarks.actions.openTabStatus')}
                  </span>
                </button>
              }
            />
            <TooltipContent>
              {t('bookmarks.actions.switchToOpenTabShort')}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <Dialog.Root
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!isSaving) setIsEditOpen(open)
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="bookmark-dialog-backdrop" />
          <Dialog.Viewport className="bookmark-dialog-viewport">
            <Dialog.Popup className="bookmark-dialog-popup">
              <Dialog.Title className="bookmark-dialog-title">
                {t('bookmarks.editDialog.title')}
              </Dialog.Title>
              <Dialog.Description className="bookmark-dialog-description">
                {t('bookmarks.editDialog.description')}
              </Dialog.Description>
              <form className="bookmark-edit-form" onSubmit={handleEditSubmit}>
                <label htmlFor={editTitleId}>
                  {t('bookmarks.editDialog.titleLabel')}
                </label>
                <input
                  id={editTitleId}
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
                <label htmlFor={editUrlId}>
                  {t('bookmarks.editDialog.urlLabel')}
                </label>
                <input
                  id={editUrlId}
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={editUrl}
                  onChange={(event) => setEditUrl(event.target.value)}
                />
                {editError ? (
                  <p className="bookmark-dialog-error" role="alert">
                    {t(
                      editError === 'invalidUrl'
                        ? 'bookmarks.errors.invalidUrl'
                        : 'bookmarks.errors.saveFailed',
                    )}
                  </p>
                ) : null}
                <div className="bookmark-dialog-actions">
                  <Dialog.Close type="button" disabled={isSaving}>
                    {t('common.cancel')}
                  </Dialog.Close>
                  <button type="submit" disabled={isSaving}>
                    {isSaving ? <LoaderCircle className="is-spinning" /> : null}
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setIsDeleteOpen(open)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="bookmark-dialog-backdrop" />
          <AlertDialog.Viewport className="bookmark-dialog-viewport">
            <AlertDialog.Popup className="bookmark-dialog-popup is-compact">
              <AlertDialog.Title className="bookmark-dialog-title">
                {t('bookmarks.deleteDialog.title')}
              </AlertDialog.Title>
              <AlertDialog.Description className="bookmark-dialog-description">
                {t('bookmarks.deleteDialog.description', {
                  title: node.title || getHostname(url),
                })}
              </AlertDialog.Description>
              {deleteError ? (
                <p className="bookmark-dialog-error" role="alert">
                  {t('bookmarks.errors.deleteFailed')}
                </p>
              ) : null}
              <div className="bookmark-dialog-actions">
                <AlertDialog.Close type="button" disabled={isDeleting}>
                  {t('common.cancel')}
                </AlertDialog.Close>
                <button
                  className="is-danger"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? <LoaderCircle className="is-spinning" /> : null}
                  {t('common.delete')}
                </button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}

export function FolderDeleteButton({
  canDelete,
  className,
  folder,
  onDeleted,
}: {
  canDelete: boolean
  className?: string
  folder: BookmarkNode
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasError, setHasError] = useState(false)
  const folderTitle = folder.title || t('common.unnamedFolder')
  const bookmarkCount = countBookmarks(folder)
  const childFolderCount = countChildFolders(folder)
  const hasContents = bookmarkCount > 0 || childFolderCount > 0
  const contentSummary = [
    childFolderCount > 0
      ? t('common.childFolderCount', { count: childFolderCount })
      : undefined,
    bookmarkCount > 0
      ? t('common.bookmarkCount', { count: bookmarkCount })
      : undefined,
  ]
    .filter(Boolean)
    .join(t('common.listSeparator'))

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return

    setIsDeleting(true)
    setHasError(false)
    try {
      await deleteBookmarkFolder(folder.id)
      setIsOpen(false)
      onDeleted?.()
    } catch {
      setHasError(true)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting) setIsOpen(open)
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="tooltip-disabled-trigger">
              <AlertDialog.Trigger
                className={`folder-delete-button${className ? ` ${className}` : ''}`}
                type="button"
                disabled={!canDelete}
                aria-label={t('bookmarks.folder.delete', {
                  title: folderTitle,
                })}
                onClick={() => setHasError(false)}
              >
                <Trash2 />
              </AlertDialog.Trigger>
            </span>
          }
        />
        <TooltipContent>
          {canDelete
            ? t('bookmarks.folder.deleteShort')
            : t('bookmarks.folder.extensionRequiredDelete')}
        </TooltipContent>
      </Tooltip>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="bookmark-dialog-backdrop" />
        <AlertDialog.Viewport className="bookmark-dialog-viewport">
          <AlertDialog.Popup className="bookmark-dialog-popup is-compact">
            <AlertDialog.Title className="bookmark-dialog-title">
              {t('bookmarks.folder.deleteTitle', { title: folderTitle })}
            </AlertDialog.Title>
            <AlertDialog.Description className="bookmark-dialog-description">
              {hasContents
                ? t('bookmarks.folder.deleteWithContents', {
                    summary: contentSummary,
                  })
                : t('bookmarks.folder.deleteEmpty')}
            </AlertDialog.Description>
            {hasError ? (
              <p className="bookmark-dialog-error" role="alert">
                {t('bookmarks.errors.deleteFolderFailed')}
              </p>
            ) : null}
            <div className="bookmark-dialog-actions">
              <AlertDialog.Close type="button" disabled={isDeleting}>
                {t('common.cancel')}
              </AlertDialog.Close>
              <button
                className="is-danger"
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? <LoaderCircle className="is-spinning" /> : null}
                {t(
                  hasContents
                    ? 'bookmarks.folder.deleteWithContentsAction'
                    : 'bookmarks.folder.deleteShort',
                )}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function FolderSection({
  folder,
  level = 0,
  canCreate,
  isCursorPreview = false,
  isDragPreview = false,
  isInsideManagedTree = false,
}: {
  folder: BookmarkNode
  level?: number
  canCreate: boolean
  isCursorPreview?: boolean
  isDragPreview?: boolean
  isInsideManagedTree?: boolean
}) {
  const { t } = useTranslation()
  const dragContext = useContext(BookmarkDragContext)
  const isManagedTree = isInsideManagedTree || folder.folderType === 'managed'
  const canMutateContents = canCreate && !isManagedTree
  const canDeleteFolder = canCreate && !isManagedTree
  const [internalExpanded, setInternalExpanded] = useState(true)
  const isPreview = isCursorPreview || isDragPreview
  const isExpanded = isPreview
    ? false
    : dragContext
      ? !dragContext.collapsedFolderIds.has(folder.id)
      : internalExpanded
  const canDrag = Boolean(
    !isPreview && canCreate && dragContext?.canDrag(folder.id),
  )
  const isDragging = !isPreview && dragContext?.draggedId === folder.id
  const isDropInside =
    !isPreview &&
    dragContext?.dropPlacement?.mode === 'inside' &&
    dragContext.dropPlacement.targetId === folder.id
  const folderContentId = useId()
  const folderTitle = folder.title || t('common.unnamedFolder')
  const toggleLabel = t(
    isExpanded ? 'bookmarks.folder.collapse' : 'bookmarks.folder.expand',
    { title: folderTitle },
  )
  return (
    <section
      className={`bookmark-group${isDragging ? ' is-dragging' : ''}${isDragPreview ? ' is-drop-preview' : ''}${isCursorPreview ? ' is-cursor-preview' : ''}`}
      style={{ '--group-level': level } as React.CSSProperties}
    >
      <header
        className={`bookmark-group-header${canDrag ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}${isDropInside ? ' is-drop-inside' : ''}`}
        data-bookmark-node-id={isPreview ? undefined : folder.id}
        data-bookmark-drop-preview-id={isDragPreview ? folder.id : undefined}
        data-bookmark-cursor-preview-id={
          isCursorPreview ? folder.id : undefined
        }
        draggable={false}
        onPointerDown={
          isPreview
            ? undefined
            : (event) => dragContext?.onPointerDown(event, folder)
        }
      >
        <div className="group-title-row">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="bookmark-group-toggle"
                  type="button"
                  aria-label={toggleLabel}
                  aria-expanded={isExpanded}
                  aria-controls={isPreview ? undefined : folderContentId}
                  onClick={
                    isPreview
                      ? undefined
                      : () => {
                          if (dragContext) {
                            dragContext.setFolderExpanded(
                              folder.id,
                              !isExpanded,
                            )
                          } else {
                            setInternalExpanded((expanded) => !expanded)
                          }
                        }
                  }
                >
                  <ChevronRight className={isExpanded ? 'is-expanded' : ''} />
                </button>
              }
            />
            <TooltipContent>{toggleLabel}</TooltipContent>
          </Tooltip>
          <FolderOpen />
          <h2>{folderTitle}</h2>
          <span>
            {t('common.bookmarkCount', { count: countBookmarks(folder) })}
          </span>
        </div>
        {!isPreview && folder.folderType === undefined && !isManagedTree ? (
          <FolderDeleteButton folder={folder} canDelete={canDeleteFolder} />
        ) : null}
      </header>
      {!isPreview ? (
        <div id={folderContentId} hidden={!isExpanded}>
          <FolderChildren
            parent={folder}
            folderLevel={level + 1}
            canCreate={canCreate}
            isInsideManagedTree={isManagedTree}
            indentBookmarks
          />
          <div className="bookmark-list nested-bookmark-actions">
            <QuickAddBookmarkRow
              folderId={folder.id}
              folderTitle={folderTitle}
              canCreate={canMutateContents}
            />
          </div>
          <QuickAddFolderRow
            parentId={folder.id}
            parentTitle={folderTitle}
            canCreate={canMutateContents}
          />
        </div>
      ) : null}
    </section>
  )
}

function BookmarkDropLivePreview({
  folderLevel,
  isNested,
  node,
}: {
  folderLevel: number
  isNested: boolean
  node: BookmarkNode
}) {
  return (
    <div className="bookmark-drop-live-preview" aria-hidden="true" inert>
      {node.url === undefined ? (
        <FolderSection
          folder={node}
          level={folderLevel}
          canCreate={false}
          isDragPreview
        />
      ) : (
        <BookmarkRow node={node} canMutate isNested={isNested} isDragPreview />
      )}
    </div>
  )
}

function BookmarkDragCursorPreview({ node }: { node: BookmarkNode }) {
  return node.url === undefined ? (
    <FolderSection folder={node} canCreate={false} isCursorPreview />
  ) : (
    <BookmarkRow node={node} canMutate isCursorPreview />
  )
}

function BookmarkDropGap({
  afterKind,
  folderLevel,
  index,
  isEdge,
  isNested,
  parentId,
}: {
  afterKind?: BookmarkDragKind
  folderLevel: number
  index: number
  isEdge: boolean
  isNested: boolean
  parentId: string
}) {
  const dragContext = useContext(BookmarkDragContext)
  if (!dragContext?.draggedId || !dragContext.draggedNode) return null
  if (!dragContext.canDropAtBoundary(parentId, index)) return null

  const isActive =
    dragContext.dropPlacement?.parentId === parentId &&
    dragContext.dropPlacement.index === index
  return (
    <div
      className={`bookmark-drop-gap${isEdge ? ' is-edge' : ''}${isNested ? ' is-nested' : ''}${isActive ? ' is-active' : ''}`}
      data-drop-index={index}
      data-drop-parent-id={parentId}
      data-edge={isEdge ? (index === 0 ? 'start' : 'end') : undefined}
      data-after-kind={afterKind}
      data-drag-kind={dragContext.draggedKind ?? undefined}
    >
      {isActive ? (
        <BookmarkDropLivePreview
          folderLevel={folderLevel}
          isNested={isNested}
          node={dragContext.draggedNode}
        />
      ) : null}
    </div>
  )
}

function FolderChildren({
  canCreate,
  folderLevel,
  indentBookmarks = false,
  isInsideManagedTree = false,
  parent,
}: {
  canCreate: boolean
  folderLevel: number
  indentBookmarks?: boolean
  isInsideManagedTree?: boolean
  parent: BookmarkNode
}) {
  const canMutate = canCreate && !isInsideManagedTree
  const children = parent.children ?? []

  return (
    <div className="bookmark-children">
      <BookmarkDropGap
        folderLevel={folderLevel}
        parentId={parent.id}
        index={0}
        isEdge
        isNested={indentBookmarks}
      />
      {children.map((child, index) => (
        <Fragment key={child.id}>
          {child.url === undefined ? (
            <FolderSection
              folder={child}
              level={folderLevel}
              canCreate={canCreate}
              isInsideManagedTree={isInsideManagedTree}
            />
          ) : (
            <BookmarkRow
              node={child}
              canMutate={canMutate}
              isNested={indentBookmarks}
            />
          )}
          <BookmarkDropGap
            afterKind={child.url === undefined ? 'folder' : 'bookmark'}
            folderLevel={folderLevel}
            parentId={parent.id}
            index={index + 1}
            isEdge={index === children.length - 1}
            isNested={indentBookmarks}
          />
        </Fragment>
      ))}
    </div>
  )
}
export function FolderContents({
  folder,
  canCreate,
  isInsideManagedTree = false,
}: {
  folder: BookmarkNode
  canCreate: boolean
  isInsideManagedTree?: boolean
}) {
  const { t } = useTranslation()
  const folderTitle = folder.title || t('common.unnamedFolder')

  return (
    <BookmarkDragScope
      roots={[folder]}
      canMove={canCreate}
      isInsideManagedTree={isInsideManagedTree}
    >
      <QuickAddEditorScope>
        <div className="bookmark-sections">
          <FolderChildren
            parent={folder}
            folderLevel={0}
            canCreate={canCreate}
            isInsideManagedTree={isInsideManagedTree}
          />
          <section className="bookmark-group root-bookmarks">
            <div className="bookmark-list">
              <QuickAddBookmarkRow
                folderId={folder.id}
                folderTitle={folderTitle}
                canCreate={canCreate && !isInsideManagedTree}
              />
            </div>
          </section>
          <QuickAddFolderRow
            parentId={folder.id}
            parentTitle={folderTitle}
            canCreate={canCreate && !isInsideManagedTree}
          />
        </div>
      </QuickAddEditorScope>
    </BookmarkDragScope>
  )
}

export function AllBookmarkContents({
  roots,
  canCreate,
}: {
  roots: Array<BookmarkNode>
  canCreate: boolean
}) {
  return (
    <BookmarkDragScope roots={roots} canMove={canCreate}>
      <QuickAddEditorScope>
        <div className="bookmark-sections">
          {roots.map((root) => (
            <FolderSection
              key={root.id}
              folder={root}
              canCreate={canCreate}
              isInsideManagedTree={root.folderType === 'managed'}
            />
          ))}
        </div>
      </QuickAddEditorScope>
    </BookmarkDragScope>
  )
}

export function MatchList({
  canMutate,
  matches,
}: {
  canMutate: boolean
  matches: Array<BookmarkMatch>
}) {
  const { t } = useTranslation()
  if (!matches.length) {
    return (
      <EmptyState
        title={t('bookmarks.empty.title')}
        detail={t('bookmarks.empty.description')}
      />
    )
  }

  return (
    <div className="bookmark-list search-results">
      {matches.map((match) => (
        <BookmarkRow
          key={match.node.id}
          node={match.node}
          path={match.path}
          canMutate={canMutate}
        />
      ))}
    </div>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FolderOpen />
      </div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}
