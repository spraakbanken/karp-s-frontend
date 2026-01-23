import './assets/main.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n.ts'

import App from './App.vue'
import router from './router'
import VueMatomo from 'vue-matomo'

const app = createApp(App)

// fix for autofocus of first text input
// source: https://stackoverflow.com/questions/64774113/vue-js-3-use-autofocus-on-input-with-ref-inside-a-method
app.directive('focus', {
  // When the bound element is mounted into the DOM...
  mounted(el) {
    // Focus the element
    el.focus()
  },
})

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

app.mount('#app')
