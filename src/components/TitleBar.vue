<script setup lang="ts">
import MenuBar from './MenuBar.vue'
// import { lexicalStore } from '../stores/store'
import { ref, onMounted } from 'vue'
import DataSelection from '@/components/DataSelection.vue'

const logoKarp = ref('')
const logoSB = ref('')
const logoGU = ref('')
const logoKarpEn = ref('')

function resetApp() {
  // console.log('Pathname ', window.location.pathname)
  // window.location.href = window.location.pathname
  window.location.href = '/karplabb/'
  //router.push('/')
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
          <img :src="logoKarp" alt="Karplabb logo" width="300" />
        </div>
        <div v-else>
          <img :src="logoKarpEn" alt="Karplabb logo" width="300" />
        </div>
      </div>
    </div>
    <div class="middle-area">
      <!--<div class="version">{{ $t('titlebar.version') }}<br /></div>-->
      <DataSelection />
    </div>
    <div class="right-area">
      <div class="middle-right">
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
  flex-direction: row;
  flex: 1;
  flex-wrap: wrap;
  justify-content: space-between;
  padding-top: 2rem;
  padding-bottom: 1rem;
  padding-right: 2rem;
  padding-left: 2rem;
  background-color: var(--color-bg);
}

.header-area .left-area {
  display: flex;
  flex: 1;
}

.header-area .logo-box {
  margin-right: 1rem;
}

.header-area .middle-area {
  display: flex;
  flex: 1;
}

.header-area .right-area {
  display: flex;
  flex: 1;
}

.header-area .right-area .middle-right {
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

.middle-area {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 6rem;
}

.middle-area .version {
  font-style: italic;
}

.middle-area .version-url {
  font-size: x-small;
}

@media (max-width: 800px) {
  .header-area {
    flex-direction: column;
    justify-content: left;
  }
  .middle-area,
  .right-area {
    justify-content: left;
  }
}
</style>
