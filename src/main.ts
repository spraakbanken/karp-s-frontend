import './assets/main.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'

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

app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')
