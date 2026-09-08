import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ExternalLink,
  Menu,
  MessageSquare,
  PanelLeftOpen,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip'
import { useBookmarkTree } from '../features/bookmarks/chrome-bookmarks'
import {
  countTreeBookmarks,
  getBookmarkMatches,
  getRecentBookmarks,
  getVisibleRoots,
} from '../features/bookmarks/model'
import { Sidebar } from '../features/bookmarks/sidebar'
import {
  getInitialSidebarExpanded,
  persistSidebarExpanded,
} from '../features/bookmarks/sidebar-preference'
import { useOpenTabs } from '../features/tabs/chrome-tabs'
import { countOpenTabs } from '../features/tabs/model'

export const Route = createFileRoute('/about')({ component: About })

const PRELUDE_VERSION = '1.0.0'

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.36 6.76-1.62 6.76-7A5.45 5.45 0 0 0 19.3 3.7 5.1 5.1 0 0 0 19.16.2S18 .16 15 1.68a13.4 13.4 0 0 0-7 0C5 .16 3.84.2 3.84.2A5.1 5.1 0 0 0 3.7 3.7a5.45 5.45 0 0 0-1.46 3.78c0 5.42 3.46 6.68 6.76 7A4.8 4.8 0 0 0 8 18v4" />
      <path d="M8 19c-3 .92-3-1.5-4.2-2" />
    </svg>
  )
}

function About() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tree, isChromeSource } = useBookmarkTree()
  const { windows: openTabWindows } = useOpenTabs()
  const roots = useMemo(() => getVisibleRoots(tree), [tree])
  const bookmarks = useMemo(() => getBookmarkMatches(roots), [roots])
  const recentBookmarks = useMemo(
    () => getRecentBookmarks(bookmarks),
    [bookmarks],
  )
  const totalCount = useMemo(() => countTreeBookmarks(roots), [roots])
  const openTabCount = useMemo(
    () => countOpenTabs(openTabWindows),
    [openTabWindows],
  )

  const [expandedIds, setExpandedIds] = useState(
    () => new Set<string>(['1', 'work']),
  )
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(
    getInitialSidebarExpanded,
  )
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current)
      roots.forEach((root) => next.add(root.id))
      return next
    })
  }, [roots])

  useEffect(() => {
    persistSidebarExpanded(isSidebarExpanded)
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
    setIsMobileSidebarOpen(false)
    void navigate({
      to: '/',
      search: id === 'quick-folders' ? {} : { view: id },
    })
  }

  return (
    <div
      className={`app-shell${isSidebarExpanded ? ' is-sidebar-expanded' : ''}`}
    >
      <Sidebar
        roots={roots}
        isChromeSource={isChromeSource}
        selectedId="about"
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
          void navigate({ to: '/', search: { openSearch: true } })
        }}
        onSelect={selectView}
        onToggle={toggleFolder}
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
          <span>{t('about.title')}</span>
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
            <h1 aria-current="page">{t('about.title')}</h1>
            <span aria-hidden="true">/</span>
          </div>
        </nav>

        <div className="content-column about-content-column">
          <article className="about-page">
            <header className="about-hero">
              <span className="about-avatar" aria-hidden="true">
                <img src="/icons/prelude.svg" alt="" />
              </span>
              <h2>{t('app.name')}</h2>
              <p>{t('about.introduction')}</p>
            </header>

            <section
              className="about-product"
              aria-labelledby="about-prelude-title"
            >
              <h2 id="about-prelude-title">{t('about.privacyTitle')}</h2>
              <p>{t('about.privacyStatement')}</p>
              <nav className="about-links" aria-label={t('about.links.label')}>
                <a
                  href="https://github.com/yuzhouu/supposed"
                  target="_blank"
                  rel="noreferrer"
                >
                  <GitHubIcon />
                  <span>{t('about.links.github')}</span>
                  <ExternalLink className="about-link-external" />
                </a>
                <a
                  href="https://github.com/yuzhouu/supposed/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageSquare />
                  <span>{t('about.links.support')}</span>
                  <ExternalLink className="about-link-external" />
                </a>
                <a href="/privacy.html" target="_blank" rel="noreferrer">
                  <ShieldCheck />
                  <span>{t('about.links.privacy')}</span>
                  <ExternalLink className="about-link-external" />
                </a>
              </nav>
            </section>

            <footer className="about-version">
              {t('about.version', { version: PRELUDE_VERSION })}
            </footer>
          </article>
        </div>
      </main>
    </div>
  )
}
