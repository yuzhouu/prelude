import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import {
  changeLanguage,
  resolveSupportedLanguage,
  supportedLanguages,
} from '../../i18n'
import type { SupportedLanguage } from '../../i18n'

const SHORT_LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'zh-CN': '中',
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  ja: '日',
  ru: 'RU',
}

const LANGUAGE_LABEL_KEYS = {
  'zh-CN': 'language.zhCN',
  en: 'language.en',
  es: 'language.es',
  fr: 'language.fr',
  ja: 'language.ja',
  ru: 'language.ru',
} as const satisfies Record<SupportedLanguage, `language.${string}`>

interface LanguageToggleProps {
  showLabel?: boolean
}

export function LanguageToggle({ showLabel = true }: LanguageToggleProps) {
  const { t, i18n } = useTranslation()
  const currentLanguage = resolveSupportedLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  )

  return (
    <div className={`language-control${showLabel ? '' : ' is-label-hidden'}`}>
      {showLabel ? (
        <span className="language-control-label">{t('language.label')}</span>
      ) : null}
      <div
        className="language-options"
        role="group"
        aria-label={t('language.groupLabel')}
      >
        {supportedLanguages.map((language) => {
          const label = t(LANGUAGE_LABEL_KEYS[language])
          return (
            <Tooltip key={language}>
              <TooltipTrigger
                render={
                  <button
                    className="language-option"
                    type="button"
                    aria-label={label}
                    aria-pressed={currentLanguage === language}
                    onClick={() => void changeLanguage(language)}
                  >
                    {SHORT_LANGUAGE_LABELS[language]}
                  </button>
                }
              />
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
