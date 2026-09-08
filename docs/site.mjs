import { messages } from './site-messages.mjs'

const languages = ['zh-CN', 'en', 'ja', 'es', 'fr', 'ru']
const languageNames = [
  '简体中文',
  'English',
  '日本語',
  'Español',
  'Français',
  'Русский',
]
const themes = ['light', 'dark', 'system']
const languageKey = 'prelude:site:language:v1'
const themeKey = 'prelude:site:theme:v1'
const page = location.pathname.endsWith('/privacy.html')
  ? 'policy'
  : location.pathname.endsWith('/support.html')
    ? 'support'
    : 'home'
const systemTheme = matchMedia('(prefers-color-scheme: dark)')

for (const link of document.querySelectorAll('.site-nav a')) {
  const url = new URL(link.href)
  if (url.origin === location.origin && url.pathname === location.pathname) {
    link.setAttribute('aria-current', 'page')
  }
}

function readPreference(key, choices, fallback) {
  try {
    const value = localStorage.getItem(key)
    return choices.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Switching still works for this page when browser storage is unavailable.
  }
}

let languagePreference = readPreference(
  languageKey,
  ['auto', ...languages],
  'auto',
)
let themePreference = readPreference(themeKey, themes, 'system')

function resolveLanguage() {
  if (languagePreference !== 'auto') return languagePreference
  for (const language of navigator.languages.length
    ? navigator.languages
    : [navigator.language]) {
    const base = language.toLowerCase().split(/[-_]/)[0]
    const supported = languages.find(
      (candidate) => candidate.toLowerCase().split('-')[0] === base,
    )
    if (supported) return supported
  }
  return 'en'
}

// The public policy retains the same no-JavaScript Chinese/English document
// as the extension. Bind its translated view without changing that source.
if (page === 'policy') {
  const bindings = {
    '.eyebrow': 'policy',
    h1: 'policy',
    '.lede': 'policyIntro',
    '.meta': 'updated',
    '.notice p': 'policyNotice',
  }
  for (const [selector, key] of Object.entries(bindings)) {
    document.querySelector(selector).dataset.i18n = key
  }
  const sections = [...document.querySelectorAll('main > section')]
  const keys = [
    [
      'dataHeading',
      'dataBookmarks',
      'dataTabs',
      'dataSites',
      'dataNavigation',
      'dataPreferences',
      'dataSearch',
    ],
    ['retentionHeading', 'retentionStorage', 'retentionSharing'],
    ['controlHeading', 'controlBody'],
    ['limitedHeading', 'limitedBody'],
    null,
    ['changesHeading', 'changesBody', 'contact', 'support'],
  ]
  sections.forEach((section, index) => {
    if (!keys[index]) {
      section.hidden = true
      return
    }
    section
      .querySelectorAll('h2, p, li, .actions a')
      .forEach((element, child) => {
        element.dataset.i18n = keys[index][child]
      })
  })
}

const preferences = document.querySelector('[data-site-preferences]')
preferences.hidden = false
preferences.innerHTML = `
  <fieldset class="preference-group">
    <legend data-i18n="theme">主题</legend>
    <div class="preference-options">${themes.map((theme, index) => `<button type="button" data-theme-choice="${theme}" data-i18n="${theme}">${['浅色', '深色', '跟随系统'][index]}</button>`).join('')}</div>
  </fieldset>
  <fieldset class="preference-group">
    <legend data-i18n="language">语言</legend>
    <div class="preference-options"><button type="button" data-language-choice="auto" data-i18n="auto">跟随浏览器</button>${languages.map((language, index) => `<button type="button" lang="${language}" data-language-choice="${language}">${languageNames[index]}</button>`).join('')}</div>
  </fieldset>`

const translatedElements = [...document.querySelectorAll('[data-i18n]')]
const chineseContent = new Map(
  translatedElements.map((element) => [element, element.innerHTML]),
)
const translatedAttributes = [
  ...document.querySelectorAll('[data-i18n-alt], [data-i18n-aria-label]'),
].flatMap((element) =>
  ['alt', 'aria-label']
    .filter((attribute) => element.hasAttribute(`data-i18n-${attribute}`))
    .map((attribute) => ({
      element,
      attribute,
      key: element.getAttribute(`data-i18n-${attribute}`),
      original: element.getAttribute(attribute),
    })),
)
const originalTitle = document.title
const metadata = [
  ...document.querySelectorAll(
    'meta[name="description"], meta[property="og:description"], meta[property="og:title"]',
  ),
].map((element) => ({ element, original: element.content }))

function applyLanguage() {
  const language = resolveLanguage()
  const catalog = messages[language]
  document.documentElement.lang = language
  for (const element of translatedElements) {
    // Translations are trusted, bundled copy; preference values never become HTML.
    element.innerHTML =
      language === 'zh-CN'
        ? chineseContent.get(element)
        : catalog[element.dataset.i18n]
  }
  for (const { element, attribute, key, original } of translatedAttributes) {
    element.setAttribute(
      attribute,
      language === 'zh-CN' ? original : catalog[key],
    )
  }
  document.title =
    language === 'zh-CN'
      ? originalTitle
      : page === 'home'
        ? catalog.homeTitle
        : `${catalog[page]} · Prelude`
  for (const { element, original } of metadata) {
    element.content =
      language === 'zh-CN'
        ? original
        : element.getAttribute('property') === 'og:title'
          ? catalog.homeTitle
          : catalog[
              page === 'home'
                ? 'slogan'
                : page === 'support'
                  ? 'supportIntro'
                  : 'policyIntro'
            ].replace(/<[^>]*>/g, '')
  }
  for (const button of preferences.querySelectorAll('[data-language-choice]')) {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.languageChoice === languagePreference),
    )
  }
}

function applyTheme() {
  document.documentElement.dataset.theme =
    themePreference === 'system'
      ? systemTheme.matches
        ? 'dark'
        : 'light'
      : themePreference
  for (const button of preferences.querySelectorAll('[data-theme-choice]')) {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.themeChoice === themePreference),
    )
  }
}

preferences.addEventListener('click', (event) => {
  const button = event.target.closest('button')
  if (!button || !preferences.contains(button)) return
  if (button.dataset.languageChoice) {
    languagePreference = button.dataset.languageChoice
    savePreference(languageKey, languagePreference)
    applyLanguage()
  }
  if (button.dataset.themeChoice) {
    themePreference = button.dataset.themeChoice
    savePreference(themeKey, themePreference)
    applyTheme()
  }
})
systemTheme.addEventListener('change', applyTheme)
window.addEventListener('languagechange', applyLanguage)
window.addEventListener('storage', (event) => {
  if (event.key === languageKey || event.key === null) {
    languagePreference = readPreference(
      languageKey,
      ['auto', ...languages],
      'auto',
    )
    applyLanguage()
  }
  if (event.key === themeKey || event.key === null) {
    themePreference = readPreference(themeKey, themes, 'system')
    applyTheme()
  }
})
applyTheme()
applyLanguage()
