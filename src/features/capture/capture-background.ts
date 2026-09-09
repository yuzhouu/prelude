import {
  executeCapture,
  getCloseAfterCapturePreference,
  prepareCapture,
  setCloseAfterCapturePreference,
} from './chrome-capture.ts'
import { CLOSE_AFTER_CAPTURE_STORAGE_KEY } from './model.ts'
import type { CaptureKind, CaptureResult } from './model.ts'

type MenuContext =
  | 'action'
  | 'page'
  | 'frame'
  | 'selection'
  | 'link'
  | 'editable'
  | 'image'
  | 'video'
  | 'audio'
  | 'tab'

interface MenuDetails {
  checked?: boolean
  contexts: Array<MenuContext>
  id: string
  parentId?: string
  title?: string
  type?: 'checkbox' | 'normal' | 'separator'
}

interface ChromeApi {
  commands: {
    onCommand: {
      addListener: (callback: (command: string) => void) => void
    }
  }
  contextMenus: {
    ContextType?: { TAB?: 'tab' }
    create: (details: MenuDetails, callback: () => void) => void
    onClicked: {
      addListener: (
        callback: (info: {
          checked?: boolean
          menuItemId: number | string
        }) => void,
      ) => void
    }
    removeAll: () => Promise<void>
    update: (
      id: string,
      updateProperties: { checked?: boolean },
    ) => Promise<void>
  }
  i18n: {
    getMessage: (
      messageName: string,
      substitutions?: string | Array<string>,
    ) => string
  }
  notifications: {
    create: (options: {
      iconUrl: string
      message: string
      title: string
      type: 'basic'
    }) => Promise<string>
  }
  runtime: {
    lastError?: { message?: string }
    getURL: (path: string) => string
    onInstalled: {
      addListener: (callback: () => void) => void
    }
    onStartup: {
      addListener: (callback: () => void) => void
    }
  }
  storage: {
    onChanged: {
      addListener: (
        callback: (
          changes: Partial<Record<string, { newValue?: unknown }>>,
          areaName: string,
        ) => void,
      ) => void
    }
  }
}

const MENU_ROOT = 'prelude-capture-root'
const MENU_PAGE = 'prelude-capture-page'
const MENU_WINDOW = 'prelude-capture-window'
const MENU_GROUP = 'prelude-capture-group'
const MENU_CLOSE = 'prelude-capture-close'

function getMessage(
  chromeApi: ChromeApi,
  name: string,
  substitutions?: string | Array<string>,
) {
  return chromeApi.i18n.getMessage(name, substitutions) || name
}

async function notifyResult(chromeApi: ChromeApi, result: CaptureResult) {
  let message: string
  if (result.closeFailed) {
    message = getMessage(
      chromeApi,
      'captureSavedCloseFailed',
      String(result.savedCount),
    )
  } else if (result.savedCount === 0 && result.duplicateCount > 0) {
    message = getMessage(chromeApi, 'captureDuplicateOnly')
  } else if (result.duplicateCount > 0) {
    message = getMessage(chromeApi, 'captureSavedWithDuplicates', [
      String(result.savedCount),
      String(result.duplicateCount),
    ])
  } else if (result.closedCount > 0) {
    message = getMessage(chromeApi, 'captureSavedAndClosed', [
      String(result.savedCount),
      String(result.closedCount),
    ])
  } else {
    message = getMessage(chromeApi, 'captureSaved', String(result.savedCount))
  }

  await chromeApi.notifications.create({
    type: 'basic',
    iconUrl: chromeApi.runtime.getURL('icons/prelude-128.png'),
    title: getMessage(chromeApi, 'captureNotificationTitle'),
    message,
  })
}

async function notifyUnavailable(chromeApi: ChromeApi, kind: CaptureKind) {
  await chromeApi.notifications.create({
    type: 'basic',
    iconUrl: chromeApi.runtime.getURL('icons/prelude-128.png'),
    title: getMessage(chromeApi, 'captureNotificationTitle'),
    message: getMessage(
      chromeApi,
      kind === 'group' ? 'captureNoGroup' : 'captureNoPage',
    ),
  })
}

async function notifyFailure(chromeApi: ChromeApi) {
  await chromeApi.notifications.create({
    type: 'basic',
    iconUrl: chromeApi.runtime.getURL('icons/prelude-128.png'),
    title: getMessage(chromeApi, 'captureNotificationTitle'),
    message: getMessage(chromeApi, 'captureFailed'),
  })
}

async function capture(chromeApi: ChromeApi, kind: CaptureKind) {
  try {
    const [plan, closeAfterCapture] = await Promise.all([
      prepareCapture(kind),
      getCloseAfterCapturePreference(),
    ])
    if (!plan.items.length) {
      await notifyUnavailable(chromeApi, kind)
      return
    }

    const result = await executeCapture({
      closeAfterCapture,
      duplicatePolicy: 'skip',
      plan,
    })
    await notifyResult(chromeApi, result)
  } catch {
    await notifyFailure(chromeApi)
  }
}

async function installContextMenus(chromeApi: ChromeApi) {
  const checked = await getCloseAfterCapturePreference()
  await chromeApi.contextMenus.removeAll()
  const contexts: Array<MenuContext> = [
    'page',
    'frame',
    'selection',
    'link',
    'editable',
    'image',
    'video',
    'audio',
    'action',
  ]
  if (chromeApi.contextMenus.ContextType?.TAB) contexts.push('tab')

  await createContextMenu(chromeApi, {
    id: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextRoot'),
    contexts: [...contexts],
  })
  await createContextMenu(chromeApi, {
    id: MENU_PAGE,
    parentId: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextPage'),
    contexts: [...contexts],
  })
  await createContextMenu(chromeApi, {
    id: MENU_WINDOW,
    parentId: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextWindow'),
    contexts: [...contexts],
  })
  await createContextMenu(chromeApi, {
    id: MENU_GROUP,
    parentId: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextGroup'),
    contexts: [...contexts],
  })
  await createContextMenu(chromeApi, {
    id: 'prelude-capture-separator',
    parentId: MENU_ROOT,
    type: 'separator',
    contexts: [...contexts],
  })
  await createContextMenu(chromeApi, {
    id: MENU_CLOSE,
    parentId: MENU_ROOT,
    type: 'checkbox',
    title: getMessage(chromeApi, 'captureContextClose'),
    contexts: [...contexts],
    checked,
  })
}

function createContextMenu(chromeApi: ChromeApi, details: MenuDetails) {
  return new Promise<void>((resolve, reject) => {
    chromeApi.contextMenus.create(details, () => {
      const error = chromeApi.runtime.lastError
      if (error)
        reject(new Error(error.message || 'Context menu creation failed'))
      else resolve()
    })
  })
}

export function setupCaptureBackground() {
  const chromeApi = (globalThis as typeof globalThis & { chrome: ChromeApi })
    .chrome
  let menuRegistration = Promise.resolve()
  const refreshContextMenus = (rebuild = false) => {
    menuRegistration = menuRegistration
      .then(async () => {
        if (!rebuild) {
          try {
            await chromeApi.contextMenus.update(MENU_CLOSE, {
              checked: await getCloseAfterCapturePreference(),
            })
            return
          } catch {
            // Repair missing menus when the worker wakes after a failed install.
          }
        }
        await installContextMenus(chromeApi)
      })
      .catch((error: unknown) => {
        console.error(
          'Prelude could not register capture context menus.',
          error,
        )
      })
  }

  chromeApi.runtime.onInstalled.addListener(() => refreshContextMenus(true))
  chromeApi.runtime.onStartup.addListener(() => refreshContextMenus(true))
  refreshContextMenus()

  chromeApi.commands.onCommand.addListener((command) => {
    if (command === 'capture-current-tab') {
      void capture(chromeApi, 'page')
    }
  })

  chromeApi.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === MENU_PAGE) void capture(chromeApi, 'page')
    if (info.menuItemId === MENU_WINDOW) void capture(chromeApi, 'window')
    if (info.menuItemId === MENU_GROUP) void capture(chromeApi, 'group')
    if (info.menuItemId === MENU_CLOSE) {
      void setCloseAfterCapturePreference(info.checked === true)
    }
  })

  chromeApi.storage.onChanged.addListener((changes, areaName) => {
    const preferenceChange = changes[CLOSE_AFTER_CAPTURE_STORAGE_KEY]
    if (areaName !== 'local' || !preferenceChange) return

    void chromeApi.contextMenus
      .update(MENU_CLOSE, {
        checked: preferenceChange.newValue === true,
      })
      .catch(() => refreshContextMenus())
  })
}
