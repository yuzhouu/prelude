import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Menu, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip'
import {
  AllBookmarkContents,
  BookmarkOpenTabScope,
  FolderDeleteButton,
  FolderContents,
  MatchList,
} from '../features/bookmarks/bookmark-content'
import {
  findDefaultBookmarkContainer,
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
import { normalizeCapturedUrl } from '../features/capture/model'
import { BookmarkSearchDialog } from '../features/search/bookmark-search-dialog'
import { useOpenTabs } from '../features/tabs/chrome-tabs'
import { OpenTabsContents } from '../features/tabs/tab-content'
import { countOpenTabs } from '../features/tabs/model'

export const Route = createFileRoute('/')({ component: Home })

const SIDEBAR_EXPANDED_STORAGE_KEY = 'prelude:sidebar-expanded:v1'

function getInitialSidebarExpanded() {
  try {
    return window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

function Home() {
  const { t } = useTranslation()
  const { tree, isChromeSource } = useBookmarkTree()
  const {
    windows: openTabWindows,
    isChromeSource: areTabsFromChrome,
    activateTab,
    closeTab,
  } = useOpenTabs()
  const roots = useMemo(() => getVisibleRoots(tree), [tree])
  const bookmarks = useMemo(() => getBookmarkMatches(roots), [roots])
  const recentBookmarks = useMemo(
    () => getRecentBookmarks(bookmarks),
    [bookmarks],
  )
  const totalCount = useMemo(() => countTreeBookmarks(roots), [roots])
  const bookmarkedUrlKeys = useMemo(
    () =>
      new Set(
        bookmarks.flatMap(({ node }) =>
          node.url ? [normalizeCapturedUrl(node.url)] : [],
        ),
      ),
    [bookmarks],
  )
  const defaultBookmarkContainer = useMemo(
    () => findDefaultBookmarkContainer(roots),
    [roots],
  )

  const [selectedId, setSelectedId] = useState('quick-folders')
  const [expandedIds, setExpandedIds] = useState(
    () => new Set<string>(['1', 'work']),
  )
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(
    getInitialSidebarExpanded,
  )
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
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

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_EXPANDED_STORAGE_KEY,
        String(isSidebarExpanded),
      )
    } catch {
      // Keep the in-memory preference when browser storage is unavailable.
    }
  }, [isSidebarExpanded])

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
    setIsMobileSidebarOpen(false)
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
      ? t('navigation.allBookmarks')
      : selectedId === 'recent'
        ? t('navigation.recent')
        : isQuickFoldersView
          ? t('navigation.quickFolders')
          : isTabView
            ? t('navigation.currentTabs')
            : selectedNode?.title || t('navigation.bookmarks')
  return (
    <div
      className={`app-shell${isSidebarExpanded ? ' is-sidebar-expanded' : ''}`}
    >
      <Sidebar
        roots={roots}
        selectedId={selectedId}
        expandedIds={expandedIds}
        totalCount={totalCount}
        recentCount={recentBookmarks.length}
        tabCount={openTabCount}
        isExpanded={isSidebarExpanded}
        isMobileOpen={isMobileSidebarOpen}
        onCollapse={() => setIsSidebarExpanded(false)}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onSearchOpen={() => {
          setIsMobileSidebarOpen(false)
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
            aria-label={t('navigation.openFolderNavigation')}
            onClick={() => setIsMobileSidebarOpen(true)}
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

        <nav
          className="main-breadcrumb"
          aria-label={t('navigation.currentLocation')}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="sidebar-expand-button"
                  type="button"
                  aria-label={t('navigation.expandSidebar')}
                  onClick={() => setIsSidebarExpanded(true)}
                >
                  <PanelLeftOpen />
                </button>
              }
            />
            <TooltipContent side="bottom">
              {t('navigation.expandSidebar')}
            </TooltipContent>
          </Tooltip>
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
          </div>
        </nav>

        <div className="content-column">
          <BookmarkOpenTabScope
            openTabWindows={openTabWindows}
            onActivateTab={activateTab}
          >
            <div className="view-content">
              {isTabView ? (
                <OpenTabsContents
                  bookmarkedUrlKeys={bookmarkedUrlKeys}
                  canCapture={isChromeSource && areTabsFromChrome}
                  canClose={areTabsFromChrome}
                  windows={openTabWindows}
                  onActivate={activateTab}
                  onClose={closeTab}
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
                <MatchList
                  matches={recentBookmarks}
                  canMutate={isChromeSource}
                />
              ) : selectedNode ? (
                <FolderContents
                  folder={selectedNode}
                  canCreate={isChromeSource}
                  isInsideManagedTree={selectedLocation.isManaged}
                />
              ) : null}
            </div>
          </BookmarkOpenTabScope>
        </div>
      </main>
    </div>
  )
}
