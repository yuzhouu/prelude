import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  ExternalLink,
  Languages,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { LanguageToggle } from '../language/language-toggle'
import { ShortcutSettings } from '../shortcuts/shortcut-settings'

export function SettingsDialog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const openAboutPage = () => {
    setOpen(false)
    void navigate({ to: '/about' })
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
                <Dialog.Description className="sr-only">
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

            <div className="settings-dialog-sections">
              <section
                className="settings-section settings-language-section"
                aria-labelledby="settings-language-title"
              >
                <div className="settings-section-heading">
                  <span className="settings-section-icon" aria-hidden="true">
                    <Languages />
                  </span>
                  <div>
                    <h2 id="settings-language-title">{t('language.label')}</h2>
                    <p>{t('language.groupLabel')}</p>
                  </div>
                </div>
                <LanguageToggle showLabel={false} />
              </section>

              <ShortcutSettings />

              <section
                className="settings-section settings-privacy-section"
                aria-labelledby="settings-privacy-title"
              >
                <div className="settings-section-heading">
                  <span className="settings-section-icon" aria-hidden="true">
                    <ShieldCheck />
                  </span>
                  <div>
                    <h2 id="settings-privacy-title">
                      {t('settings.privacy.title')}
                    </h2>
                    <p>{t('settings.privacy.local')}</p>
                  </div>
                </div>
                <details className="settings-privacy-details">
                  <summary>{t('settings.privacy.details')}</summary>
                  <ul className="settings-privacy-points">
                    <li>{t('settings.privacy.bookmarks')}</li>
                    <li>{t('settings.privacy.tabs')}</li>
                    <li>{t('settings.privacy.search')}</li>
                  </ul>
                  <a
                    className="settings-text-link"
                    href="/privacy.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('settings.privacy.action')}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </details>
              </section>

              <section
                className="settings-section settings-about-section"
                aria-labelledby="settings-about-title"
              >
                <span className="settings-about-logo" aria-hidden="true">
                  <img src="/icons/prelude.svg" alt="" />
                </span>
                <div className="settings-about-copy">
                  <h2 id="settings-about-title">{t('about.title')}</h2>
                  <p>{t('settings.about.summary')}</p>
                </div>
                <button
                  className="settings-about-action"
                  type="button"
                  onClick={openAboutPage}
                >
                  <span>{t('settings.about.action')}</span>
                  <ArrowRight aria-hidden="true" />
                </button>
              </section>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
