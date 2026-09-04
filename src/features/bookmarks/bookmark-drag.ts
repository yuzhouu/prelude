import type { BookmarkNode } from './model'

export type BookmarkDropMode = 'after' | 'before' | 'boundary' | 'inside'

export type BookmarkDropTarget =
  | {
      type: 'node'
      id: string
      mode?: Exclude<BookmarkDropMode, 'boundary'>
    }
  | {
      type: 'container'
      edge: 'end' | 'start'
      parentId: string
    }

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

export interface BookmarkTreePosition {
  index: number
  parentId: string
}

export interface BookmarkDropProjection {
  isNoop: boolean
  mode: BookmarkDropMode
  position: BookmarkTreePosition
  targetId?: string
  tree: Array<BookmarkNode>
}

export interface BookmarkDropRectangle {
  height: number
  top: number
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
      const isManaged =
        inheritedManaged ||
        node.folderType === 'managed' ||
        node.unmodifiable === 'managed'
      entriesById.set(node.id, { index, isManaged, node, parentId })
      if (node.children) visit(node.children, node.id, isManaged)
    })
  }

  visit(roots, undefined, isInsideManagedTree)
  return { childrenByParent, entriesById }
}

export function canMoveBookmarkNode(tree: BookmarkTreeIndex, id: string) {
  const entry = tree.entriesById.get(id)
  return Boolean(
    entry?.parentId && !entry.isManaged && entry.node.folderType === undefined,
  )
}

function isBookmarkDescendantOf(
  tree: BookmarkTreeIndex,
  candidateAncestorId: string,
  nodeId: string,
) {
  let current = tree.entriesById.get(nodeId)
  while (current?.parentId) {
    if (current.parentId === candidateAncestorId) return true
    current = tree.entriesById.get(current.parentId)
  }
  return false
}

function canDropIntoFolder(
  tree: BookmarkTreeIndex,
  draggedId: string,
  parentId: string,
) {
  const parent = tree.entriesById.get(parentId)
  return Boolean(
    parent &&
    parent.node.url === undefined &&
    !parent.isManaged &&
    parentId !== draggedId &&
    !isBookmarkDescendantOf(tree, draggedId, parentId),
  )
}

export function canUseBookmarkDropTarget(
  tree: BookmarkTreeIndex,
  draggedId: string,
  target: BookmarkDropTarget,
) {
  if (!canMoveBookmarkNode(tree, draggedId)) return false

  if (target.type === 'container') {
    return canDropIntoFolder(tree, draggedId, target.parentId)
  }

  const targetEntry = tree.entriesById.get(target.id)
  if (!targetEntry) return false
  if (target.id === draggedId) return true
  if (isBookmarkDescendantOf(tree, draggedId, target.id)) return false

  if (target.mode === 'inside') {
    return (
      targetEntry.node.url === undefined &&
      canDropIntoFolder(tree, draggedId, target.id)
    )
  }

  if (target.mode === 'before' || target.mode === 'after') {
    return Boolean(
      targetEntry.parentId &&
      canDropIntoFolder(tree, draggedId, targetEntry.parentId),
    )
  }

  return Boolean(
    (targetEntry.parentId &&
      canDropIntoFolder(tree, draggedId, targetEntry.parentId)) ||
    (targetEntry.node.url === undefined &&
      canDropIntoFolder(tree, draggedId, target.id)),
  )
}

function getNodeDropMode(
  target: BookmarkNode,
  pointerY: number,
  rectangle: BookmarkDropRectangle,
): Exclude<BookmarkDropMode, 'boundary'> {
  const progress = rectangle.height
    ? (pointerY - rectangle.top) / rectangle.height
    : 0.5

  if (target.url !== undefined) return progress < 0.5 ? 'before' : 'after'
  if (progress < 0.25) return 'before'
  if (progress > 0.75) return 'after'
  return 'inside'
}

function removeBookmarkNode(
  nodes: ReadonlyArray<BookmarkNode>,
  id: string,
): { nodes: Array<BookmarkNode>; removed?: BookmarkNode } {
  const directIndex = nodes.findIndex((node) => node.id === id)
  if (directIndex >= 0) {
    return {
      nodes: [...nodes.slice(0, directIndex), ...nodes.slice(directIndex + 1)],
      removed: nodes[directIndex],
    }
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (!node.children) continue
    const result = removeBookmarkNode(node.children, id)
    if (!result.removed) continue

    const nextNodes = [...nodes]
    nextNodes[index] = { ...node, children: result.nodes }
    return { nodes: nextNodes, removed: result.removed }
  }

  return { nodes: [...nodes] }
}

function insertBookmarkNode(
  nodes: ReadonlyArray<BookmarkNode>,
  parentId: string,
  index: number,
  nodeToInsert: BookmarkNode,
): Array<BookmarkNode> | null {
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
    const node = nodes[nodeIndex]
    if (node.id === parentId) {
      const children = [...(node.children ?? [])]
      children.splice(
        Math.max(0, Math.min(index, children.length)),
        0,
        nodeToInsert,
      )
      const nextNodes = [...nodes]
      nextNodes[nodeIndex] = { ...node, children }
      return nextNodes
    }

    if (!node.children) continue
    const children = insertBookmarkNode(
      node.children,
      parentId,
      index,
      nodeToInsert,
    )
    if (!children) continue

    const nextNodes = [...nodes]
    nextNodes[nodeIndex] = { ...node, children }
    return nextNodes
  }

  return null
}

export function moveBookmarkNodeToPosition({
  draggedId,
  isInsideManagedTree = false,
  position,
  roots,
}: {
  draggedId: string
  isInsideManagedTree?: boolean
  position: BookmarkTreePosition
  roots: ReadonlyArray<BookmarkNode>
}): Array<BookmarkNode> | null {
  const tree = buildBookmarkTreeIndex(roots, isInsideManagedTree)
  const source = tree.entriesById.get(draggedId)
  if (
    !source?.parentId ||
    !canMoveBookmarkNode(tree, draggedId) ||
    !canDropIntoFolder(tree, draggedId, position.parentId)
  ) {
    return null
  }

  if (
    isSameBookmarkTreePosition(
      { index: source.index, parentId: source.parentId },
      position,
    )
  ) {
    return roots as Array<BookmarkNode>
  }

  const removal = removeBookmarkNode(roots, draggedId)
  if (!removal.removed) return null

  return insertBookmarkNode(
    removal.nodes,
    position.parentId,
    position.index,
    removal.removed,
  )
}

function getPositionAfterRemoval(
  treeWithoutSource: Array<BookmarkNode>,
  target: BookmarkDropTarget,
  mode: BookmarkDropMode,
) {
  const nextIndex = buildBookmarkTreeIndex(treeWithoutSource)

  if (target.type === 'container') {
    const children = nextIndex.childrenByParent.get(target.parentId) ?? []
    return {
      index: target.edge === 'start' ? 0 : children.length,
      parentId: target.parentId,
    }
  }

  const targetEntry = nextIndex.entriesById.get(target.id)
  if (!targetEntry) return undefined

  if (mode === 'inside') {
    return {
      index: targetEntry.node.children?.length ?? 0,
      parentId: target.id,
    }
  }

  if (!targetEntry.parentId) return undefined
  return {
    index: targetEntry.index + (mode === 'after' ? 1 : 0),
    parentId: targetEntry.parentId,
  }
}

export function isSameBookmarkTreePosition(
  first: BookmarkTreePosition,
  second: BookmarkTreePosition,
) {
  return first.parentId === second.parentId && first.index === second.index
}

export function projectBookmarkNodeMove({
  draggedId,
  isInsideManagedTree = false,
  pointerY,
  rectangle,
  roots,
  target,
}: {
  draggedId: string
  isInsideManagedTree?: boolean
  pointerY: number
  rectangle: BookmarkDropRectangle
  roots: ReadonlyArray<BookmarkNode>
  target: BookmarkDropTarget
}): BookmarkDropProjection | null {
  const snapshotIndex = buildBookmarkTreeIndex(roots, isInsideManagedTree)
  const source = snapshotIndex.entriesById.get(draggedId)
  if (!source?.parentId || !canMoveBookmarkNode(snapshotIndex, draggedId)) {
    return null
  }

  if (!canUseBookmarkDropTarget(snapshotIndex, draggedId, target)) return null

  const mode =
    target.type === 'container'
      ? 'boundary'
      : (target.mode ??
        getNodeDropMode(
          snapshotIndex.entriesById.get(target.id)?.node ?? source.node,
          pointerY,
          rectangle,
        ))

  if (target.type === 'node' && target.id === draggedId) {
    return {
      isNoop: true,
      mode,
      position: { index: source.index, parentId: source.parentId },
      targetId: target.id,
      tree: roots as Array<BookmarkNode>,
    }
  }

  const destinationParentId =
    target.type === 'container'
      ? target.parentId
      : mode === 'inside'
        ? target.id
        : snapshotIndex.entriesById.get(target.id)?.parentId
  if (
    !destinationParentId ||
    !canDropIntoFolder(snapshotIndex, draggedId, destinationParentId)
  ) {
    return null
  }

  const removal = removeBookmarkNode(roots, draggedId)
  if (!removal.removed) return null

  const position = getPositionAfterRemoval(removal.nodes, target, mode)
  if (!position) return null

  const isNoop = isSameBookmarkTreePosition(
    { index: source.index, parentId: source.parentId },
    position,
  )
  if (isNoop) {
    return {
      isNoop,
      mode,
      position,
      targetId: target.type === 'node' ? target.id : undefined,
      tree: roots as Array<BookmarkNode>,
    }
  }

  const tree = insertBookmarkNode(
    removal.nodes,
    position.parentId,
    position.index,
    removal.removed,
  )
  if (!tree) return null

  return {
    isNoop,
    mode,
    position,
    targetId: target.type === 'node' ? target.id : undefined,
    tree,
  }
}

export function getBookmarkNodePosition(
  roots: ReadonlyArray<BookmarkNode>,
  id: string,
  isInsideManagedTree = false,
): BookmarkTreePosition | undefined {
  const entry = buildBookmarkTreeIndex(
    roots,
    isInsideManagedTree,
  ).entriesById.get(id)
  return entry?.parentId
    ? { index: entry.index, parentId: entry.parentId }
    : undefined
}
