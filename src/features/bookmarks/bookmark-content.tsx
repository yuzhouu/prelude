import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  isDragging = false,
  isNested = false,
  node,
  path,
  sortableProps,
}: {
  canMutate: boolean
  isDragging?: boolean
  isNested?: boolean
  node: BookmarkNode
  path?: Array<string>
  sortableProps?: SortableElementProps
}) {
  const { t } = useTranslation()
  const openTabContext = useContext(BookmarkOpenTabContext)
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
        ref={sortableProps?.itemRef}
        className={`bookmark-row${sortableProps ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}${isNested ? ' is-nested' : ''}`}
        data-sortable-id={sortableProps?.id}
        data-sortable-kind={sortableProps?.kind}
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
        <button
          className="bookmark-action bookmark-secondary-action"
          type="button"
          aria-label={
            copied
              ? t('bookmarks.actions.copied')
              : t('bookmarks.actions.copy', { title: node.title })
          }
          title={
            copied
              ? t('bookmarks.actions.copiedShort')
              : t('bookmarks.actions.copyShort')
          }
          onClick={copyUrl}
        >
          {copied ? <Check /> : <Copy />}
        </button>
        <a
          className="bookmark-action bookmark-secondary-action"
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={t('bookmarks.actions.openNewTab', { title: node.title })}
          title={t('bookmarks.actions.openNewTabShort')}
        >
          <ExternalLink />
        </a>
        {openTab ? (
          <button
            className="bookmark-action bookmark-open-tab-action"
            type="button"
            aria-label={t('bookmarks.actions.switchToOpenTab', {
              title: node.title,
            })}
            title={t('bookmarks.actions.switchToOpenTabShort')}
            onClick={() => openTabContext?.onActivateTab(openTab)}
          >
            <PanelsTopLeft />
          </button>
        ) : null}
        <button
          className="bookmark-action bookmark-direct-action"
          type="button"
          disabled={!canMutate}
          aria-label={t('bookmarks.actions.edit', { title: node.title })}
          title={
            canMutate
              ? t('bookmarks.actions.editShort')
              : t('bookmarks.actions.extensionRequiredModify')
          }
          onClick={openEditor}
        >
          <Pencil />
        </button>
        <button
          className="bookmark-action bookmark-direct-action bookmark-delete-action"
          type="button"
          disabled={!canMutate}
          aria-label={t('bookmarks.actions.delete', { title: node.title })}
          title={
            canMutate
              ? t('bookmarks.actions.deleteShort')
              : t('bookmarks.actions.extensionRequiredModify')
          }
          onClick={() => {
            setDeleteError(false)
            setIsDeleteOpen(true)
          }}
        >
          <Trash2 />
        </button>
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
      <AlertDialog.Trigger
        className={`folder-delete-button${className ? ` ${className}` : ''}`}
        type="button"
        disabled={!canDelete}
        aria-label={t('bookmarks.folder.delete', { title: folderTitle })}
        title={
          canDelete
            ? t('bookmarks.folder.deleteShort')
            : t('bookmarks.folder.extensionRequiredDelete')
        }
        onClick={() => setHasError(false)}
      >
        <Trash2 />
      </AlertDialog.Trigger>
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
  expanded,
  isInsideManagedTree = false,
  isDragging = false,
  onExpandedChange,
  sortableProps,
}: {
  folder: BookmarkNode
  level?: number
  canCreate: boolean
  expanded?: boolean
  isInsideManagedTree?: boolean
  isDragging?: boolean
  onExpandedChange?: (expanded: boolean) => void
  sortableProps?: SortableElementProps
}) {
  const { t } = useTranslation()
  const isManagedTree = isInsideManagedTree || folder.folderType === 'managed'
  const canMutateContents = canCreate && !isManagedTree
  const canDeleteFolder = canCreate && !isManagedTree
  const [internalExpanded, setInternalExpanded] = useState(true)
  const isExpanded = expanded ?? internalExpanded
  const folderContentId = useId()
  const folderTitle = folder.title || t('common.unnamedFolder')
  const toggleLabel = t(
    isExpanded ? 'bookmarks.folder.collapse' : 'bookmarks.folder.expand',
    { title: folderTitle },
  )

  return (
    <section
      ref={sortableProps?.itemRef}
      className={`bookmark-group${sortableProps ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={{ '--group-level': level } as React.CSSProperties}
      data-sortable-id={sortableProps?.id}
      data-sortable-kind={sortableProps?.kind}
    >
      <header
        ref={(element) => {
          sortableProps?.dragSourceRef?.(element)
          sortableProps?.dropTargetRef?.(element)
        }}
        className="bookmark-group-header"
      >
        <div className="group-title-row">
          <button
            className="bookmark-group-toggle"
            type="button"
            aria-label={toggleLabel}
            aria-expanded={isExpanded}
            aria-controls={folderContentId}
            title={toggleLabel}
            onClick={() => {
              const nextExpanded = !isExpanded
              if (expanded === undefined) setInternalExpanded(nextExpanded)
              onExpandedChange?.(nextExpanded)
            }}
          >
            <ChevronRight className={isExpanded ? 'is-expanded' : ''} />
          </button>
          <FolderOpen />
          <h2>{folderTitle}</h2>
          <span>
            {t('common.bookmarkCount', { count: countBookmarks(folder) })}
          </span>
        </div>
        {folder.folderType === undefined && !isManagedTree ? (
          <FolderDeleteButton folder={folder} canDelete={canDeleteFolder} />
        ) : null}
      </header>
      <div id={folderContentId} hidden={!isExpanded}>
        <SortableFolderChildren
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
    </section>
  )
}

type SortableItemKind = 'bookmark' | 'folder'

interface SortableElementProps {
  id: string
  kind: SortableItemKind
  itemRef: (element: Element | null) => void
  dragSourceRef?: (element: Element | null) => void
  dropTargetRef?: (element: Element | null) => void
}

interface SortableItemData {
  kind: SortableItemKind
  node: BookmarkNode
  parentId: string
}

interface OptimisticChildren {
  children: Array<BookmarkNode>
  source: Array<BookmarkNode>
}

const EMPTY_BOOKMARK_CHILDREN: Array<BookmarkNode> = []
const FULL_ROW_SORTABLE_SENSORS = [
  PointerSensor.configure({
    preventActivation: () => false,
  }),
]

function BookmarkDragPreview({ node }: { node: BookmarkNode }) {
  const { t } = useTranslation()
  const isFolderNode = node.url === undefined
  const url = node.url ?? '#'

  return (
    <div
      className={`bookmark-drag-preview is-${isFolderNode ? 'folder' : 'bookmark'}`}
    >
      <span className="bookmark-drag-preview-icon">
        {isFolderNode ? (
          <FolderOpen />
        ) : (
          <BookmarkFavicon title={node.title} url={url} />
        )}
      </span>
      <span className="bookmark-drag-preview-copy">
        <strong>
          {node.title ||
            (isFolderNode ? t('common.unnamedFolder') : getHostname(url))}
        </strong>
        <span>
          {isFolderNode
            ? t('common.bookmarkCount', { count: countBookmarks(node) })
            : getHostname(url)}
        </span>
      </span>
    </div>
  )
}

function SortableFolderChild({
  canCreate,
  canReorder,
  child,
  folderExpanded,
  folderLevel,
  indentBookmarks,
  index,
  isInsideManagedTree,
  onFolderExpandedChange,
  parentId,
}: {
  canCreate: boolean
  canReorder: boolean
  child: BookmarkNode
  folderExpanded: boolean
  folderLevel: number
  indentBookmarks: boolean
  index: number
  isInsideManagedTree: boolean
  onFolderExpandedChange: (expanded: boolean) => void
  parentId: string
}) {
  const kind: SortableItemKind = child.url === undefined ? 'folder' : 'bookmark'
  const { isDragging, isDropping, ref, sourceRef, targetRef } =
    useSortable<SortableItemData>({
      id: child.id,
      index,
      group: parentId,
      disabled: !canReorder,
      data: { kind, node: child, parentId },
      transition: {
        duration: 220,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        idle: true,
      },
    })
  const sortableProps: SortableElementProps | undefined = canReorder
    ? {
        id: child.id,
        kind,
        itemRef: ref,
        dragSourceRef: kind === 'folder' ? sourceRef : undefined,
        dropTargetRef: kind === 'folder' ? targetRef : undefined,
      }
    : undefined
  const isActive = isDragging || isDropping

  return kind === 'folder' ? (
    <FolderSection
      folder={child}
      level={folderLevel}
      canCreate={canCreate}
      expanded={folderExpanded}
      isInsideManagedTree={isInsideManagedTree}
      isDragging={isActive}
      onExpandedChange={onFolderExpandedChange}
      sortableProps={sortableProps}
    />
  ) : (
    <BookmarkRow
      node={child}
      canMutate={canReorder}
      isDragging={isActive}
      isNested={indentBookmarks}
      sortableProps={sortableProps}
    />
  )
}

function SortableFolderChildren({
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
  const { t } = useTranslation()
  const sourceChildren = parent.children ?? EMPTY_BOOKMARK_CHILDREN
  const canReorder = canCreate && !isInsideManagedTree
  const [optimisticChildren, setOptimisticChildren] =
    useState<OptimisticChildren>()
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [hasMoveError, setHasMoveError] = useState(false)
  const moveVersionRef = useRef(0)
  const children =
    optimisticChildren?.source === sourceChildren
      ? optimisticChildren.children
      : sourceChildren

  const setFolderExpanded = (folderId: string, expanded: boolean) => {
    setCollapsedFolderIds((current) => {
      const shouldCollapse = !expanded
      if (current.has(folderId) === shouldCollapse) return current

      const next = new Set(current)
      if (shouldCollapse) next.add(folderId)
      else next.delete(folderId)
      return next
    })
  }

  const persistMove = async ({
    destinationIndex,
    id,
    nextChildren,
    version,
  }: {
    destinationIndex: number
    id: string
    nextChildren: Array<BookmarkNode>
    version: number
  }) => {
    setHasMoveError(false)
    try {
      await moveBookmarkNode({
        id,
        index: destinationIndex,
        parentId: parent.id,
      })
    } catch {
      if (moveVersionRef.current !== version) return
      setOptimisticChildren((current) =>
        current?.children === nextChildren ? undefined : current,
      )
      setHasMoveError(true)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled || !isSortableOperation(event.operation)) return

    const { source, target } = event.operation
    if (
      !source ||
      !target ||
      source.initialGroup !== parent.id ||
      source.group !== parent.id ||
      source.initialIndex === source.index
    ) {
      return
    }

    const nextChildren = move(children, event)
    const destinationIndex =
      source.index > source.initialIndex ? source.index + 1 : source.index
    const version = moveVersionRef.current + 1
    moveVersionRef.current = version
    setOptimisticChildren({ children: nextChildren, source: sourceChildren })
    void persistMove({
      destinationIndex,
      id: String(source.id),
      nextChildren,
      version,
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setHasMoveError(false)
    const sourceData = event.operation.source?.data as
      SortableItemData | undefined
    if (sourceData?.kind === 'folder') {
      setFolderExpanded(sourceData.node.id, false)
    }
  }

  return (
    <DragDropProvider
      sensors={FULL_ROW_SORTABLE_SENSORS}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bookmark-children">
        {children.map((child, index) => (
          <SortableFolderChild
            key={child.id}
            canCreate={canCreate}
            canReorder={canReorder}
            child={child}
            folderExpanded={!collapsedFolderIds.has(child.id)}
            folderLevel={folderLevel}
            indentBookmarks={indentBookmarks}
            index={index}
            isInsideManagedTree={isInsideManagedTree}
            onFolderExpandedChange={(expanded) =>
              setFolderExpanded(child.id, expanded)
            }
            parentId={parent.id}
          />
        ))}
        {hasMoveError ? (
          <p className="bookmark-sort-error" role="alert">
            {t('bookmarks.errors.sortFailed')}
          </p>
        ) : null}
      </div>
      <DragOverlay
        className="bookmark-drag-overlay"
        dropAnimation={{
          duration: 180,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {(source) => (
          <BookmarkDragPreview node={(source.data as SortableItemData).node} />
        )}
      </DragOverlay>
    </DragDropProvider>
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
    <QuickAddEditorScope>
      <div className="bookmark-sections">
        <SortableFolderChildren
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
