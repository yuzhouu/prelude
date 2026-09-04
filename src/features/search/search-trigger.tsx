import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { formatKeyboardShortcut } from '../shortcuts/shortcut-preferences'
import { useShortcutPreferences } from '../shortcuts/use-shortcut-preferences'

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()
  const shortcutPreferences = useShortcutPreferences()

  return (
    <button
      className="search-trigger"
      type="button"
      aria-label={t('search.triggerLabel')}
      onClick={onOpen}
    >
      <Search aria-hidden="true" />
      <span>{t('search.trigger')}</span>
      <kbd>{formatKeyboardShortcut(shortcutPreferences.search)}</kbd>
    </button>
  )
}
