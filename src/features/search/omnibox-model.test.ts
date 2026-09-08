import assert from 'node:assert/strict'
import test from 'node:test'
import { createInstance } from 'i18next'

import { buildOmniboxSuggestions } from './omnibox-model.ts'
import type { BookmarkMatch } from '../bookmarks/model.ts'
import type { OpenTabWindow } from '../tabs/model.ts'

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
