export interface KeyboardShortcut {
  key: string
  primary: boolean
  alt: boolean
  shift: boolean
}

export interface ShortcutPreferences {
  search: KeyboardShortcut
}

export const SHORTCUT_PREFERENCES_STORAGE_KEY = 'prelude:keyboard-shortcuts:v1'
export const SHORTCUT_PREFERENCES_CHANGED_EVENT =
  'prelude:keyboard-shortcuts-changed'

export const DEFAULT_SHORTCUT_PREFERENCES: ShortcutPreferences = {
  search: {
    key: 'k',
    primary: true,
    alt: false,
    shift: false,
  },
}

interface KeyboardEventLike {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

const MODIFIER_KEYS = new Set(['alt', 'altgraph', 'control', 'meta', 'shift'])
const BROWSER_RESERVED_PRIMARY_KEYS = new Set(['l', 'n', 'q', 'r', 't', 'w'])

let cachedPreferences: ShortcutPreferences | undefined

function normalizeKey(key: string) {
  if (key === ' ') return 'space'
  return key.toLowerCase()
}

function isKeyboardShortcut(value: unknown): value is KeyboardShortcut {
  if (!value || typeof value !== 'object') return false
  const shortcut = value as Partial<KeyboardShortcut>
  return (
    typeof shortcut.key === 'string' &&
    shortcut.key.length > 0 &&
    typeof shortcut.primary === 'boolean' &&
    typeof shortcut.alt === 'boolean' &&
    typeof shortcut.shift === 'boolean'
  )
}

export function parseShortcutPreferences(value: string | null) {
  if (!value) return DEFAULT_SHORTCUT_PREFERENCES

  try {
    const parsed = JSON.parse(value) as Partial<ShortcutPreferences>
    return isKeyboardShortcut(parsed.search)
      ? { search: parsed.search }
      : DEFAULT_SHORTCUT_PREFERENCES
  } catch {
    return DEFAULT_SHORTCUT_PREFERENCES
  }
}

export function getShortcutPreferences() {
  if (cachedPreferences) return cachedPreferences

  try {
    cachedPreferences = parseShortcutPreferences(
      window.localStorage.getItem(SHORTCUT_PREFERENCES_STORAGE_KEY),
    )
  } catch {
    cachedPreferences = DEFAULT_SHORTCUT_PREFERENCES
  }

  return cachedPreferences
}

export function saveShortcutPreferences(preferences: ShortcutPreferences) {
  cachedPreferences = preferences

  try {
    window.localStorage.setItem(
      SHORTCUT_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // Keep the preference in memory when browser storage is unavailable.
  }

  window.dispatchEvent(
    new CustomEvent(SHORTCUT_PREFERENCES_CHANGED_EVENT, {
      detail: preferences,
    }),
  )
}

export function syncShortcutPreferencesFromStorage(value: string | null) {
  cachedPreferences = parseShortcutPreferences(value)
  return cachedPreferences
}

export function keyboardShortcutFromEvent(
  event: KeyboardEventLike,
): KeyboardShortcut | undefined {
  const key = normalizeKey(event.key)
  if (
    !key ||
    MODIFIER_KEYS.has(key) ||
    key === 'dead' ||
    key === 'process' ||
    key === 'unidentified'
  ) {
    return undefined
  }

  return {
    key,
    primary: event.metaKey || event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
  }
}

export function hasRequiredShortcutModifier(shortcut: KeyboardShortcut) {
  return shortcut.primary || shortcut.alt
}

export function isBrowserReservedShortcut(shortcut: KeyboardShortcut) {
  return (
    shortcut.primary &&
    !shortcut.alt &&
    BROWSER_RESERVED_PRIMARY_KEYS.has(shortcut.key)
  )
}

export function isKeyboardShortcutMatch(
  event: KeyboardEventLike,
  shortcut: KeyboardShortcut,
) {
  return (
    normalizeKey(event.key) === shortcut.key &&
    (event.metaKey || event.ctrlKey) === shortcut.primary &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift
  )
}

export function areKeyboardShortcutsEqual(
  first: KeyboardShortcut,
  second: KeyboardShortcut,
) {
  return (
    first.key === second.key &&
    first.primary === second.primary &&
    first.alt === second.alt &&
    first.shift === second.shift
  )
}

export function isApplePlatform() {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
}

function formatShortcutKey(key: string) {
  const namedKeys: Record<string, string> = {
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    arrowup: '↑',
    backspace: 'Backspace',
    delete: 'Delete',
    end: 'End',
    enter: 'Enter',
    home: 'Home',
    pagedown: 'Page Down',
    pageup: 'Page Up',
    space: 'Space',
    tab: 'Tab',
  }

  return namedKeys[key] ?? key.toUpperCase()
}

export function getKeyboardShortcutTokens(
  shortcut: KeyboardShortcut,
  applePlatform = isApplePlatform(),
) {
  const tokens: Array<string> = []
  if (shortcut.primary) tokens.push(applePlatform ? '⌘' : 'Ctrl')
  if (shortcut.alt) tokens.push(applePlatform ? '⌥' : 'Alt')
  if (shortcut.shift) tokens.push(applePlatform ? '⇧' : 'Shift')
  tokens.push(formatShortcutKey(shortcut.key))
  return tokens
}

export function formatKeyboardShortcut(
  shortcut: KeyboardShortcut,
  applePlatform = isApplePlatform(),
) {
  return getKeyboardShortcutTokens(shortcut, applePlatform).join(' ')
}

export function parseChromeCommandShortcut(
  shortcut: string,
): KeyboardShortcut | undefined {
  const tokens = shortcut
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean)
  const key = tokens.at(-1)
  if (!key) return undefined

  const modifiers = new Set(
    tokens.slice(0, -1).map((token) => token.toLowerCase()),
  )
  return {
    key: normalizeKey(key),
    primary:
      modifiers.has('ctrl') ||
      modifiers.has('command') ||
      modifiers.has('macctrl'),
    alt: modifiers.has('alt') || modifiers.has('option'),
    shift: modifiers.has('shift'),
  }
}

export function formatChromeCommandShortcut(shortcut: string) {
  return shortcut
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean)
    .join(' + ')
}
