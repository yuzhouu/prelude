import { useId, useState } from 'react'
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
  LoaderCircle,
  Plus,
} from 'lucide-react'

import { createBookmark, getFaviconUrl } from './chrome-bookmarks'
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
      await createBookmark({
        parentId: folderId,
        title: title.trim() || getDefaultBookmarkTitle(normalizedUrl),
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
          placeholder="标题（可选）"
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
  node,
  path,
}: {
  node: BookmarkNode
  path?: Array<string>
}) {
  const [copied, setCopied] = useState(false)
  const url = node.url ?? '#'

  const copyUrl = () => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_400)
    })
  }

  return (
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
        className="bookmark-action"
        type="button"
        aria-label={copied ? '链接已复制' : `复制 ${node.title} 的链接`}
        title={copied ? '已复制' : '复制链接'}
        onClick={copyUrl}
      >
        {copied ? <Check /> : <Copy />}
      </button>
      <a
        className="bookmark-action"
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`在新标签页打开 ${node.title}`}
        title="在新标签页打开"
      >
        <ExternalLink />
      </a>
    </div>
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
  const hasDirectBookmarks = directBookmarks.length > 0
  const [areBookmarksExpanded, setAreBookmarksExpanded] = useState(true)
  const bookmarkContentId = useId()
  const folderTitle = folder.title || '未命名文件夹'
  const toggleLabel = areBookmarksExpanded
    ? `收起${folderTitle}的直属书签`
    : `展开${folderTitle}的直属书签`

  return (
    <section
      className="bookmark-group"
      style={{ '--group-level': level } as React.CSSProperties}
    >
      <header className="bookmark-group-header">
        <div className="group-title-row">
          {hasDirectBookmarks ? (
            <button
              className="bookmark-group-toggle"
              type="button"
              aria-label={toggleLabel}
              aria-expanded={areBookmarksExpanded}
              aria-controls={bookmarkContentId}
              title={toggleLabel}
              onClick={() => setAreBookmarksExpanded((current) => !current)}
            >
              <ChevronRight
                className={areBookmarksExpanded ? 'is-expanded' : ''}
              />
            </button>
          ) : (
            <span className="bookmark-group-toggle-spacer" />
          )}
          <FolderOpen />
          <h2>{folderTitle}</h2>
          <span>{countBookmarks(folder)} 个书签</span>
        </div>
      </header>
      <div
        id={bookmarkContentId}
        hidden={hasDirectBookmarks && !areBookmarksExpanded}
      >
        <div className="bookmark-list">
          {directBookmarks.map((bookmark) => (
            <BookmarkRow key={bookmark.id} node={bookmark} />
          ))}
          <QuickAddBookmarkRow
            folderId={folder.id}
            folderTitle={folderTitle}
            canCreate={canCreate}
          />
        </div>
      </div>
      {childFolders.map((child) => (
        <FolderSection
          key={child.id}
          folder={child}
          level={level + 1}
          canCreate={canCreate}
        />
      ))}
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
      <section className="bookmark-group root-bookmarks">
        <div className="bookmark-list">
          {directBookmarks.map((bookmark) => (
            <BookmarkRow key={bookmark.id} node={bookmark} />
          ))}
          <QuickAddBookmarkRow
            folderId={folder.id}
            folderTitle={folderTitle}
            canCreate={canCreate}
          />
        </div>
      </section>
      {childFolders.map((child) => (
        <FolderSection key={child.id} folder={child} canCreate={canCreate} />
      ))}
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

export function MatchList({ matches }: { matches: Array<BookmarkMatch> }) {
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
        <BookmarkRow key={match.node.id} node={match.node} path={match.path} />
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
