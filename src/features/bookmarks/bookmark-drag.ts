import type { BookmarkNode } from './model'

export type BookmarkDropMode = 'before' | 'after' | 'inside' | 'boundary'
export type BookmarkNodeDropZone = 'before' | 'after' | 'inside'

interface BookmarkTreeEntry {
  index: number
  isManaged: boolean
  node: BookmarkNode
  parentId?: string
}

export interface BookmarkTreeIndex {
  childrenByParent: ReadonlyMap<string, ReadonlyArray<BookmarkNode>>
  entriesById: ReadonlyMap<string, BookmarkTreeEntry>
}

export interface BookmarkDropPlacement {
  index: number
  isNoop?: boolean
  mode: BookmarkDropMode
  parentId: string
  targetId?: string
}

export function buildBookmarkTreeIndex(
  roots: ReadonlyArray<BookmarkNode>,
  isInsideManagedTree = false,
): BookmarkTreeIndex {
  const entriesById = new Map<string, BookmarkTreeEntry>()
  const childrenByParent = new Map<string, ReadonlyArray<BookmarkNode>>()

  const visit = (
    nodes: ReadonlyArray<BookmarkNode>,
    parentId: string | undefined,
    inheritedManaged: boolean,
  ) => {
    if (parentId !== undefined) childrenByParent.set(parentId, nodes)

    nodes.forEach((node, index) => {
      const isManaged = inheritedManaged || node.folderType === 'managed'
      entriesById.set(node.id, { index, isManaged, node, parentId })
      if (node.children) visit(node.children, node.id, isManaged)
    })
  }

  visit(roots, undefined, isInsideManagedTree)
  return { childrenByParent, entriesById }
}

export function canMoveBookmarkNode(
  tree: BookmarkTreeIndex,
  id: string,
): boolean {
  const entry = tree.entriesById.get(id)
  return Boolean(
    entry?.parentId && !entry.isManaged && entry.node.folderType === undefined,
  )
}

export function isBookmarkDescendantOf(
  tree: BookmarkTreeIndex,
  candidateAncestorId: string,
  nodeId: string,
): boolean {
  let current = tree.entriesById.get(nodeId)
  while (current?.parentId) {
    if (current.parentId === candidateAncestorId) return true
    current = tree.entriesById.get(current.parentId)
  }
  return false
}

export function resolveBookmarkBoundaryPlacement(
  tree: BookmarkTreeIndex,
  draggedId: string,
  parentId: string,
  requestedIndex: number,
  mode: BookmarkDropMode = 'boundary',
  targetId?: string,
): BookmarkDropPlacement | null {
  const source = tree.entriesById.get(draggedId)
  const destination = tree.entriesById.get(parentId)
  const destinationChildren = tree.childrenByParent.get(parentId) ?? []
  if (
    !source?.parentId ||
    !destination ||
    destination.node.url !== undefined ||
    destination.isManaged ||
    parentId === draggedId ||
    isBookmarkDescendantOf(tree, draggedId, parentId)
  ) {
    return null
  }

  const index = Math.max(
    0,
    Math.min(requestedIndex, destinationChildren.length),
  )
  if (
    source.parentId === parentId &&
    (index === source.index || index === source.index + 1)
  ) {
    return { index, isNoop: true, mode, parentId, targetId }
  }

  return { index, mode, parentId, targetId }
}

export function resolveBookmarkNodePlacement(
  tree: BookmarkTreeIndex,
  draggedId: string,
  targetId: string,
  zone: BookmarkNodeDropZone,
): BookmarkDropPlacement | null {
  if (draggedId === targetId) {
    const source = tree.entriesById.get(draggedId)
    if (!source?.parentId) return null
    return {
      index: source.index,
      isNoop: true,
      mode: zone,
      parentId: source.parentId,
      targetId,
    }
  }

  if (isBookmarkDescendantOf(tree, draggedId, targetId)) {
    return null
  }

  const target = tree.entriesById.get(targetId)
  if (!target) return null

  if (zone === 'inside') {
    if (target.node.url !== undefined || target.isManaged) return null
    return resolveBookmarkBoundaryPlacement(
      tree,
      draggedId,
      targetId,
      0,
      'inside',
      targetId,
    )
  }

  if (!target.parentId) return null
  return resolveBookmarkBoundaryPlacement(
    tree,
    draggedId,
    target.parentId,
    target.index + (zone === 'after' ? 1 : 0),
    zone,
    targetId,
  )
}
