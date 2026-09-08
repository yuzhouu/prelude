import { useState } from 'react'
import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { changeTopSitesAccess } from './top-sites-access'
import { useTopSitesAccess } from './use-top-sites-access'

export function TopSitesSettings() {
  const { t } = useTranslation()
  const { enabled, available, ready } = useTopSitesAccess()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<'denied' | 'accessError' | null>(null)

  const toggle = async () => {
    setPending(true)
    setError(null)
    try {
      const result = await changeTopSitesAccess(!enabled)
      if (result !== 'success')
        setError(result === 'unavailable' ? 'accessError' : result)
    } catch {
      setError('accessError')
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      className="settings-section settings-top-sites-section"
      aria-labelledby="settings-top-sites-title"
    >
      <div className="settings-top-sites-row">
        <div className="settings-section-heading">
          <span className="settings-section-icon" aria-hidden="true">
            <Compass />
          </span>
          <div>
            <h2 id="settings-top-sites-title">{t('topSites.title')}</h2>
            <p id="settings-top-sites-description">
              {t(available ? 'topSites.description' : 'topSites.unavailable')}
            </p>
          </div>
        </div>
        <button
          className="settings-switch"
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="settings-top-sites-title"
          aria-describedby="settings-top-sites-description"
          aria-busy={pending}
          disabled={!available || !ready || pending}
          onClick={() => void toggle()}
        >
          <span />
        </button>
      </div>
      {error ? (
        <p className="settings-top-sites-error" role="alert">
          {t(`topSites.${error}`)}
        </p>
      ) : null}
    </section>
  )
}
