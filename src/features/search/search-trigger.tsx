import { Search } from 'lucide-react'

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      className="search-trigger"
      type="button"
      aria-label="搜索书签与标签页"
      onClick={onOpen}
    >
      <Search aria-hidden="true" />
      <span>搜索</span>
      <kbd>⌘ K</kbd>
    </button>
  )
}
