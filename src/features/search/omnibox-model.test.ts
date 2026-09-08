import assert from 'node:assert/strict'
import test from 'node:test'
import { createInstance } from 'i18next'

import { buildOmniboxSuggestions } from './omnibox-model.ts'
import type { BookmarkMatch } from '../bookmarks/model.ts'
import type { OpenTabWindow } from '../tabs/model.ts'
import type { TopSite } from '../top-sites/chrome-top-sites.ts'

const i18n = createInstance()
await i18n.init({ lng: 'en', resources: {}, initAsync: false })
const t = i18n.t
const bookmark = (id: string, title: string, dateAdded = 1): BookmarkMatch => ({
  node: { id, title, url: `https://example.com/${id}`, dateAdded },
  path: ['Work'],
})
const suggestions = (
  rawQuery: string,
  bookmarks: Array<BookmarkMatch>,
  openTabWindows: Array<OpenTabWindow> = [],
) => buildOmniboxSuggestions({ rawQuery, bookmarks, openTabWindows, t })

test('exact local matches rank before partial matches and web search, even beyond the old result limit', () => {
  const bookmarks = [
    ...Array.from({ length: 20 }, (_, i) =>
      bookmark(`${i}`, `Guide to GitHub ${i}`),
    ),
    bookmark('exact', 'GitHub'),
  ]
  const results = suggestions('github', bookmarks)
  assert.equal(results[0].id, 'bookmark:exact')
  assert.equal(results.at(-1)?.kind, 'search')
  assert.equal(results.length, 15)
})

test('equally exact open tabs take priority over bookmarks', () => {
  const windows: Array<OpenTabWindow> = [
    {
      id: 1,
      focused: true,
      tabs: [
        {
          id: 7,
          windowId: 1,
          nativeIndex: 0,
          groupId: -1,
          title: 'GitHub',
          url: 'https://github.com',
          active: false,
          pinned: false,
          audible: false,
        },
      ],
    },
  ]
  assert.equal(
    suggestions('github', [bookmark('exact', 'GitHub')], windows)[0].kind,
    'tab',
  )
})

test('explicit URLs navigate first; unmatched text still offers web search', () => {
  assert.equal(
    suggestions('example.com', [bookmark('a', 'Example')])[0].kind,
    'navigate',
  )
  assert.equal(
    suggestions('a new question', [bookmark('a', 'Example')])[0].kind,
    'search',
  )
})

test('empty query shows four newest bookmarks without mutating source order', () => {
  const bookmarks = Array.from({ length: 6 }, (_, i) =>
    bookmark(`${i}`, `Link ${i}`, i),
  )
  assert.deepEqual(
    suggestions('  ', bookmarks).map((item) => item.id),
    ['bookmark:5', 'bookmark:4', 'bookmark:3', 'bookmark:2'],
  )
  assert.equal(bookmarks[0].node.id, '0')
  assert.deepEqual(suggestions('', []), [])
})

const topSites: Array<TopSite> = [
  { title: 'Zeta', url: 'https://zeta.example/', hostname: 'zeta.example' },
  {
    title: 'Alpha',
    url: 'https://alpha.example/docs',
    hostname: 'alpha.example',
  },
]

test('default frequent sites are limited to three while typed queries search the full source', () => {
  const sites = Array.from({ length: 8 }, (_, i) => ({
    title: `Site ${i}`,
    url: `https://site${i}.example/`,
    hostname: `site${i}.example`,
  }))
  const build = (rawQuery: string, hiddenTopSiteUrls: Array<string> = []) =>
    buildOmniboxSuggestions({
      bookmarks: [],
      openTabWindows: [],
      rawQuery,
      topSites: sites,
      hiddenTopSiteUrls,
      t,
    })
  assert.deepEqual(
    build('').map((item) => item.title),
    ['Site 0', 'Site 1', 'Site 2'],
  )
  assert.equal(build('Site 7')[0].title, 'Site 7')
  assert.deepEqual(
    build('', [sites[0].url]).map((item) => item.title),
    ['Site 1', 'Site 2', 'Site 3'],
  )
  assert.equal(sites.length, 8)
})

test('empty query shows Chrome order before recent bookmarks and removes duplicate destinations', () => {
  const bookmarks = [
    {
      node: {
        id: 'same',
        title: 'Saved Zeta',
        url: topSites[0].url,
        dateAdded: 3,
      },
      path: [],
    },
    bookmark('recent', 'Recent', 2),
  ]
  const result = buildOmniboxSuggestions({
    bookmarks,
    openTabWindows: [],
    rawQuery: '',
    topSites,
    t,
  })
  assert.deepEqual(
    result.map((item) => item.title),
    ['Zeta', 'Alpha', 'Recent'],
  )
  assert.equal(topSites[0].title, 'Zeta')
})

test('frequent sites match titles and paths, rank before web search, and preserve explicit navigation', () => {
  const build = (rawQuery: string) =>
    buildOmniboxSuggestions({
      bookmarks: [],
      openTabWindows: [],
      rawQuery,
      topSites,
      t,
    })
  assert.equal(build('ALPHA')[0].id, 'top-site:https://alpha.example/docs')
  assert.equal(build('/docs')[0].kind, 'top-site')
  assert.equal(build('alpha').at(-1)?.kind, 'search')
  assert.equal(build('alpha.example')[0].kind, 'navigate')
  assert.deepEqual(
    build('unmatched').map((item) => item.kind),
    ['search'],
  )
})

test('bookmarks take priority over duplicate frequent sites and remain searchable when a frequent site is hidden', () => {
  const bookmarks = [
    { node: { id: 'z', title: 'Zeta saved', url: topSites[0].url }, path: [] },
  ]
  const build = (hiddenTopSiteUrls: Array<string>) =>
    buildOmniboxSuggestions({
      bookmarks,
      openTabWindows: [],
      rawQuery: 'zeta',
      topSites,
      hiddenTopSiteUrls,
      t,
    })
  assert.deepEqual(
    build([]).map((item) => item.kind),
    ['bookmark', 'search'],
  )
  assert.deepEqual(
    build([topSites[0].url]).map((item) => item.kind),
    ['bookmark', 'search'],
  )
})

test('hidden sites stay out of default and typed suggestions, including URL fragment variants', () => {
  for (const rawQuery of ['', 'zeta']) {
    const result = buildOmniboxSuggestions({
      bookmarks: [],
      openTabWindows: [],
      rawQuery,
      topSites,
      hiddenTopSiteUrls: ['https://zeta.example/#section'],
      t,
    })
    assert.equal(
      result.some((item) => item.id === 'top-site:https://zeta.example/'),
      false,
    )
  }
})
