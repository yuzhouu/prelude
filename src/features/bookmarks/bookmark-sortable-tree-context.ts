import { createContext, useContext } from 'react'

import type {
  BookmarkDropProjection,
  BookmarkDropTarget,
  BookmarkTreeIndex,
} from './bookmark-drag'

export interface BookmarkSortableTreeContextValue {
  activeId: string | null
  collapsedFolderIds: ReadonlySet<string>
  projection: BookmarkDropProjection | null
  tree: BookmarkTreeIndex
  canDrag: (id: string) => boolean
  canDrop: (target: BookmarkDropTarget) => boolean
  setFolderExpanded: (id: string, expanded: boolean) => void
}

export const BookmarkSortableTreeContext =
  createContext<BookmarkSortableTreeContextValue | null>(null)

export function useBookmarkSortableTree() {
  const context = useContext(BookmarkSortableTreeContext)
  if (!context) {
    throw new Error(
      'Bookmark drag components must be rendered inside their tree.',
    )
  }
  return context
}
