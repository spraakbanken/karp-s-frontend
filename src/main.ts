import './assets/main.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import VueMatomo from 'vue-matomo'
import { syncStoreWithRouter } from './router/syncStoreWithRouter'

// load translations
import en from '@/locales/en.json'
import sv from '@/locales/sv.json'

const i18n = createI18n({
  locale: 'sv',
  fallbackLocale: 'en',
  messages: {
    en: {
      ...en,
    },
    sv: {
      ...sv,
    },
  },
})

const app = createApp(App)

// Use the Matomo plugin only if configured in env.
if (import.meta.env.VITE_MATOMO_URL && import.meta.env.VITE_MATOMO_ID) {
  app.use(VueMatomo, {
    // URL expected without trailing slash
    host: import.meta.env.VITE_MATOMO_URL.replace(/\/$/, ''),
    siteId: import.meta.env.VITE_MATOMO_ID,
    router: router,
  })
}

app.use(createPinia())
app.use(i18n)
app.use(router)

syncStoreWithRouter(router)

app.mount('#app')
