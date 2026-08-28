export interface BookmarkNode {
  id: string
  title: string
  url?: string
  dateAdded?: number
  folderType?: 'bookmarks-bar' | 'managed' | 'mobile' | 'other'
  syncing?: boolean
  children?: Array<BookmarkNode>
}

export interface BookmarkMatch {
  node: BookmarkNode
  path: Array<string>
}

export interface BookmarkNodeLocation {
  node: BookmarkNode
  parentId?: string
  isManaged: boolean
}

export function isFolder(node: BookmarkNode) {
  return node.url === undefined
}

export function getVisibleRoots(tree: Array<BookmarkNode>) {
  if (tree.length === 1 && tree[0]?.children) {
    return tree[0].children
  }

  return tree
}

export function countBookmarks(node: BookmarkNode): number {
  if (node.url) return 1

  return (node.children ?? []).reduce(
    (total, child) => total + countBookmarks(child),
    0,
  )
}

export function countTreeBookmarks(tree: Array<BookmarkNode>) {
  return tree.reduce((total, node) => total + countBookmarks(node), 0)
}

export function countChildFolders(node: BookmarkNode): number {
  return (node.children ?? []).reduce((total, child) => {
    if (!isFolder(child)) return total
    return total + 1 + countChildFolders(child)
  }, 0)
}

export function findNode(
  tree: Array<BookmarkNode>,
  id: string,
): BookmarkNode | undefined {
  for (const node of tree) {
    if (node.id === id) return node

    const found = node.children ? findNode(node.children, id) : undefined
    if (found) return found
  }

  return undefined
}

export function findNodeLocation(
  tree: Array<BookmarkNode>,
  id: string,
): BookmarkNodeLocation | undefined {
  function visit(
    nodes: Array<BookmarkNode>,
    parentId: string | undefined,
    isInsideManagedTree: boolean,
  ): BookmarkNodeLocation | undefined {
    for (const node of nodes) {
      const isManaged = isInsideManagedTree || node.folderType === 'managed'
      if (node.id === id) return { node, parentId, isManaged }

      const found = node.children
        ? visit(node.children, node.id, isManaged)
        : undefined
      if (found) return found
    }

    return undefined
  }

  return visit(tree, undefined, false)
}

export function getBookmarkMatches(tree: Array<BookmarkNode>) {
  const matches: Array<BookmarkMatch> = []

  function visit(node: BookmarkNode, path: Array<string>) {
    if (node.url) {
      matches.push({ node, path })
      return
    }

    const nextPath = node.title ? [...path, node.title] : path
    node.children?.forEach((child) => visit(child, nextPath))
  }

  tree.forEach((node) => visit(node, []))
  return matches
}

export function searchBookmarks(
  bookmarks: Array<BookmarkMatch>,
  rawQuery: string,
) {
  const query = rawQuery.trim().toLocaleLowerCase()
  if (!query) return []

  return bookmarks.filter(({ node, path }) => {
    const haystack = [node.title, node.url, ...path]
      .join(' ')
      .toLocaleLowerCase()

    return haystack.includes(query)
  })
}

export function getRecentBookmarks(bookmarks: Array<BookmarkMatch>) {
  return [...bookmarks]
    .filter(({ node }) => node.dateAdded !== undefined)
    .sort((a, b) => (b.node.dateAdded ?? 0) - (a.node.dateAdded ?? 0))
    .slice(0, 24)
}

export function getDirectBookmarks(node: BookmarkNode) {
  return (node.children ?? []).filter((child) => child.url !== undefined)
}

export function getChildFolders(node: BookmarkNode) {
  return (node.children ?? []).filter(isFolder)
}
