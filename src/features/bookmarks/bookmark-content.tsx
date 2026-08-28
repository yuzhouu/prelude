import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { useId, useState } from 'react'
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import {
  createBookmark,
  createBookmarkFolder,
  deleteBookmark,
  getFaviconUrl,
  updateBookmark,
} from './chrome-bookmarks'
import { countBookmarks, getChildFolders, getDirectBookmarks } from './model'
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

function BookmarkFavicon({ title, url }: { title: string; url: string }) {
  const [hasError, setHasError] = useState(false)
  const faviconUrl = getFaviconUrl(url)

  return (
    <span className="bookmark-favicon">
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
          {title.trim().charAt(0).toUpperCase() || '•'}
        </span>
      )}
    </span>
  )
}

export function BookmarkRow({
  canMutate,
  node,
  path,
}: {
  canMutate: boolean
  node: BookmarkNode
  path?: Array<string>
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
      <div className="bookmark-row">
        <a className="bookmark-main-link" href={url}>
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
        <Menu.Root>
          <Menu.Trigger
            className="bookmark-action bookmark-menu-trigger"
            type="button"
            disabled={!canMutate}
            aria-label={`编辑或删除 ${node.title}`}
            title={canMutate ? '更多操作' : '加载为 Chrome 扩展后即可修改'}
          >
            <MoreHorizontal />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              className="bookmark-menu-positioner"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <Menu.Popup className="bookmark-menu-popup">
                <Menu.Item className="bookmark-menu-item" onClick={openEditor}>
                  <Pencil />
                  编辑
                </Menu.Item>
                <Menu.Item
                  className="bookmark-menu-item is-danger"
                  onClick={() => {
                    setDeleteError(undefined)
                    setIsDeleteOpen(true)
                  }}
                >
                  <Trash2 />
                  删除
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
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

function FolderSection({
  folder,
  level = 0,
  canCreate,
}: {
  folder: BookmarkNode
  level?: number
  canCreate: boolean
}) {
  const directBookmarks = getDirectBookmarks(folder)
  const childFolders = getChildFolders(folder)
  const [isExpanded, setIsExpanded] = useState(true)
  const folderContentId = useId()
  const folderTitle = folder.title || '未命名文件夹'
  const toggleLabel = isExpanded ? `收起${folderTitle}` : `展开${folderTitle}`

  return (
    <section
      className="bookmark-group"
      style={{ '--group-level': level } as React.CSSProperties}
    >
      <header className="bookmark-group-header">
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
      </header>
      <div id={folderContentId} hidden={!isExpanded}>
        {childFolders.map((child) => (
          <FolderSection
            key={child.id}
            folder={child}
            level={level + 1}
            canCreate={canCreate}
          />
        ))}
        <div className="bookmark-list">
          {directBookmarks.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              node={bookmark}
              canMutate={canCreate}
            />
          ))}
          <QuickAddBookmarkRow
            folderId={folder.id}
            folderTitle={folderTitle}
            canCreate={canCreate}
          />
        </div>
        <QuickAddFolderRow
          parentId={folder.id}
          parentTitle={folderTitle}
          canCreate={canCreate}
        />
      </div>
    </section>
  )
}

export function FolderContents({
  folder,
  canCreate,
}: {
  folder: BookmarkNode
  canCreate: boolean
}) {
  const directBookmarks = getDirectBookmarks(folder)
  const childFolders = getChildFolders(folder)
  const folderTitle = folder.title || '未命名文件夹'

  return (
    <div className="bookmark-sections">
      {childFolders.map((child) => (
        <FolderSection key={child.id} folder={child} canCreate={canCreate} />
      ))}
      <section className="bookmark-group root-bookmarks">
        <div className="bookmark-list">
          {directBookmarks.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              node={bookmark}
              canMutate={canCreate}
            />
          ))}
          <QuickAddBookmarkRow
            folderId={folder.id}
            folderTitle={folderTitle}
            canCreate={canCreate}
          />
        </div>
      </section>
      <QuickAddFolderRow
        parentId={folder.id}
        parentTitle={folderTitle}
        canCreate={canCreate}
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
        <FolderSection key={root.id} folder={root} canCreate={canCreate} />
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
