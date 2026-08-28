import type { CSSProperties, FormEvent, RefObject } from 'react'
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  Clock3,
  Folder,
  FolderPlus,
  PanelsTopLeft,
  Search,
  Settings2,
  X,
} from 'lucide-react'

import { openBookmarkManager } from './chrome-bookmarks'
import { countBookmarks, isFolder } from './model'
import type { BookmarkNode } from './model'
import { USER_INITIAL, USER_NAME } from '../../user-profile'

interface FolderTreeRowProps {
  node: BookmarkNode
  depth: number
  expandedIds: Set<string>
  selectedId: string
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

function FolderTreeRow({
  node,
  depth,
  expandedIds,
  selectedId,
  onSelect,
  onToggle,
}: FolderTreeRowProps) {
  const folders = (node.children ?? []).filter(isFolder)
  const hasFolders = folders.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  return (
    <li>
      <div
        className={`folder-tree-row${isSelected ? ' is-selected' : ''}`}
        style={{ '--tree-depth': depth } as CSSProperties}
      >
        {hasFolders ? (
          <button
            className="folder-tree-toggle"
            type="button"
            aria-label={isExpanded ? `收起${node.title}` : `展开${node.title}`}
            aria-expanded={isExpanded}
            onClick={() => onToggle(node.id)}
          >
            <ChevronRight className={isExpanded ? 'is-expanded' : ''} />
          </button>
        ) : (
          <span className="folder-tree-spacer" />
        )}
        <button
          className="folder-tree-select"
          type="button"
          onClick={() => onSelect(node.id)}
        >
          <Folder />
          <span className="folder-tree-title">
            {node.title || '未命名文件夹'}
          </span>
          <span className="folder-tree-count">{countBookmarks(node)}</span>
        </button>
      </div>
      {hasFolders && isExpanded ? (
        <ul className="folder-tree-children">
          {folders.map((folder) => (
            <FolderTreeRow
              key={folder.id}
              node={folder}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface SidebarProps {
  roots: Array<BookmarkNode>
  selectedId: string
  expandedIds: Set<string>
  query: string
  totalCount: number
  recentCount: number
  tabCount: number
  isOpen: boolean
  isChromeSource: boolean
  isTabView: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  onQueryChange: (query: string) => void
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

export function Sidebar({
  roots,
  selectedId,
  expandedIds,
  query,
  totalCount,
  recentCount,
  tabCount,
  isOpen,
  isChromeSource,
  isTabView,
  searchInputRef,
  onClose,
  onQueryChange,
  onSearchSubmit,
  onSelect,
  onToggle,
}: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-scrim${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-label="关闭文件夹导航"
        onClick={onClose}
      />
      <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="sidebar-profile">
          <div className="account-avatar">{USER_INITIAL}</div>
          <div
            className="profile-switcher"
            title={isChromeSource ? '已同步 Chrome' : '预览数据'}
          >
            <strong>{USER_NAME}</strong>
            <ChevronDown />
            <span className="sr-only">
              {isChromeSource ? '已同步 Chrome' : '预览数据'}
            </span>
          </div>
          <div className="profile-actions">
            <button
              className="mobile-close-button"
              type="button"
              aria-label="关闭文件夹导航"
              onClick={onClose}
            >
              <X />
            </button>
          </div>
        </div>

        <form className="sidebar-search" onSubmit={onSearchSubmit}>
          <Search />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            placeholder={isTabView ? '搜索当前标签页' : '搜索'}
            aria-label={isTabView ? '搜索当前标签页' : '搜索书签或输入网址'}
            autoComplete="off"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </form>

        <nav className="sidebar-nav" aria-label="书签导航">
          <button
            className={`utility-row${selectedId === 'quick-folders' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('quick-folders')}
          >
            <FolderPlus />
            <span>快捷文件夹</span>
          </button>
          <button
            className={`utility-row${selectedId === 'tabs' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('tabs')}
          >
            <PanelsTopLeft />
            <span>当前标签页</span>
            <span className="utility-count">{tabCount}</span>
          </button>
          <button
            className={`utility-row${selectedId === 'recent' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('recent')}
          >
            <Clock3 />
            <span>最近添加</span>
            <span className="utility-count">{recentCount}</span>
          </button>
          <button
            className={`utility-row${selectedId === 'all' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('all')}
          >
            <Bookmark />
            <span>全部书签</span>
            <span className="utility-count">{totalCount}</span>
          </button>
        </nav>

        <div className="folder-tree-header">
          <span>文件夹</span>
          <button
            className="folder-settings-button"
            type="button"
            aria-label="管理书签"
            title="管理书签"
            onClick={openBookmarkManager}
          >
            <Settings2 />
          </button>
        </div>
        <ul className="folder-tree">
          {roots.filter(isFolder).map((root) => (
            <FolderTreeRow
              key={root.id}
              node={root}
              depth={0}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      </aside>
    </>
  )
}
