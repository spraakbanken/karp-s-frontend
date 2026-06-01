import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n.ts'

import App from './App.vue'
import router from './router'
// Provide a simple module declaration to satisfy TypeScript when no types are available
declare module 'vue-matomo'
import VueMatomo from 'vue-matomo'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward'
import { faBackwardFast } from '@fortawesome/free-solid-svg-icons/faBackwardFast'
import { faBackwardStep } from '@fortawesome/free-solid-svg-icons/faBackwardStep'
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons/faChevronUp'
import { faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons/faCircleHalfStroke'
import { faClose } from '@fortawesome/free-solid-svg-icons/faClose'
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward'
import { faForwardFast } from '@fortawesome/free-solid-svg-icons/faForwardFast'
import { faForwardStep } from '@fortawesome/free-solid-svg-icons/faForwardStep'
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe'
import { faImages } from '@fortawesome/free-solid-svg-icons/faImages'
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock'
import { faLockOpen } from '@fortawesome/free-solid-svg-icons/faLockOpen'
import { faSquare } from '@fortawesome/free-solid-svg-icons/faSquare'
import { faUserLock } from '@fortawesome/free-solid-svg-icons/faUserLock'

library.add(
  faBackward,
  faBackwardFast,
  faBackwardStep,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleHalfStroke,
  faClose,
  faForward,
  faForwardFast,
  faForwardStep,
  faGlobe,
  faImages,
  faLock,
  faLockOpen,
  faSquare,
  faUserLock,
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)

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
