import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      className="search-trigger"
      type="button"
      aria-label={t('search.triggerLabel')}
      onClick={onOpen}
    >
      <Search aria-hidden="true" />
      <span>{t('search.trigger')}</span>
      <kbd>⌘ K</kbd>
    </button>
  )
}
