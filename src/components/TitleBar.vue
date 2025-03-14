<script setup lang="ts">
import MenuBar from './MenuBar.vue'
import { lexicalStore } from '../stores/store'
import { ref, onMounted } from 'vue'

const logoKarp = ref('')
const logoSB = ref('')
const logoGU = ref('')
const logoKarpEn = ref('')

const lexicalStorage = lexicalStore()

function resetApp() {
  lexicalStorage.setEmpty()
}

const updateTheme = async () => {
  const theme = document.documentElement.getAttribute('data-theme')
  const isDarkMode = theme === 'dark'
  logoKarp.value = isDarkMode
    ? (await import('@/assets/karps_slogan_sv_dark_theme.svg')).default
    : (await import('@/assets/karps_slogan_sv_light_theme.svg')).default
  logoSB.value = isDarkMode
    ? (await import('@/assets/sprakbanken_text_dark_theme.svg')).default
    : (await import('@/assets/sprakbanken_text_light_theme.svg')).default
  logoGU.value = isDarkMode
    ? (await import('@/assets/gu-sv.svg')).default
    : (await import('@/assets/gu-sv.svg')).default
  logoKarpEn.value = isDarkMode
    ? (await import('@/assets/karps_slogan_en_dark_theme.svg')).default
    : (await import('@/assets/karps_slogan_en_light_theme.svg')).default
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
</script>

<template>
  <div class="header-area">
    <div class="left-area">
      <div @click="resetApp()" class="logo-box pointer">
        <div v-if="$i18n.locale == 'sv'">
          <img :src="logoKarp" alt="Karp-S logo" width="300" />
        </div>
        <div v-else>
          <img :src="logoKarpEn" alt="Karp-S logo" width="300" />
        </div>
      </div>
    </div>
    <div class="right-area">
      <div class="middle-area">
        <div class="sb-box">
          <a href="https://spraakbanken.gu.se/" target="_new">
            <img :src="logoSB" alt="Språkbanken Text" />
          </a>
        </div>
        <div class="choices-area">
          <MenuBar />
        </div>
      </div>
      <div class="gu-box">
        <a href="https://gu.se/" target="_new">
          <img :src="logoGU" alt="Göteborgs universitet" />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-area {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-right: 2rem;
  padding-left: 2rem;
  margin-left: auto;
  margin-right: auto;
  background-color: var(--color-bg);
  box-sizing: border-box;
  width: 100%;
}

.header-area .left-area {
  display: flex;
  box-sizing: border-box;
}

.header-area .logo-box {
  box-sizing: border-box;
  margin-right: 1rem;
}

.header-area .right-area {
  display: flex;
  box-sizing: border-box;
}

.header-area .middle-area {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  margin-right: 1rem;
  box-sizing: border-box;
}

.header-area .sb-box {
  display: flex;
  height: 3rem;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0%;
  justify-content: flex-end;
  text-align: right;
  box-sizing: border-box;
}

.sb-box img {
  max-width: 100%;
  height: auto;
  display: block;
  width: 14rem;
}

.header-area .choices-area {
  display: flex;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  gap: 1rem;
  align-items: baseline;
}

.header-area .gu-box {
  height: 6rem;
  margin-top: -1rem;
  margin-bottom: -1rem;
  box-sizing: border-box;
}

.gu-box img {
  height: 100%;
  vertical-align: middle;
  box-sizing: border-box;
}

.pointer {
  cursor: pointer;
}

@media (min-width: 1024px) {
}
</style>
