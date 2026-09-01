import { Dialog } from '@base-ui/react/dialog'
import { ExternalLink, Settings, ShieldCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { LanguageToggle } from '../language/language-toggle'

export function SettingsDialog() {
  const { t } = useTranslation()

  return (
    <Dialog.Root>
      <Tooltip>
        <TooltipTrigger
          render={
            <Dialog.Trigger
              className="settings-open-button"
              type="button"
              aria-label={t('settings.open')}
            >
              <Settings />
            </Dialog.Trigger>
          }
        />
        <TooltipContent>{t('settings.open')}</TooltipContent>
      </Tooltip>

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

            <section
              className="settings-privacy-card"
              aria-labelledby="settings-privacy-title"
            >
              <div className="settings-privacy-heading">
                <span className="settings-privacy-icon" aria-hidden="true">
                  <ShieldCheck />
                </span>
                <div>
                  <h2 id="settings-privacy-title">
                    {t('settings.privacy.title')}
                  </h2>
                  <p>{t('settings.privacy.summary')}</p>
                </div>
              </div>
              <ul>
                <li>{t('settings.privacy.bookmarks')}</li>
                <li>{t('settings.privacy.tabs')}</li>
                <li>{t('settings.privacy.local')}</li>
                <li>{t('settings.privacy.search')}</li>
              </ul>
              <a href="/privacy.html" target="_blank" rel="noreferrer">
                {t('settings.privacy.action')}
                <ExternalLink aria-hidden="true" />
              </a>
            </section>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
