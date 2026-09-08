import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { getTopSites } from './chrome-top-sites.ts'

const originalChrome = Object.getOwnPropertyDescriptor(globalThis, 'chrome')

afterEach(() => {
  if (originalChrome) {
    Object.defineProperty(globalThis, 'chrome', originalChrome)
  } else {
    Reflect.deleteProperty(globalThis, 'chrome')
  }
})

function setChrome(chrome: unknown) {
  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: chrome,
  })
}

test('distinguishes an unavailable API from an empty Chrome result', async () => {
  setChrome({})
  assert.equal(await getTopSites(), undefined)
  setChrome({ topSites: { get: async () => [] } })
  assert.deepEqual(await getTopSites(), [])
})

test('preserves Chrome order and exact destinations without sorting by title', async () => {
  const sites = [
    { title: 'Z site', url: 'https://z.example/path?q=1#section' },
    { title: 'A site', url: 'https://a.example/' },
  ]
  let calls = 0
  setChrome({
    topSites: {
      get: async () => {
        calls++
        return sites
      },
    },
  })
  const result = await getTopSites()
  assert.equal(calls, 1)
  assert.deepEqual(
    result?.map(({ title, url }) => ({ title, url })),
    sites,
  )
})

test('excludes invalid and executable URLs and uses a hostname for empty titles', async () => {
  setChrome({
    topSites: {
      get: async () => [
        { title: 'Invalid', url: 'invalid' },
        { title: 'Script', url: 'javascript:alert(1)' },
        { title: 'Data', url: 'data:text/html,test' },
        { title: 'Settings', url: 'chrome://settings/' },
        { title: '  ', url: 'https://www.example.com/docs' },
        { title: 'Local', url: 'http://localhost:3000/' },
      ],
    },
  })
  assert.deepEqual(await getTopSites(), [
    {
      title: 'example.com',
      url: 'https://www.example.com/docs',
      hostname: 'example.com',
    },
    { title: 'Local', url: 'http://localhost:3000/', hostname: 'localhost' },
  ])
})

test('propagates Chrome failures so the view can offer a retry', async () => {
  setChrome({
    topSites: {
      get: async () => {
        throw new Error('Unavailable')
      },
    },
  })
  await assert.rejects(getTopSites(), /Unavailable/)
})
