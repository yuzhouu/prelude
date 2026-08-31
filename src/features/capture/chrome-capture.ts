import {
  CLOSE_AFTER_CAPTURE_STORAGE_KEY,
  READ_LATER_FOLDER_STORAGE_KEY,
  isCaptureableUrl,
  normalizeCapturedUrl,
} from './model'
import type {
  CaptureKind,
  CapturePlan,
  CapturePlanItem,
  CaptureResult,
  CaptureSnapshot,
  CaptureTab,
  DuplicatePolicy,
} from './model'

interface BookmarkNode {
  id: string
  title: string
  url?: string
  children?: Array<BookmarkNode>
}

interface ChromeTab {
  id?: number
  windowId: number
  groupId?: number
  index: number
  title?: string
  url?: string
  pinned: boolean
  active: boolean
  lastAccessed?: number
}

interface ChromeApi {
  bookmarks?: {
    create: (details: {
      index?: number
      parentId?: string
      title: string
      url?: string
    }) => Promise<BookmarkNode>
    get: (idOrIdList: string | Array<string>) => Promise<Array<BookmarkNode>>
    getTree: () => Promise<Array<BookmarkNode>>
  }
  i18n?: {
    getUILanguage: () => string
  }
  runtime?: {
    id?: string
  }
  storage?: {
    local: {
      get: (
        keys?: string | Array<string> | Record<string, unknown> | null,
      ) => Promise<Record<string, unknown>>
      remove: (keys: string | Array<string>) => Promise<void>
      set: (items: Record<string, unknown>) => Promise<void>
    }
  }
  tabGroups?: {
    get: (groupId: number) => Promise<{ title?: string }>
  }
  tabs?: {
    query: (queryInfo: { currentWindow?: boolean }) => Promise<Array<ChromeTab>>
    remove: (tabIds: number | Array<number>) => Promise<void>
  }
}

const CONTAINER_TITLES = ['序幕', 'Prelude', '开篇', '今巡', '书签 · 新标签页']
const READ_LATER_TITLES = [
  '待读',
  'Read later',
  '後で読む',
  'Leer más tarde',
  'À lire plus tard',
  'Прочитать позже',
]
const TAB_GROUP_ID_NONE = -1
let pendingReadLaterFolder: Promise<BookmarkNode> | undefined

const CAPTURE_NAMES = {
  en: {
    container: 'Prelude',
    group: 'Tab group',
    readLater: 'Read later',
    window: 'Window',
  },
  es: {
    container: 'Prelude',
    group: 'Grupo de pestañas',
    readLater: 'Leer más tarde',
    window: 'Ventana',
  },
  fr: {
    container: 'Prelude',
    group: 'Groupe d’onglets',
    readLater: 'À lire plus tard',
    window: 'Fenêtre',
  },
  ja: {
    container: 'Prelude',
    group: 'タブグループ',
    readLater: '後で読む',
    window: 'ウィンドウ',
  },
  ru: {
    container: 'Prelude',
    group: 'Группа вкладок',
    readLater: 'Прочитать позже',
    window: 'Окно',
  },
  zh: {
    container: '序幕',
    group: '标签组',
    readLater: '待读',
    window: '窗口',
  },
} as const

function getChromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
}

function isCaptureLanguage(
  languageCode: string,
): languageCode is keyof typeof CAPTURE_NAMES {
  return Object.hasOwn(CAPTURE_NAMES, languageCode)
}

function getCaptureNames() {
  const languageCode =
    getChromeApi()?.i18n?.getUILanguage().toLowerCase().split(/[-_]/)[0] ?? 'zh'

  return isCaptureLanguage(languageCode)
    ? CAPTURE_NAMES[languageCode]
    : CAPTURE_NAMES.en
}

function findFolderByTitle(
  nodes: Array<BookmarkNode>,
  titles: Array<string>,
): BookmarkNode | undefined {
  for (const node of nodes) {
    if (!node.url && titles.includes(node.title)) return node

    const match = node.children
      ? findFolderByTitle(node.children, titles)
      : undefined
    if (match) return match
  }

  return undefined
}

function findDirectFolderByTitle(node: BookmarkNode, titles: Array<string>) {
  return node.children?.find(
    (child) => !child.url && titles.includes(child.title),
  )
}

function collectBookmarkUrlKeys(node: BookmarkNode, urlKeys: Set<string>) {
  if (node.url) urlKeys.add(normalizeCapturedUrl(node.url))
  node.children?.forEach((child) => collectBookmarkUrlKeys(child, urlKeys))
}

function isCaptureableTab(
  tab: ChromeTab,
  extensionId: string | undefined,
): tab is ChromeTab & { id: number; title: string; url: string } {
  if (tab.id === undefined || !tab.title || !tab.url) return false
  if (extensionId && tab.url.startsWith(`chrome-extension://${extensionId}/`)) {
    return false
  }

  return isCaptureableUrl(tab.url)
}

function toCaptureTab(
  tab: ChromeTab & { id: number; title: string; url: string },
): CaptureTab {
  return {
    id: tab.id,
    windowId: tab.windowId,
    groupId: tab.groupId ?? TAB_GROUP_ID_NONE,
    index: tab.index,
    title: tab.title,
    url: tab.url,
    active: tab.active,
    pinned: tab.pinned,
    lastAccessed: tab.lastAccessed ?? 0,
  }
}

async function getCurrentWindowTabs() {
  const chromeApi = getChromeApi()
  if (!chromeApi?.tabs) throw new Error('Chrome 标签页 API 不可用')

  const tabs = await chromeApi.tabs.query({ currentWindow: true })
  return tabs
    .filter((tab) => isCaptureableTab(tab, chromeApi.runtime?.id))
    .map(toCaptureTab)
    .sort((a, b) => a.index - b.index)
}

function pickCurrentPage(tabs: Array<CaptureTab>) {
  const activeTab = tabs.find((tab) => tab.active)
  if (activeTab) return activeTab
  return [...tabs].sort((a, b) => b.lastAccessed - a.lastAccessed).at(0)
}

async function getGroupTitle(groupId: number) {
  const chromeApi = getChromeApi()
  const fallbackTitle = getCaptureNames().group
  if (!chromeApi?.tabGroups) return fallbackTitle

  try {
    const group = await chromeApi.tabGroups.get(groupId)
    return group.title?.trim() || fallbackTitle
  } catch {
    return fallbackTitle
  }
}

function getBatchLabel(
  kind: Exclude<CaptureKind, 'page'>,
  sourceTitle: string,
) {
  const language = getChromeApi()?.i18n?.getUILanguage() ?? 'zh-CN'
  const timestamp = new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
  const fallback = kind === 'window' ? getCaptureNames().window : sourceTitle
  return `${fallback} · ${timestamp}`
}

async function getStoredReadLaterFolder() {
  const chromeApi = getChromeApi()
  const storageApi = chromeApi?.storage?.local
  const bookmarksApi = chromeApi?.bookmarks
  if (!storageApi || !bookmarksApi) return undefined

  const stored = await storageApi.get(READ_LATER_FOLDER_STORAGE_KEY)
  const folderId = stored[READ_LATER_FOLDER_STORAGE_KEY]
  if (typeof folderId !== 'string') return undefined

  try {
    const folder = (await bookmarksApi.get(folderId)).at(0)
    if (folder && !folder.url) return folder
  } catch {
    // The user may have deleted the previously remembered folder.
  }

  await storageApi.remove(READ_LATER_FOLDER_STORAGE_KEY)
  return undefined
}

async function rememberReadLaterFolder(folderId: string) {
  await getChromeApi()
    ?.storage?.local.set({ [READ_LATER_FOLDER_STORAGE_KEY]: folderId })
    .catch(() => undefined)
}

async function findOrCreateReadLaterFolder() {
  const chromeApi = getChromeApi()
  const bookmarksApi = chromeApi?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const remembered = await getStoredReadLaterFolder()
  if (remembered) return remembered

  const tree = await bookmarksApi.getTree()
  const names = getCaptureNames()
  let container = findFolderByTitle(tree, CONTAINER_TITLES)

  if (!container) {
    container = await bookmarksApi.create({ title: names.container })
  }

  const existing = findDirectFolderByTitle(container, READ_LATER_TITLES)
  const readLater =
    existing ??
    (await bookmarksApi.create({
      parentId: container.id,
      title: names.readLater,
    }))
  await rememberReadLaterFolder(readLater.id)
  return readLater
}

async function ensureReadLaterFolder() {
  if (pendingReadLaterFolder) return pendingReadLaterFolder

  const request = findOrCreateReadLaterFolder()
  pendingReadLaterFolder = request
  try {
    return await request
  } finally {
    if (pendingReadLaterFolder === request) pendingReadLaterFolder = undefined
  }
}

async function createCapturePlan({
  kind,
  label,
  sourceTabs,
}: {
  kind: CaptureKind
  label: string
  sourceTabs: Array<CaptureTab>
}): Promise<CapturePlan> {
  const bookmarksApi = getChromeApi()?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const tree = await bookmarksApi.getTree()
  const bookmarkUrlKeys = new Set<string>()
  tree.forEach((node) => collectBookmarkUrlKeys(node, bookmarkUrlKeys))
  const sourceUrlKeys = new Set<string>()
  const items: Array<CapturePlanItem> = sourceTabs.map((tab) => {
    const urlKey = normalizeCapturedUrl(tab.url)
    const isDuplicate = bookmarkUrlKeys.has(urlKey) || sourceUrlKeys.has(urlKey)
    sourceUrlKeys.add(urlKey)
    return { tab, isDuplicate }
  })

  return {
    kind,
    label,
    items,
    duplicateCount: items.filter((item) => item.isDuplicate).length,
  }
}

export async function getCloseAfterCapturePreference() {
  const storageApi = getChromeApi()?.storage?.local
  if (!storageApi) return false

  const stored = await storageApi.get(CLOSE_AFTER_CAPTURE_STORAGE_KEY)
  return stored[CLOSE_AFTER_CAPTURE_STORAGE_KEY] === true
}

export async function setCloseAfterCapturePreference(value: boolean) {
  const storageApi = getChromeApi()?.storage?.local
  if (!storageApi) return
  await storageApi.set({ [CLOSE_AFTER_CAPTURE_STORAGE_KEY]: value })
}

export async function getCaptureSnapshot(): Promise<CaptureSnapshot> {
  const tabs = await getCurrentWindowTabs()
  const currentPage = pickCurrentPage(tabs)
  let currentGroup: CaptureSnapshot['currentGroup']
  if (currentPage && currentPage.groupId !== TAB_GROUP_ID_NONE) {
    const currentGroupTabs = tabs.filter(
      (tab) => tab.groupId === currentPage.groupId,
    )
    if (currentGroupTabs.length > 0) {
      currentGroup = {
        id: currentPage.groupId,
        title: await getGroupTitle(currentPage.groupId),
        tabCount: currentGroupTabs.length,
      }
    }
  }

  return {
    currentPage,
    currentWindowTabCount: tabs.length,
    currentGroup,
  }
}

export async function prepareCapture(kind: CaptureKind): Promise<CapturePlan> {
  const tabs = await getCurrentWindowTabs()
  const currentPage = pickCurrentPage(tabs)
  let sourceTabs: Array<CaptureTab>
  let label: string

  if (kind === 'page') {
    sourceTabs = currentPage ? [currentPage] : []
    label = currentPage?.title ?? ''
  } else if (kind === 'group') {
    const groupId = currentPage?.groupId ?? TAB_GROUP_ID_NONE
    sourceTabs = tabs.filter(
      (tab) => groupId !== TAB_GROUP_ID_NONE && tab.groupId === groupId,
    )
    const groupTitle =
      groupId === TAB_GROUP_ID_NONE
        ? getCaptureNames().group
        : await getGroupTitle(groupId)
    label = getBatchLabel('group', groupTitle)
  } else {
    sourceTabs = tabs
    label = getBatchLabel('window', getCaptureNames().window)
  }

  return createCapturePlan({
    kind,
    label,
    sourceTabs,
  })
}

export async function prepareTabCapture(
  tab: Pick<
    CaptureTab,
    'active' | 'id' | 'pinned' | 'title' | 'url' | 'windowId'
  >,
): Promise<CapturePlan> {
  const sourceTabs = isCaptureableUrl(tab.url)
    ? [
        {
          ...tab,
          groupId: TAB_GROUP_ID_NONE,
          index: 0,
          lastAccessed: 0,
        },
      ]
    : []

  return createCapturePlan({
    kind: 'page',
    label: tab.title,
    sourceTabs,
  })
}

export async function executeCapture({
  closeAfterCapture,
  duplicatePolicy,
  plan,
}: {
  closeAfterCapture: boolean
  duplicatePolicy: DuplicatePolicy
  plan: CapturePlan
}): Promise<CaptureResult> {
  const chromeApi = getChromeApi()
  const bookmarksApi = chromeApi?.bookmarks
  if (!bookmarksApi) throw new Error('Chrome 书签 API 不可用')

  const itemsToSave =
    duplicatePolicy === 'save'
      ? plan.items
      : plan.items.filter((item) => !item.isDuplicate)
  if (!itemsToSave.length) {
    return {
      savedCount: 0,
      duplicateCount: plan.duplicateCount,
      closedCount: 0,
      closeFailed: false,
    }
  }

  const readLater = await ensureReadLaterFolder()
  const parent =
    plan.kind === 'page'
      ? readLater
      : await bookmarksApi.create({
          parentId: readLater.id,
          title: plan.label,
        })

  await Promise.all(
    itemsToSave.map(({ tab }, index) =>
      bookmarksApi.create({
        index,
        parentId: parent.id,
        title: tab.title,
        url: tab.url,
      }),
    ),
  )

  let closedCount = 0
  let closeFailed = false
  if (closeAfterCapture && chromeApi.tabs) {
    const tabIds = itemsToSave.map(({ tab }) => tab.id)
    try {
      await chromeApi.tabs.remove(tabIds)
      closedCount = tabIds.length
    } catch {
      closeFailed = true
    }
  }

  return {
    savedCount: itemsToSave.length,
    duplicateCount: plan.duplicateCount,
    closedCount,
    closeFailed,
  }
}
