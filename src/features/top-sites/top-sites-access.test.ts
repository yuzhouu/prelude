import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  changeTopSitesAccess,
  getTopSitesEnabledSnapshot,
  hasTopSitesPermission,
  subscribeToTopSitesPreference,
  TOP_SITES_ENABLED_STORAGE_KEY,
} from './top-sites-access.ts'

const originals = ['window', 'chrome'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
)
afterEach(() => {
  for (const [key, original] of originals) {
    if (original) Object.defineProperty(globalThis, key, original)
    else Reflect.deleteProperty(globalThis, key)
  }
})

function setup({
  grant = true,
  stored = false,
  granted = false,
  storageFails = false,
  required = false,
} = {}) {
  const values = new Map([['unrelated', 'keep']])
  if (stored) values.set(TOP_SITES_ENABLED_STORAGE_KEY, 'true')
  const calls: Array<string> = []
  const window = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (storageFails) throw new Error('Storage blocked')
        values.set(key, value)
      },
    },
  })
  const permissions = {
    contains: async (value: unknown) => {
      assert.deepEqual(value, { permissions: ['topSites'] })
      return granted
    },
    request: async (value: unknown) => {
      assert.deepEqual(value, { permissions: ['topSites'] })
      calls.push('request')
      granted = grant
      return grant
    },
    remove: async (value: unknown) => {
      assert.deepEqual(value, { permissions: ['topSites'] })
      calls.push('remove')
      throw new Error('Permission must not be removed')
    },
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: window,
  })
  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: {
      permissions,
      runtime: {
        id: 'test-extension',
        getManifest: () => ({ permissions: required ? ['topSites'] : [] }),
      },
    },
  })
  return { calls, values, window }
}

test('defaults off even when a prior installation already has permission', async () => {
  const { calls } = setup({ granted: true })
  assert.equal(getTopSitesEnabledSnapshot(), false)
  assert.equal(await hasTopSitesPermission(), true)
  assert.deepEqual(calls, [])
})

test('requests synchronously in the click gesture, then persists consent and notifies', async () => {
  const { calls, values } = setup()
  let updates = 0
  const unsubscribe = subscribeToTopSitesPreference(() => updates++)
  const pending = changeTopSitesAccess(true)
  assert.deepEqual(calls, ['request'])
  assert.equal(getTopSitesEnabledSnapshot(), false)
  assert.equal(await pending, 'success')
  assert.equal(getTopSitesEnabledSnapshot(), true)
  assert.equal(await hasTopSitesPermission(), true)
  assert.equal(updates, 1)
  assert.equal(await changeTopSitesAccess(false), 'success')
  assert.equal(getTopSitesEnabledSnapshot(), false)
  assert.equal(await hasTopSitesPermission(), true)
  assert.deepEqual(calls, ['request'])
  assert.equal(updates, 2)
  assert.equal(values.get('unrelated'), 'keep')
  unsubscribe()
})

test('denial keeps the preference off and never announces enablement', async () => {
  setup({ grant: false })
  let updates = 0
  const unsubscribe = subscribeToTopSitesPreference(() => updates++)
  assert.equal(await changeTopSitesAccess(true), 'denied')
  assert.equal(getTopSitesEnabledSnapshot(), false)
  assert.equal(updates, 0)
  unsubscribe()
})

test('failed consent persistence keeps the feature off without revoking Chrome permission', async () => {
  const { calls } = setup({ storageFails: true })
  await assert.rejects(changeTopSitesAccess(true), /Storage blocked/)
  assert.deepEqual(calls, ['request'])
  assert.equal(await hasTopSitesPermission(), true)
  assert.equal(getTopSitesEnabledSnapshot(), false)
})

test('failed disable persistence reports the failure and preserves the existing state', async () => {
  setup({ stored: true, granted: true, storageFails: true })
  await assert.rejects(changeTopSitesAccess(false), /Storage blocked/)
  assert.equal(getTopSitesEnabledSnapshot(), true)
  assert.equal(await hasTopSitesPermission(), true)
})

test('disabling with old required permissions succeeds locally and retains authorization', async () => {
  const { calls } = setup({
    stored: true,
    granted: true,
    required: true,
  })
  assert.equal(await changeTopSitesAccess(false), 'success')
  assert.equal(getTopSitesEnabledSnapshot(), false)
  assert.equal(await hasTopSitesPermission(), true)
  assert.deepEqual(calls, [])
})

test('disabling does not depend on Chrome permission APIs being available', async () => {
  setup({ stored: true })
  Reflect.deleteProperty(globalThis, 'chrome')
  assert.equal(await changeTopSitesAccess(false), 'success')
  assert.equal(getTopSitesEnabledSnapshot(), false)
})

test('observes preference changes in other pages and removes listeners', () => {
  const { values, window } = setup()
  let updates = 0
  const unsubscribe = subscribeToTopSitesPreference(() => updates++)
  values.set(TOP_SITES_ENABLED_STORAGE_KEY, 'true')
  window.dispatchEvent(
    Object.assign(new Event('storage'), { key: TOP_SITES_ENABLED_STORAGE_KEY }),
  )
  assert.equal(getTopSitesEnabledSnapshot(), true)
  assert.equal(updates, 1)
  window.dispatchEvent(
    Object.assign(new Event('storage'), { key: 'unrelated' }),
  )
  assert.equal(updates, 1)
  unsubscribe()
  window.dispatchEvent(Object.assign(new Event('storage'), { key: null }))
  assert.equal(updates, 1)
})

test('a web preview does not pretend to grant Chrome permission', async () => {
  setup()
  Reflect.deleteProperty(globalThis, 'chrome')
  assert.equal(await changeTopSitesAccess(true), 'unavailable')
  assert.equal(await hasTopSitesPermission(), false)
  assert.equal(getTopSitesEnabledSnapshot(), false)
})
