import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider, DragOverlay, PointerSensor } from '@dnd-kit/react'
import type { DragEndEvent } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { useId, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

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

function QuickAddFolderRow({
  canCreate,
  parentId,
  parentTitle,
}: {
  canCreate: boolean
  parentId: string
  parentTitle: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const titleInputId = useId()

  const closeEditor = () => {
    setIsEditing(false)
    setTitle('')
    setError(undefined)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreate || isSubmitting) return

    const nextTitle = title.trim()
    if (!nextTitle) {
      setError('请输入分类名称')
      return
    }

    setIsSubmitting(true)
    setError(undefined)
    try {
      await createBookmarkFolder({ parentId, title: nextTitle })
      closeEditor()
    } catch {
      setError('添加失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        className="folder-quick-add-trigger"
        type="button"
        aria-label={`在${parentTitle}中添加分类`}
        onClick={() => setIsEditing(true)}
      >
        <span className="folder-quick-add-line" aria-hidden="true" />
        <Plus />
        <span>添加分类</span>
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
        分类名称
      </label>
      <input
        id={titleInputId}
        type="text"
        autoFocus
        autoComplete="off"
        placeholder="分类名称"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="folder-quick-add-actions">
        <button type="submit" disabled={!canCreate || isSubmitting}>
          {isSubmitting ? <LoaderCircle className="is-spinning" /> : null}
          添加分类
        </button>
        <button type="button" disabled={isSubmitting} onClick={closeEditor}>
          取消
        </button>
        {!canCreate ? <span>加载为 Chrome 扩展后即可添加</span> : null}
        {error ? <span className="is-error">{error}</span> : null}
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
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const urlInputId = useId()
  const titleInputId = useId()

  const closeEditor = () => {
    setIsEditing(false)
    setUrl('')
    setTitle('')
    setError(undefined)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreate || isSubmitting) return

    const normalizedUrl = normalizeBookmarkUrl(url)
    if (!normalizedUrl) {
      setError('请输入有效的网址')
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
      setError('添加失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        className="bookmark-quick-add-trigger"
        type="button"
        aria-label={`在${folderTitle}中添加书签`}
        onClick={() => setIsEditing(true)}
      >
        <Plus />
        <span>添加书签</span>
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
          书签网址
        </label>
        <input
          id={urlInputId}
          type="text"
          inputMode="url"
          autoFocus
          autoComplete="url"
          placeholder="粘贴网址"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <label className="sr-only" htmlFor={titleInputId}>
          书签标题
        </label>
        <input
          id={titleInputId}
          type="text"
          autoComplete="off"
          placeholder="标题（留空将自动获取）"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="bookmark-quick-add-actions">
        <button type="submit" disabled={!canCreate || isSubmitting}>
          {isSubmitting ? <LoaderCircle className="is-spinning" /> : null}
          添加
        </button>
        <button type="button" disabled={isSubmitting} onClick={closeEditor}>
          取消
        </button>
        {!canCreate ? <span>加载为 Chrome 扩展后即可添加</span> : null}
        {error ? <span className="is-error">{error}</span> : null}
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
  const [copied, setCopied] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(node.title)
  const [editUrl, setEditUrl] = useState(node.url ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState<string>()
  const [deleteError, setDeleteError] = useState<string>()
  const editTitleId = useId()
  const editUrlId = useId()
  const url = node.url ?? '#'

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
      setEditError('请输入有效的网址')
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
      setEditError('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canMutate || isDeleting) return

    setIsDeleting(true)
    setDeleteError(undefined)
    try {
      await deleteBookmark(node.id)
      setIsDeleteOpen(false)
    } catch {
      setDeleteError('删除失败，请重试')
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
          aria-label={copied ? '链接已复制' : `复制 ${node.title} 的链接`}
          title={copied ? '已复制' : '复制链接'}
          onClick={copyUrl}
        >
          {copied ? <Check /> : <Copy />}
        </button>
        <a
          className="bookmark-action bookmark-secondary-action"
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`在新标签页打开 ${node.title}`}
          title="在新标签页打开"
        >
          <ExternalLink />
        </a>
        <button
          className="bookmark-action bookmark-direct-action"
          type="button"
          disabled={!canMutate}
          aria-label={`编辑 ${node.title}`}
          title={canMutate ? '编辑' : '加载为 Chrome 扩展后即可修改'}
          onClick={openEditor}
        >
          <Pencil />
        </button>
        <button
          className="bookmark-action bookmark-direct-action bookmark-delete-action"
          type="button"
          disabled={!canMutate}
          aria-label={`删除 ${node.title}`}
          title={canMutate ? '删除' : '加载为 Chrome 扩展后即可修改'}
          onClick={() => {
            setDeleteError(undefined)
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
                编辑书签
              </Dialog.Title>
              <Dialog.Description className="bookmark-dialog-description">
                修改标题或网址，保存后会同步到 Chrome 书签。
              </Dialog.Description>
              <form className="bookmark-edit-form" onSubmit={handleEditSubmit}>
                <label htmlFor={editTitleId}>标题</label>
                <input
                  id={editTitleId}
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
                <label htmlFor={editUrlId}>网址</label>
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
                    {editError}
                  </p>
                ) : null}
                <div className="bookmark-dialog-actions">
                  <Dialog.Close type="button" disabled={isSaving}>
                    取消
                  </Dialog.Close>
                  <button type="submit" disabled={isSaving}>
                    {isSaving ? <LoaderCircle className="is-spinning" /> : null}
                    保存
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
                删除书签？
              </AlertDialog.Title>
              <AlertDialog.Description className="bookmark-dialog-description">
                “{node.title || getHostname(url)}”将从 Chrome
                书签中删除，此操作无法撤销。
              </AlertDialog.Description>
              {deleteError ? (
                <p className="bookmark-dialog-error" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="bookmark-dialog-actions">
                <AlertDialog.Close type="button" disabled={isDeleting}>
                  取消
                </AlertDialog.Close>
                <button
                  className="is-danger"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? <LoaderCircle className="is-spinning" /> : null}
                  删除
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
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>()
  const folderTitle = folder.title || '未命名文件夹'
  const bookmarkCount = countBookmarks(folder)
  const childFolderCount = countChildFolders(folder)
  const hasContents = bookmarkCount > 0 || childFolderCount > 0
  const contentSummary = [
    childFolderCount > 0 ? `${childFolderCount} 个子文件夹` : undefined,
    bookmarkCount > 0 ? `${bookmarkCount} 个书签` : undefined,
  ]
    .filter(Boolean)
    .join('和')

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return

    setIsDeleting(true)
    setError(undefined)
    try {
      await deleteBookmarkFolder(folder.id)
      setIsOpen(false)
      onDeleted?.()
    } catch {
      setError('删除文件夹失败，请重试')
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
        aria-label={`删除文件夹 ${folderTitle}`}
        title={canDelete ? '删除文件夹' : '加载为 Chrome 扩展后即可删除'}
        onClick={() => setError(undefined)}
      >
        <Trash2 />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="bookmark-dialog-backdrop" />
        <AlertDialog.Viewport className="bookmark-dialog-viewport">
          <AlertDialog.Popup className="bookmark-dialog-popup is-compact">
            <AlertDialog.Title className="bookmark-dialog-title">
              删除文件夹“{folderTitle}”？
            </AlertDialog.Title>
            <AlertDialog.Description className="bookmark-dialog-description">
              {hasContents
                ? `将同时删除其中的${contentSummary}。此操作无法撤销。`
                : '该文件夹为空。删除后将无法恢复。'}
            </AlertDialog.Description>
            {error ? (
              <p className="bookmark-dialog-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="bookmark-dialog-actions">
              <AlertDialog.Close type="button" disabled={isDeleting}>
                取消
              </AlertDialog.Close>
              <button
                className="is-danger"
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? <LoaderCircle className="is-spinning" /> : null}
                {hasContents ? '删除文件夹及其中内容' : '删除文件夹'}
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
  isInsideManagedTree = false,
  isDragging = false,
  sortableProps,
}: {
  folder: BookmarkNode
  level?: number
  canCreate: boolean
  isInsideManagedTree?: boolean
  isDragging?: boolean
  sortableProps?: SortableElementProps
}) {
  const isManagedTree = isInsideManagedTree || folder.folderType === 'managed'
  const canMutateContents = canCreate && !isManagedTree
  const canDeleteFolder = canCreate && !isManagedTree
  const [isExpanded, setIsExpanded] = useState(true)
  const folderContentId = useId()
  const folderTitle = folder.title || '未命名文件夹'
  const toggleLabel = isExpanded ? `收起${folderTitle}` : `展开${folderTitle}`

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
            onClick={() => setIsExpanded((current) => !current)}
          >
            <ChevronRight className={isExpanded ? 'is-expanded' : ''} />
          </button>
          <FolderOpen />
          <h2>{folderTitle}</h2>
          <span>{countBookmarks(folder)} 个书签</span>
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
          {node.title || (isFolderNode ? '未命名文件夹' : getHostname(url))}
        </strong>
        <span>
          {isFolderNode ? `${countBookmarks(node)} 个书签` : getHostname(url)}
        </span>
      </span>
    </div>
  )
}

function SortableFolderChild({
  canCreate,
  canReorder,
  child,
  folderLevel,
  indentBookmarks,
  index,
  isInsideManagedTree,
  parentId,
}: {
  canCreate: boolean
  canReorder: boolean
  child: BookmarkNode
  folderLevel: number
  indentBookmarks: boolean
  index: number
  isInsideManagedTree: boolean
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
      isInsideManagedTree={isInsideManagedTree}
      isDragging={isActive}
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
  const sourceChildren = parent.children ?? EMPTY_BOOKMARK_CHILDREN
  const canReorder = canCreate && !isInsideManagedTree
  const [optimisticChildren, setOptimisticChildren] =
    useState<OptimisticChildren>()
  const [moveError, setMoveError] = useState<string>()
  const moveVersionRef = useRef(0)
  const children =
    optimisticChildren?.source === sourceChildren
      ? optimisticChildren.children
      : sourceChildren

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
    setMoveError(undefined)
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
      setMoveError('排序失败，请重试')
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

  return (
    <DragDropProvider
      sensors={FULL_ROW_SORTABLE_SENSORS}
      onDragStart={() => setMoveError(undefined)}
      onDragEnd={handleDragEnd}
    >
      <div className="bookmark-children">
        {children.map((child, index) => (
          <SortableFolderChild
            key={child.id}
            canCreate={canCreate}
            canReorder={canReorder}
            child={child}
            folderLevel={folderLevel}
            indentBookmarks={indentBookmarks}
            index={index}
            isInsideManagedTree={isInsideManagedTree}
            parentId={parent.id}
          />
        ))}
        {moveError ? (
          <p className="bookmark-sort-error" role="alert">
            {moveError}
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
  const folderTitle = folder.title || '未命名文件夹'

  return (
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
  )
}

export function MatchList({
  canMutate,
  matches,
}: {
  canMutate: boolean
  matches: Array<BookmarkMatch>
}) {
  if (!matches.length) {
    return (
      <EmptyState
        title="没有找到匹配的书签"
        detail="试试标题、域名或文件夹名称。"
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
