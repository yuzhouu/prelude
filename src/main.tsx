import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import { TooltipProvider } from './components/ui/tooltip'
import './i18n'
import { getRouter } from './router'
import { initializeTheme } from './features/theme/theme'

initializeTheme()
const router = getRouter()

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}
