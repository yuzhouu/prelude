import ReactDOM from 'react-dom/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import './i18n'
import './styles.css'
import { CapturePanel } from './features/capture/capture-dialog'
import { initializeTheme } from './features/theme/theme'
import type { OpenTabWindow } from './features/tabs/model'

interface PopupChromeApi {
  bookmarks?: unknown
  tabs?: unknown
}

const EMPTY_WINDOWS: Array<OpenTabWindow> = []
const chromeApi = (
  globalThis as typeof globalThis & { chrome?: PopupChromeApi }
).chrome
const isChromeSource = Boolean(chromeApi?.bookmarks && chromeApi.tabs)

function CapturePopup() {
  const { t } = useTranslation()

  return (
    <main className="capture-popup-surface">
      <CapturePanel
        closeButton={
          <button
            className="capture-dialog-close"
            type="button"
            aria-label={t('capture.close')}
            onClick={() => window.close()}
          >
            <X />
          </button>
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
