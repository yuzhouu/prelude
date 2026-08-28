import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Menu, MoreHorizontal } from 'lucide-react'

import {
  AllBookmarkContents,
  FolderContents,
  MatchList,
} from '../features/bookmarks/bookmark-content'
import {
  hasDefaultBookmarkContainer,
  openBookmarkManager,
  useBookmarkTree,
} from '../features/bookmarks/chrome-bookmarks'
import { DefaultFoldersSetup } from '../features/bookmarks/default-folders-setup'
import {
  countBookmarks,
  countTreeBookmarks,
  findNode,
  getBookmarkMatches,
  getRecentBookmarks,
  getVisibleRoots,
  searchBookmarks,
} from '../features/bookmarks/model'
import { Sidebar } from '../features/bookmarks/sidebar'
import { useOpenTabs } from '../features/tabs/chrome-tabs'
import { OpenTabsContents } from '../features/tabs/tab-content'
import { countOpenTabs, filterOpenTabs } from '../features/tabs/model'
import { USER_NAME } from '../user-profile'

export const Route = createFileRoute('/')({ component: Home })

function getDateLabel(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
    .format(date)
    .replace('星期', ' · 星期')
}

function getGreeting(date: Date) {
  const hour = date.getHours()
  if (hour < 11) return `早上好，${USER_NAME}`
  if (hour < 14) return `中午好，${USER_NAME}`
  if (hour < 18) return `下午好，${USER_NAME}`
  return `晚上好，${USER_NAME}`
}

function getNavigableUrl(value: string) {
  const query = value.trim()
  if (/^(https?:|chrome:|file:)/i.test(query)) return query
  if (/^[\w-]+(?:\.[\w-]+)+(?:[/#?].*)?$/i.test(query)) {
    return `https://${query}`
  }
  return undefined
}

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
  const hasDefaultFolders = useMemo(
    () => hasDefaultBookmarkContainer(roots),
    [roots],
  )

  const [selectedId, setSelectedId] = useState('tabs')
  const [expandedIds, setExpandedIds] = useState(
    () => new Set<string>(['1', 'work']),
  )
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const deferredQuery = useDeferredValue(query)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedNode = useMemo(
    () =>
      selectedId === 'all' ||
      selectedId === 'recent' ||
      selectedId === 'tabs' ||
      selectedId === 'quick-folders'
        ? undefined
        : findNode(roots, selectedId),
    [roots, selectedId],
  )

  const searchMatches = useMemo(
    () => searchBookmarks(bookmarks, deferredQuery),
    [bookmarks, deferredQuery],
  )
  const filteredTabWindows = useMemo(
    () => filterOpenTabs(openTabWindows, deferredQuery),
    [deferredQuery, openTabWindows],
  )
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    setQuery('')
    setSidebarOpen(false)
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const url = getNavigableUrl(query)
    if (url) window.location.assign(url)
  }

  const isSearching = deferredQuery.trim().length > 0
  const isTabView = selectedId === 'tabs'
  const isQuickFoldersView = selectedId === 'quick-folders'
  const viewTitle = isSearching
    ? '搜索结果'
    : selectedId === 'all'
      ? '全部书签'
      : selectedId === 'recent'
        ? '最近添加'
        : isQuickFoldersView
          ? '快捷文件夹'
          : isTabView
            ? '当前标签页'
            : selectedNode?.title || '书签'
  const viewCount = isSearching
    ? isTabView
      ? countOpenTabs(filteredTabWindows)
      : searchMatches.length
    : selectedId === 'all'
      ? totalCount
      : selectedId === 'recent'
        ? recentBookmarks.length
        : isQuickFoldersView
          ? undefined
          : isTabView
            ? openTabCount
            : selectedNode
              ? countBookmarks(selectedNode)
              : 0
  const viewCountLabel =
    viewCount === undefined
      ? undefined
      : isTabView
        ? `${viewCount} 个标签页`
        : `${viewCount} 个书签`

  const today = new Date()

  return (
    <div className="app-shell">
      <Sidebar
        roots={roots}
        selectedId={selectedId}
        expandedIds={expandedIds}
        query={query}
        totalCount={totalCount}
        recentCount={recentBookmarks.length}
        tabCount={openTabCount}
        isOpen={sidebarOpen}
        isChromeSource={isChromeSource}
        isTabView={isTabView}
        searchInputRef={searchInputRef}
        onClose={() => setSidebarOpen(false)}
        onQueryChange={setQuery}
        onSearchSubmit={handleSearchSubmit}
        onSelect={selectView}
        onToggle={toggleFolder}
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
        </div>

        <div className="content-column">
          <header className="greeting-block">
            <div className="greeting-title-row">
              <h1>{getGreeting(today)}</h1>
              <p>{getDateLabel(today)}</p>
            </div>
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
          </header>

          <div className="view-header">
            <div className="view-title-row">
              <h2>{viewTitle}</h2>
              {viewCountLabel ? <span>{viewCountLabel}</span> : null}
            </div>
          </div>

          <div className="view-content">
            {isSearching ? (
              isTabView ? (
                <OpenTabsContents
                  windows={filteredTabWindows}
                  onActivate={activateTab}
                />
              ) : (
                <MatchList matches={searchMatches} />
              )
            ) : isTabView ? (
              <OpenTabsContents
                windows={openTabWindows}
                onActivate={activateTab}
              />
            ) : isQuickFoldersView ? (
              <DefaultFoldersSetup
                isChromeSource={isChromeSource}
                hasDefaultFolders={hasDefaultFolders}
              />
            ) : selectedId === 'all' ? (
              <AllBookmarkContents roots={roots} canCreate={isChromeSource} />
            ) : selectedId === 'recent' ? (
              <MatchList matches={recentBookmarks} />
            ) : selectedNode ? (
              <FolderContents
                folder={selectedNode}
                canCreate={isChromeSource}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
