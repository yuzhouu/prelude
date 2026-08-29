import { Dialog } from '@base-ui/react/dialog'
import { Settings, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageToggle } from '../language/language-toggle'

export function SettingsDialog() {
  const { t } = useTranslation()

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="settings-open-button"
        type="button"
        title={t('settings.open')}
        aria-label={t('settings.open')}
      >
        <Settings />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="settings-dialog-backdrop" />
        <Dialog.Viewport className="settings-dialog-viewport">
          <Dialog.Popup className="settings-dialog-popup">
            <header className="settings-dialog-header">
              <div>
                <Dialog.Title className="settings-dialog-title">
                  {t('settings.title')}
                </Dialog.Title>
                <Dialog.Description className="settings-dialog-description">
                  {t('settings.description')}
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="settings-dialog-close"
                type="button"
                aria-label={t('settings.close')}
              >
                <X />
              </Dialog.Close>
            </header>

            <div className="settings-dialog-content">
              <LanguageToggle />
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
