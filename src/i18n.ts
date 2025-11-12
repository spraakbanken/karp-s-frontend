import { createI18n } from 'vue-i18n'

// load translations
import en from '@/locales/en.json'
import sv from '@/locales/sv.json'

export const i18n = createI18n({
  locale: 'sv',
  fallbackLocale: 'en',
  legacy: false,
  warnHtmlMessage: false,
  warnHtmlInMessage: 'off', // disable of the Detected HTML in message
  messages: {
    en: {
      ...en,
    },
    sv: {
      ...sv,
    },
  },
})
