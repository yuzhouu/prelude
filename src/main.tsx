import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import './i18n'
import { getRouter } from './router'
import { initializeTheme } from './features/theme/theme'

initializeTheme()
const router = getRouter()

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} />)
}
