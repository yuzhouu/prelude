import type { CSSProperties } from 'react'
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Clock3,
  Folder,
  PanelLeftClose,
  PanelsTopLeft,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import { SearchTrigger } from '../search/search-trigger'
import { SettingsDialog } from '../settings/settings-dialog'
import { ThemeToggle } from '../theme/theme-toggle'
import { countBookmarks, isFolder } from './model'
import type { BookmarkNode } from './model'

function getBookmarkSyncSummary(
  roots: Array<BookmarkNode>,
  t: TFunction<'translation'>,
) {
  const topLevelFolders = roots.filter(
    (node) => isFolder(node) && node.folderType !== undefined,
  )
  const foldersWithBookmarks = topLevelFolders.filter(
    (node) => countBookmarks(node) > 0,
  )
  const foldersToSummarize =
    foldersWithBookmarks.length > 0 ? foldersWithBookmarks : topLevelFolders

  if (
    foldersToSummarize.length === 0 ||
    foldersToSummarize.some((node) => node.syncing === undefined)
  ) {
    return {
      className: 'is-unknown',
      label: t('sync.unknown.label'),
      title: t('sync.unknown.title'),
    }
  }

  if (foldersToSummarize.every((node) => node.syncing)) {
    return {
      className: 'is-synced',
      label: t('sync.synced.label'),
      title: t('sync.synced.title'),
    }
  }

  if (foldersToSummarize.some((node) => node.syncing)) {
    return {
      className: 'is-partial',
      label: t('sync.partial.label'),
      title: t('sync.partial.title'),
    }
  }

  return {
    className: 'is-local',
    label: t('sync.local.label'),
    title: t('sync.local.title'),
  }
}

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
  const { t } = useTranslation()
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
            aria-label={t(
              isExpanded
                ? 'bookmarks.folder.collapse'
                : 'bookmarks.folder.expand',
              { title: node.title },
            )}
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
            {node.title || t('common.unnamedFolder')}
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
  totalCount: number
  recentCount: number
  tabCount: number
  isExpanded: boolean
  isMobileOpen: boolean
  onCollapse: () => void
  onMobileClose: () => void
  onSearchOpen: () => void
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

export function Sidebar({
  roots,
  selectedId,
  expandedIds,
  totalCount,
  recentCount,
  tabCount,
  isExpanded,
  isMobileOpen,
  onCollapse,
  onMobileClose,
  onSearchOpen,
  onSelect,
  onToggle,
}: SidebarProps) {
  const { t } = useTranslation()
  const syncSummary = getBookmarkSyncSummary(roots, t)

  return (
    <>
      <button
        className={`sidebar-scrim${isMobileOpen ? ' is-open' : ''}`}
        type="button"
        aria-label={t('navigation.closeFolderNavigation')}
        onClick={onMobileClose}
      />
      <aside
        className={`sidebar${isExpanded ? ' is-expanded' : ''}${isMobileOpen ? ' is-mobile-open' : ''}`}
      >
        <div className="sidebar-brand">
          <div className="app-identity">
            <span className="app-logo" aria-hidden="true">
              <img src="/icons/prelude.svg" alt="" />
            </span>
            <div className="app-brand-copy">
              <strong className="app-name">{t('app.name')}</strong>
              <span
                className={`bookmark-sync-summary ${syncSummary.className}`}
                title={syncSummary.title}
                aria-label={t('sync.allBookmarksStatus', {
                  status: syncSummary.label,
                })}
              >
                <span className="bookmark-sync-dot" aria-hidden="true" />
                {syncSummary.label}
              </span>
            </div>
          </div>
          <div className="profile-actions">
            <button
              className="sidebar-collapse-button"
              type="button"
              aria-label={t('navigation.collapseSidebar')}
              onClick={onCollapse}
            >
              <PanelLeftClose />
            </button>
            <button
              className="mobile-close-button"
              type="button"
              aria-label={t('navigation.closeFolderNavigation')}
              onClick={onMobileClose}
            >
              <X />
            </button>
          </div>
        </div>

        <SearchTrigger onOpen={onSearchOpen} />

        <nav
          className="sidebar-nav"
          aria-label={t('navigation.bookmarkNavigation')}
        >
          <button
            className={`utility-row${selectedId === 'quick-folders' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('quick-folders')}
          >
            <CalendarDays />
            <span>{t('navigation.quickFolders')}</span>
          </button>
          <button
            className={`utility-row${selectedId === 'tabs' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('tabs')}
          >
            <PanelsTopLeft />
            <span>{t('navigation.currentTabs')}</span>
            <span className="utility-count">{tabCount}</span>
          </button>
          <button
            className={`utility-row${selectedId === 'recent' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('recent')}
          >
            <Clock3 />
            <span>{t('navigation.recent')}</span>
            <span className="utility-count">{recentCount}</span>
          </button>
          <button
            className={`utility-row${selectedId === 'all' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => onSelect('all')}
          >
            <Bookmark />
            <span>{t('navigation.allBookmarks')}</span>
            <span className="utility-count">{totalCount}</span>
          </button>
        </nav>

        <div className="folder-tree-header">
          <span>{t('navigation.folders')}</span>
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
        <div className="sidebar-footer">
          <ThemeToggle />
          <SettingsDialog />
        </div>
      </aside>
    </>
  )
}
