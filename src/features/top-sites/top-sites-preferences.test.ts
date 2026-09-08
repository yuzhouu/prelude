import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  getHiddenTopSitesSnapshot,
  HIDDEN_TOP_SITES_STORAGE_KEY,
  hideTopSite,
  parseHiddenTopSites,
  restoreHiddenTopSites,
  subscribeToHiddenTopSites,
} from './top-sites-preferences.ts'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
afterEach(() => {
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('ignores malformed preferences and invalid values', () => {
  assert.deepEqual(parseHiddenTopSites('{broken'), [])
  assert.deepEqual(parseHiddenTopSites('{}'), [])
  assert.deepEqual(parseHiddenTopSites('["https://a.example/",42,null]'), [
    'https://a.example/',
  ])
})

test('hiding merges fresh preferences, persists, notifies, and restores without deleting unrelated storage', () => {
  const values = new Map([['unrelated', 'preserve']])
  const target = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: target,
  })
  let changes = 0
  const unsubscribe = subscribeToHiddenTopSites(() => changes++)
  hideTopSite('https://a.example/')
  values.set(
    HIDDEN_TOP_SITES_STORAGE_KEY,
    '["https://a.example/","https://b.example/"]',
  )
  hideTopSite('https://c.example/')
  assert.deepEqual(parseHiddenTopSites(getHiddenTopSitesSnapshot()), [
    'https://a.example/',
    'https://b.example/',
    'https://c.example/',
  ])
  restoreHiddenTopSites()
  assert.equal(getHiddenTopSitesSnapshot(), null)
  assert.equal(values.get('unrelated'), 'preserve')
  assert.equal(changes, 3)
  unsubscribe()
  hideTopSite('https://a.example/')
  assert.equal(changes, 3)
})

test('write failures propagate without announcing a successful change', () => {
  const target = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage blocked')
      },
    },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: target,
  })
  let changes = 0
  const unsubscribe = subscribeToHiddenTopSites(() => changes++)
  assert.throws(() => hideTopSite('https://a.example/'), /Storage blocked/)
  assert.equal(changes, 0)
  unsubscribe()
})
