import assert from 'node:assert/strict'
import test from 'node:test'

import {
  areKeyboardShortcutsEqual,
  DEFAULT_SHORTCUT_PREFERENCES,
  formatKeyboardShortcut,
  hasRequiredShortcutModifier,
  isBrowserReservedShortcut,
  isKeyboardShortcutMatch,
  keyboardShortcutFromEvent,
  parseChromeCommandShortcut,
  parseShortcutPreferences,
} from './shortcut-preferences.ts'

test('records and formats a portable primary shortcut', () => {
  const shortcut = keyboardShortcutFromEvent({
    key: 'p',
    altKey: false,
    ctrlKey: false,
    metaKey: true,
    shiftKey: true,
  })

  assert.deepEqual(shortcut, {
    key: 'p',
    primary: true,
    alt: false,
    shift: true,
  })
  assert.equal(formatKeyboardShortcut(shortcut, true), '⌘ ⇧ P')
  assert.equal(formatKeyboardShortcut(shortcut, false), 'Ctrl Shift P')
})

test('matches the exact key and modifier combination', () => {
  const shortcut = DEFAULT_SHORTCUT_PREFERENCES.search

  assert.equal(
    isKeyboardShortcutMatch(
      {
        key: 'K',
        altKey: false,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      },
      shortcut,
    ),
    true,
  )
  assert.equal(
    isKeyboardShortcutMatch(
      {
        key: 'k',
        altKey: true,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      },
      shortcut,
    ),
    false,
  )
})

test('rejects unsafe unmodified and browser-reserved shortcuts', () => {
  const plainLetter = keyboardShortcutFromEvent({
    key: 's',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  })
  const closeTab = keyboardShortcutFromEvent({
    key: 'w',
    altKey: false,
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
  })

  assert.equal(hasRequiredShortcutModifier(plainLetter!), false)
  assert.equal(isBrowserReservedShortcut(closeTab!), true)
})

test('parses Chrome command shortcuts for conflict checks', () => {
  const shortcut = parseChromeCommandShortcut('Alt+Shift+S')

  assert.deepEqual(shortcut, {
    key: 's',
    primary: false,
    alt: true,
    shift: true,
  })
  assert.equal(
    areKeyboardShortcutsEqual(shortcut, {
      key: 's',
      primary: false,
      alt: true,
      shift: true,
    }),
    true,
  )
})

test('falls back to defaults for malformed persisted data', () => {
  assert.equal(
    parseShortcutPreferences('{broken'),
    DEFAULT_SHORTCUT_PREFERENCES,
  )
  assert.equal(
    parseShortcutPreferences(JSON.stringify({ search: { key: 'x' } })),
    DEFAULT_SHORTCUT_PREFERENCES,
  )
})
