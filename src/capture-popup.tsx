import ReactDOM from 'react-dom/client'
import { ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import './i18n'
import './styles.css'
import { CapturePanel } from './features/capture/capture-dialog'
import { initializeTheme } from './features/theme/theme'
import type { OpenTabWindow } from './features/tabs/model'

interface PopupChromeApi {
  bookmarks?: unknown
  runtime?: {
    getURL: (path: string) => string
  }
  tabs?: {
    create: (details: { url: string }) => Promise<unknown>
  }
}

const EMPTY_WINDOWS: Array<OpenTabWindow> = []
const chromeApi = (
  globalThis as typeof globalThis & { chrome?: PopupChromeApi }
).chrome
const isChromeSource = Boolean(chromeApi?.bookmarks && chromeApi.tabs)
const preludeUrl = chromeApi?.runtime?.getURL('index.html') ?? '/'

function CapturePopup() {
  const { t } = useTranslation()

  const openPrelude = async () => {
    if (!chromeApi?.tabs?.create) {
      window.location.assign(preludeUrl)
      return
    }

    try {
      await chromeApi.tabs.create({ url: preludeUrl })
      window.close()
    } catch {
      window.location.assign(preludeUrl)
    }
  }

  return (
    <main className="capture-popup-surface">
      <CapturePanel
        closeButton={
          <div className="capture-popup-header-actions">
            <button
              className="capture-popup-open"
              type="button"
              onClick={() => void openPrelude()}
            >
              <ExternalLink />
              <span>{t('capture.openPrelude')}</span>
            </button>
            <button
              className="capture-dialog-close"
              type="button"
              aria-label={t('capture.close')}
              onClick={() => window.close()}
            >
              <X />
            </button>
          </div>
        }
        fallbackWindows={EMPTY_WINDOWS}
        isActive
        isChromeSource={isChromeSource}
      />
    </main>
  )
}

initializeTheme()

const rootElement = document.getElementById('capture-popup-root')!
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(<CapturePopup />)
}
