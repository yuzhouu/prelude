import { useTranslation } from 'react-i18next'
import {
  changeLanguage,
  resolveSupportedLanguage,
  supportedLanguages,
} from '../../i18n'
import type { SupportedLanguage } from '../../i18n'

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'zh-CN': '简体中文',
  en: 'English',
  ja: '日本語',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
}

export function LanguageToggle({ showLabel = true }: { showLabel?: boolean }) {
  const { t, i18n } = useTranslation()
  const currentLanguage = resolveSupportedLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  )
  return (
    <label className={`language-control${showLabel ? '' : ' is-label-hidden'}`}>
      {showLabel ? (
        <span className="language-control-label">{t('language.label')}</span>
      ) : null}
      <select
        className="language-select"
        aria-label={t('language.groupLabel')}
        value={currentLanguage}
        onChange={(event) => {
          const language = supportedLanguages.find(
            (value) => value === event.target.value,
          )
          if (language) void changeLanguage(language)
        }}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </select>
    </label>
  )
}
