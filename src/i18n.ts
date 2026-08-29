import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { en } from './locales/en'
import { zhCN } from './locales/zh-CN'

export const supportedLanguages = ['zh-CN', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

const LANGUAGE_STORAGE_KEY = 'prelude:language:v1'

interface ChromeI18nApi {
  i18n?: {
    getUILanguage: () => string
  }
}

export function resolveSupportedLanguage(
  language: string | null | undefined,
): SupportedLanguage {
  if (language?.toLowerCase().startsWith('zh')) return 'zh-CN'
  return 'en'
}

function getStoredLanguage() {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return supportedLanguages.find((language) => language === storedLanguage)
  } catch {
    return undefined
  }
}

function getBrowserLanguage() {
  const chromeApi = (
    globalThis as typeof globalThis & { chrome?: ChromeI18nApi }
  ).chrome
  return chromeApi?.i18n?.getUILanguage() ?? navigator.language
}

function syncDocumentLanguage(language: string) {
  const resolvedLanguage = resolveSupportedLanguage(language)
  document.documentElement.lang = resolvedLanguage
  document.documentElement.dir = i18n.dir(resolvedLanguage)
  document.title = i18n.t('app.name')

  const description = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  )
  description?.setAttribute('content', i18n.t('app.description'))
}

export const i18n = createInstance()

void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: getStoredLanguage() ?? resolveSupportedLanguage(getBrowserLanguage()),
  fallbackLng: 'zh-CN',
  supportedLngs: supportedLanguages,
  load: 'currentOnly',
  initAsync: false,
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  const resolvedLanguage = resolveSupportedLanguage(language)
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage)
  } catch {
    // Keep the in-memory language when browser storage is unavailable.
  }
  syncDocumentLanguage(resolvedLanguage)
})

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language)

export function changeLanguage(language: SupportedLanguage) {
  return i18n.changeLanguage(language)
}
