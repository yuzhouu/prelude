import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { Fragment, useId, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
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
        className={`bookmark-row${sortableProps ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}${isNested ? ' is-nested' : ''}`}
        draggable={sortableProps?.draggable}
        data-sortable-id={sortableProps?.['data-sortable-id']}
        data-sortable-kind={sortableProps?.['data-sortable-kind']}
        onDragStart={sortableProps?.onDragStart}
        onDragOver={sortableProps?.onDragOver}
        onDrop={sortableProps?.onDrop}
        onDragEnd={sortableProps?.onDragEnd}
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
      className={`bookmark-group${sortableProps ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={{ '--group-level': level } as React.CSSProperties}
      data-sortable-id={sortableProps?.['data-sortable-id']}
      data-sortable-kind={sortableProps?.['data-sortable-kind']}
      onDragOver={sortableProps?.onDragOver}
      onDrop={sortableProps?.onDrop}
    >
      <header
        className="bookmark-group-header"
        draggable={sortableProps?.draggable}
        onDragStart={(event) => {
          if (!sortableProps) return
          setIsExpanded(false)
          sortableProps.onDragStart(event)
        }}
        onDragEnd={sortableProps?.onDragEnd}
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
  draggable: true
  'data-sortable-id': string
  'data-sortable-kind': SortableItemKind
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

interface DraggedBookmarkItem {
  id: string
  index: number
  kind: SortableItemKind
}

function SortPlaceholder({
  folderLevel,
  indentBookmarks,
  kind,
  onDragOver,
  onDrop,
}: {
  folderLevel: number
  indentBookmarks: boolean
  kind: SortableItemKind
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      className={`bookmark-sort-placeholder is-${kind}${kind === 'bookmark' && indentBookmarks ? ' is-nested' : ''}`}
      style={{ '--group-level': folderLevel } as CSSProperties}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span>{kind === 'folder' ? '移动文件夹到这里' : '移动网址到这里'}</span>
    </div>
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
  const children = parent.children ?? []
  const canReorder = canCreate && !isInsideManagedTree
  const [draggedItem, setDraggedItem] = useState<DraggedBookmarkItem>()
  const [placeholderIndex, setPlaceholderIndex] = useState<number>()
  const [moveError, setMoveError] = useState<string>()

  const clearDragState = () => {
    setDraggedItem(undefined)
    setPlaceholderIndex(undefined)
  }

  const handleDrop = async (event: DragEvent<HTMLElement>) => {
    if (!draggedItem || placeholderIndex === undefined) return

    event.preventDefault()
    event.stopPropagation()

    const destinationIndex = placeholderIndex
    const isSamePosition =
      destinationIndex === draggedItem.index ||
      destinationIndex === draggedItem.index + 1

    clearDragState()
    if (isSamePosition) return

    setMoveError(undefined)
    try {
      await moveBookmarkNode({
        id: draggedItem.id,
        index: destinationIndex,
        parentId: parent.id,
      })
    } catch {
      setMoveError('排序失败，请重试')
    }
  }

  const getSortableProps = (
    child: BookmarkNode,
    index: number,
  ): SortableElementProps | undefined => {
    if (!canReorder) return undefined

    const kind = child.url === undefined ? 'folder' : 'bookmark'
    return {
      draggable: true,
      'data-sortable-id': child.id,
      'data-sortable-kind': kind,
      onDragStart: (event) => {
        event.stopPropagation()
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', child.id)
        setMoveError(undefined)
        setDraggedItem({ id: child.id, index, kind })
        setPlaceholderIndex(index)
      },
      onDragOver: (event) => {
        if (!draggedItem) return

        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'move'

        const itemElement = event.currentTarget
        const folderHeader =
          kind === 'folder'
            ? itemElement.querySelector<HTMLElement>(
                ':scope > .bookmark-group-header',
              )
            : undefined
        const rect = (folderHeader ?? itemElement).getBoundingClientRect()
        const nextIndex =
          event.clientY < rect.top + rect.height / 2 ? index : index + 1
        setPlaceholderIndex((current) =>
          current === nextIndex ? current : nextIndex,
        )
      },
      onDrop: (event) => void handleDrop(event),
      onDragEnd: clearDragState,
    }
  }

  const renderPlaceholder = (index: number) =>
    draggedItem && placeholderIndex === index ? (
      <SortPlaceholder
        folderLevel={folderLevel}
        indentBookmarks={indentBookmarks}
        kind={draggedItem.kind}
        onDragOver={(event) => {
          event.preventDefault()
          event.stopPropagation()
          event.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(event) => void handleDrop(event)}
      />
    ) : null

  return (
    <div className="bookmark-children">
      {children.map((child, index) => {
        const isFolderNode = child.url === undefined
        const isDragging = draggedItem?.id === child.id
        const sortableProps = getSortableProps(child, index)

        return (
          <Fragment key={child.id}>
            {renderPlaceholder(index)}
            {isFolderNode ? (
              <FolderSection
                folder={child}
                level={folderLevel}
                canCreate={canCreate}
                isInsideManagedTree={isInsideManagedTree}
                isDragging={isDragging}
                sortableProps={sortableProps}
              />
            ) : (
              <BookmarkRow
                node={child}
                canMutate={canReorder}
                isDragging={isDragging}
                isNested={indentBookmarks}
                sortableProps={sortableProps}
              />
            )}
          </Fragment>
        )
      })}
      {renderPlaceholder(children.length)}
      {moveError ? (
        <p className="bookmark-sort-error" role="alert">
          {moveError}
        </p>
      ) : null}
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
