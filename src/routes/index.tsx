import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Menu, MoreHorizontal } from 'lucide-react'

import {
  AllBookmarkContents,
  FolderDeleteButton,
  FolderContents,
  MatchList,
} from '../features/bookmarks/bookmark-content'
import {
  findDefaultBookmarkContainer,
  openBookmarkManager,
  useBookmarkTree,
} from '../features/bookmarks/chrome-bookmarks'
import { DefaultFoldersSetup } from '../features/bookmarks/default-folders-setup'
import {
  countTreeBookmarks,
  findNodeLocation,
  getBookmarkMatches,
  getRecentBookmarks,
  getVisibleRoots,
} from '../features/bookmarks/model'
import { Sidebar } from '../features/bookmarks/sidebar'
import { BookmarkSearchDialog } from '../features/search/bookmark-search-dialog'
import { useOpenTabs } from '../features/tabs/chrome-tabs'
import { OpenTabsContents } from '../features/tabs/tab-content'
import { countOpenTabs } from '../features/tabs/model'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { tree, isChromeSource } = useBookmarkTree()
  const { windows: openTabWindows, activateTab } = useOpenTabs()
  const roots = useMemo(() => getVisibleRoots(tree), [tree])
  const bookmarks = useMemo(() => getBookmarkMatches(roots), [roots])
  const recentBookmarks = useMemo(
    () => getRecentBookmarks(bookmarks),
    [bookmarks],
  )
  const totalCount = useMemo(() => countTreeBookmarks(roots), [roots])
  const defaultBookmarkContainer = useMemo(
    () => findDefaultBookmarkContainer(roots),
    [roots],
  )

  const [selectedId, setSelectedId] = useState('quick-folders')
  const [expandedIds, setExpandedIds] = useState(
    () => new Set<string>(['1', 'work']),
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const selectedLocation = useMemo(
    () =>
      selectedId === 'all' ||
      selectedId === 'recent' ||
      selectedId === 'tabs' ||
      selectedId === 'quick-folders'
        ? undefined
        : findNodeLocation(roots, selectedId),
    [roots, selectedId],
  )
  const selectedNode = selectedLocation?.node

  const openTabCount = useMemo(
    () => countOpenTabs(openTabWindows),
    [openTabWindows],
  )

  useEffect(() => {
    if (
      selectedId === 'all' ||
      selectedId === 'recent' ||
      selectedId === 'tabs' ||
      selectedId === 'quick-folders' ||
      selectedNode
    )
      return
    setSelectedId(roots.find((node) => !node.url)?.id ?? 'all')
  }, [roots, selectedId, selectedNode])

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current)
      roots.forEach((root) => next.add(root.id))
      return next
    })
  }, [roots])

  const toggleFolder = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectView = (id: string) => {
    setSelectedId(id)
    setSidebarOpen(false)
  }
  const handleSelectedFolderDeleted = () => {
    if (selectedNode?.id === defaultBookmarkContainer?.id) {
      setSelectedId('quick-folders')
      return
    }

    setSelectedId(selectedLocation?.parentId ?? 'quick-folders')
  }
  const selectedFolderDeleteTarget =
    selectedLocation &&
    selectedLocation.node.folderType === undefined &&
    !selectedLocation.isManaged
      ? selectedLocation
      : undefined
  const canDeleteSelectedFolder =
    isChromeSource && selectedFolderDeleteTarget !== undefined
  const isTabView = selectedId === 'tabs'
  const isQuickFoldersView = selectedId === 'quick-folders'
  const viewTitle =
    selectedId === 'all'
      ? '全部书签'
      : selectedId === 'recent'
        ? '最近添加'
        : isQuickFoldersView
          ? '快捷文件夹'
          : isTabView
            ? '当前标签页'
            : selectedNode?.title || '书签'
  return (
    <div className="app-shell">
      <Sidebar
        roots={roots}
        selectedId={selectedId}
        expandedIds={expandedIds}
        totalCount={totalCount}
        recentCount={recentBookmarks.length}
        tabCount={openTabCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={() => {
          setSidebarOpen(false)
          setSearchOpen(true)
        }}
        onSelect={selectView}
        onToggle={toggleFolder}
      />

      <BookmarkSearchDialog
        bookmarks={bookmarks}
        openTabWindows={openTabWindows}
        isOpen={searchOpen}
        onActivateTab={activateTab}
        onOpenChange={setSearchOpen}
      />

      <main className="main-surface">
        <div className="mobile-topbar">
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="打开文件夹导航"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </button>
          <span>{viewTitle}</span>
          {selectedFolderDeleteTarget ? (
            <FolderDeleteButton
              className="is-mobile-topbar"
              folder={selectedFolderDeleteTarget.node}
              canDelete={canDeleteSelectedFolder}
              onDeleted={handleSelectedFolderDeleted}
            />
          ) : null}
        </div>

        <nav className="main-breadcrumb" aria-label="当前位置">
          <div className="breadcrumb-current">
            <h1 aria-current="page">{viewTitle}</h1>
            <span aria-hidden="true">/</span>
          </div>
          <div className="breadcrumb-actions">
            {selectedFolderDeleteTarget ? (
              <FolderDeleteButton
                className="is-breadcrumb"
                folder={selectedFolderDeleteTarget.node}
                canDelete={canDeleteSelectedFolder}
                onDeleted={handleSelectedFolderDeleted}
              />
            ) : null}
            {!isTabView && !isQuickFoldersView ? (
              <button
                className="view-menu-button"
                type="button"
                aria-label="管理书签"
                title="管理书签"
                onClick={openBookmarkManager}
              >
                <MoreHorizontal />
              </button>
            ) : null}
          </div>
        </nav>

        <div className="content-column">
          <div className="view-content">
            {isTabView ? (
              <OpenTabsContents
                windows={openTabWindows}
                onActivate={activateTab}
              />
            ) : isQuickFoldersView ? (
              defaultBookmarkContainer ? (
                <FolderContents
                  folder={defaultBookmarkContainer}
                  canCreate={isChromeSource}
                />
              ) : (
                <DefaultFoldersSetup isChromeSource={isChromeSource} />
              )
            ) : selectedId === 'all' ? (
              <AllBookmarkContents roots={roots} canCreate={isChromeSource} />
            ) : selectedId === 'recent' ? (
              <MatchList matches={recentBookmarks} canMutate={isChromeSource} />
            ) : selectedNode ? (
              <FolderContents
                folder={selectedNode}
                canCreate={isChromeSource}
                isInsideManagedTree={selectedLocation.isManaged}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
