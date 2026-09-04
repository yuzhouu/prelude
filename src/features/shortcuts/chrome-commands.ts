import { useEffect, useState } from 'react'

export const DEFAULT_CAPTURE_COMMAND_SHORTCUT = 'Alt+Shift+S'

interface ChromeCommand {
  name?: string
  shortcut?: string
}

interface ChromeShortcutApi {
  commands?: {
    getAll: () => Promise<Array<ChromeCommand>>
  }
  runtime?: {
    id?: string
  }
  tabs?: {
    create: (properties: { url: string }) => Promise<unknown>
  }
}

interface CaptureCommandShortcutState {
  isExtension: boolean
  shortcut: string
}

function getChromeShortcutApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeShortcutApi })
    .chrome
}

function isExtensionShortcutApiAvailable(api = getChromeShortcutApi()) {
  return Boolean(api?.runtime?.id && api.commands?.getAll)
}

export async function getCaptureCommandShortcut() {
  const api = getChromeShortcutApi()
  if (!isExtensionShortcutApiAvailable(api) || !api?.commands) {
    return {
      isExtension: false,
      shortcut: DEFAULT_CAPTURE_COMMAND_SHORTCUT,
    } satisfies CaptureCommandShortcutState
  }

  try {
    const commands = await api.commands.getAll()
    const captureCommand = commands.find(
      (command) => command.name === 'capture-current-tab',
    )
    return {
      isExtension: true,
      shortcut: captureCommand?.shortcut ?? '',
    } satisfies CaptureCommandShortcutState
  } catch {
    return {
      isExtension: true,
      shortcut: DEFAULT_CAPTURE_COMMAND_SHORTCUT,
    } satisfies CaptureCommandShortcutState
  }
}

export async function openChromeShortcutSettings() {
  const api = getChromeShortcutApi()
  if (!api?.runtime?.id || !api.tabs?.create) return false

  await api.tabs.create({ url: 'chrome://extensions/shortcuts' })
  return true
}

export function useCaptureCommandShortcut() {
  const [state, setState] = useState<CaptureCommandShortcutState>({
    isExtension: isExtensionShortcutApiAvailable(),
    shortcut: DEFAULT_CAPTURE_COMMAND_SHORTCUT,
  })

  useEffect(() => {
    let active = true
    const refresh = () => {
      void getCaptureCommandShortcut().then((nextState) => {
        if (active) setState(nextState)
      })
    }

    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return state
}
