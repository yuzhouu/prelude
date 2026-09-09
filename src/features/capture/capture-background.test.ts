import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import { afterEach, mock, test } from 'node:test'
import { setupCaptureBackground } from './capture-background.ts'
import { CLOSE_AFTER_CAPTURE_STORAGE_KEY } from './model.ts'

interface Menu {
  id: string
  parentId?: string
  contexts: Array<string>
  checked?: boolean
}

const originalChrome = Object.getOwnPropertyDescriptor(globalThis, 'chrome')
afterEach(() => {
  mock.restoreAll()
  if (originalChrome)
    Object.defineProperty(globalThis, 'chrome', originalChrome)
  else Reflect.deleteProperty(globalThis, 'chrome')
})

async function waitFor(condition: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return
    await setImmediate()
  }
  assert.fail('Background menu registration did not finish')
}

function setup({ supportsTab = false, failCreate = false } = {}) {
  const menus = new Map<string, Menu>()
  const installed: Array<() => void> = []
  const startup: Array<() => void> = []
  const state = { failCreate, completed: 0, clears: 0, checked: true }
  const runtime: { lastError?: { message: string } } = {}
  const errors = mock.method(console, 'error', () => undefined)
  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: {
      runtime: {
        get lastError() {
          return runtime.lastError
        },
        onInstalled: {
          addListener: (listener: () => void) => installed.push(listener),
        },
        onStartup: {
          addListener: (listener: () => void) => startup.push(listener),
        },
      },
      i18n: { getMessage: (name: string) => name },
      commands: { onCommand: { addListener: () => undefined } },
      storage: {
        local: {
          get: async () => ({
            [CLOSE_AFTER_CAPTURE_STORAGE_KEY]: state.checked,
          }),
        },
        onChanged: { addListener: () => undefined },
      },
      contextMenus: {
        ContextType: supportsTab ? { TAB: 'tab' } : {},
        onClicked: { addListener: () => undefined },
        removeAll: async () => {
          state.clears++
          menus.clear()
        },
        update: async (id: string, properties: { checked?: boolean }) => {
          const menu = menus.get(id)
          if (!menu) throw new Error(`Cannot find menu item with id ${id}`)
          Object.assign(menu, properties)
        },
        create: (menu: Menu, callback: () => void) => {
          if (!supportsTab && menu.contexts.includes('tab')) {
            throw new TypeError('Unsupported context: tab')
          }
          void setImmediate().then(() => {
            if (state.failCreate)
              runtime.lastError = { message: 'Menu service unavailable' }
            else if (menus.has(menu.id))
              runtime.lastError = { message: 'Duplicate menu ID' }
            else if (menu.parentId && !menus.has(menu.parentId)) {
              runtime.lastError = { message: 'Missing parent menu' }
            } else {
              menus.set(menu.id, menu)
              if (menu.id === 'prelude-capture-close') state.completed++
            }
            callback()
            delete runtime.lastError
          })
        },
      },
    },
  })
  return { menus, installed, startup, state, errors }
}

test('registers all page menu actions on Chrome without tab-strip support', async () => {
  const { menus, state, errors } = setup()
  setupCaptureBackground()
  await waitFor(() => state.completed === 1)
  assert.equal(menus.size, 6)
  for (const menu of menus.values()) {
    for (const context of [
      'page',
      'frame',
      'link',
      'selection',
      'editable',
      'image',
      'video',
      'audio',
      'action',
    ]) {
      assert.ok(menu.contexts.includes(context), `${menu.id}: ${context}`)
    }
    assert.ok(!menu.contexts.includes('tab'))
  }
  assert.equal(menus.get('prelude-capture-close')?.checked, true)
  assert.equal(errors.mock.callCount(), 0)
})

test('keeps tab-strip entries when Chrome exposes support', async () => {
  const { menus, state } = setup({ supportsTab: true })
  setupCaptureBackground()
  await waitFor(() => state.completed === 1)
  assert.ok([...menus.values()].every((menu) => menu.contexts.includes('tab')))
})

test('serializes worker startup, installation, and browser startup registrations', async () => {
  const { installed, startup, state, menus, errors } = setup()
  setupCaptureBackground()
  installed.forEach((listener) => listener())
  startup.forEach((listener) => listener())
  await waitFor(() => state.completed === 3)
  assert.equal(menus.size, 6)
  assert.equal(errors.mock.callCount(), 0)
})

test('reports asynchronous Chrome errors and can recover on the next install event', async () => {
  const { installed, state, menus, errors } = setup({ failCreate: true })
  setupCaptureBackground()
  await waitFor(() => errors.mock.callCount() === 1)
  assert.equal(menus.size, 0)
  assert.match(
    String(errors.mock.calls[0]?.arguments[1]),
    /Menu service unavailable/,
  )
  state.failCreate = false
  installed.forEach((listener) => listener())
  await waitFor(() => state.completed === 1)
  assert.equal(menus.size, 6)
})

test('reuses existing menus when the worker wakes and refreshes the checkbox', async () => {
  const { menus, state, errors } = setup()
  setupCaptureBackground()
  await waitFor(() => state.completed === 1)
  const clears = state.clears
  state.checked = false
  setupCaptureBackground()
  await waitFor(() => menus.get('prelude-capture-close')?.checked === false)
  assert.equal(state.clears, clears)
  assert.equal(errors.mock.callCount(), 0)
})
