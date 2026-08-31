import {
  executeCapture,
  getCloseAfterCapturePreference,
  prepareCapture,
  setCloseAfterCapturePreference,
} from './chrome-capture'
import type { CaptureKind, CaptureResult } from './model'

interface ChromeApi {
  commands: {
    onCommand: {
      addListener: (callback: (command: string) => void) => void
    }
  }
  contextMenus: {
    create: (details: {
      checked?: boolean
      contexts?: Array<'action' | 'page' | 'tab'>
      id: string
      parentId?: string
      title?: string
      type?: 'checkbox' | 'normal' | 'separator'
    }) => void
    onClicked: {
      addListener: (
        callback: (info: {
          checked?: boolean
          menuItemId: number | string
        }) => void,
      ) => void
    }
    onShown: {
      addListener: (callback: () => void) => void
    }
    refresh: () => void
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
    getURL: (path: string) => string
    onInstalled: {
      addListener: (callback: () => void) => void
    }
    onStartup: {
      addListener: (callback: () => void) => void
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
  await chromeApi.contextMenus.removeAll()
  const contexts = ['page', 'tab', 'action'] as const
  chromeApi.contextMenus.create({
    id: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextRoot'),
    contexts: [...contexts],
  })
  chromeApi.contextMenus.create({
    id: MENU_PAGE,
    parentId: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextPage'),
    contexts: [...contexts],
  })
  chromeApi.contextMenus.create({
    id: MENU_WINDOW,
    parentId: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextWindow'),
    contexts: [...contexts],
  })
  chromeApi.contextMenus.create({
    id: MENU_GROUP,
    parentId: MENU_ROOT,
    title: getMessage(chromeApi, 'captureContextGroup'),
    contexts: [...contexts],
  })
  chromeApi.contextMenus.create({
    id: 'prelude-capture-separator',
    parentId: MENU_ROOT,
    type: 'separator',
    contexts: [...contexts],
  })
  chromeApi.contextMenus.create({
    id: MENU_CLOSE,
    parentId: MENU_ROOT,
    type: 'checkbox',
    title: getMessage(chromeApi, 'captureContextClose'),
    contexts: [...contexts],
    checked: await getCloseAfterCapturePreference(),
  })
}

export function setupCaptureBackground() {
  const chromeApi = (globalThis as typeof globalThis & { chrome: ChromeApi })
    .chrome
  const refreshContextMenus = () => {
    void installContextMenus(chromeApi).catch(() => undefined)
  }

  chromeApi.runtime.onInstalled.addListener(refreshContextMenus)
  chromeApi.runtime.onStartup.addListener(refreshContextMenus)

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

  chromeApi.contextMenus.onShown.addListener(() => {
    void getCloseAfterCapturePreference().then((checked) =>
      chromeApi.contextMenus
        .update(MENU_CLOSE, { checked })
        .then(() => chromeApi.contextMenus.refresh())
        .catch(() => undefined),
    )
  })
}
