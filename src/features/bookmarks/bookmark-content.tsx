import { useId, useState } from 'react'
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
} from 'lucide-react'

import { getFaviconUrl } from './chrome-bookmarks'
import { countBookmarks, getChildFolders, getDirectBookmarks } from './model'
import type { BookmarkMatch, BookmarkNode } from './model'

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
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
}: {
  folder: BookmarkNode
  level?: number
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
      <div id={bookmarkContentId} hidden={!areBookmarksExpanded}>
        {hasDirectBookmarks ? (
          <div className="bookmark-list">
            {directBookmarks.map((bookmark) => (
              <BookmarkRow key={bookmark.id} node={bookmark} />
            ))}
          </div>
        ) : null}
      </div>
      {childFolders.map((child) => (
        <FolderSection key={child.id} folder={child} level={level + 1} />
      ))}
    </section>
  )
}

export function FolderContents({ folder }: { folder: BookmarkNode }) {
  const directBookmarks = getDirectBookmarks(folder)
  const childFolders = getChildFolders(folder)

  if (!directBookmarks.length && !childFolders.length) {
    return (
      <EmptyState
        title="这个文件夹还是空的"
        detail="在 Chrome 中添加书签后，它会自动出现在这里。"
      />
    )
  }

  return (
    <div className="bookmark-sections">
      {directBookmarks.length ? (
        <section className="bookmark-group root-bookmarks">
          <div className="bookmark-list">
            {directBookmarks.map((bookmark) => (
              <BookmarkRow key={bookmark.id} node={bookmark} />
            ))}
          </div>
        </section>
      ) : null}
      {childFolders.map((child) => (
        <FolderSection key={child.id} folder={child} />
      ))}
    </div>
  )
}

export function AllBookmarkContents({ roots }: { roots: Array<BookmarkNode> }) {
  return (
    <div className="bookmark-sections">
      {roots.map((root) => (
        <FolderSection key={root.id} folder={root} />
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
