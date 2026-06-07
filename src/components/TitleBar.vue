<script setup lang="ts">
import MenuBar from './MenuBar.vue'
// import { lexicalStore } from '../stores/store'
import { ref, onMounted } from 'vue'
import DataSelection from '@/components/DataSelection.vue'

const logoKarp = ref('')
const logoKarpEn = ref('')

function resetApp() {
  // console.log('Pathname ', window.location.pathname)
  // window.location.href = window.location.pathname
  window.location.href = '/karp/'
  //router.push('/')
}

const updateTheme = async () => {
  const theme = document.documentElement.getAttribute('data-theme')
  const isDarkMode = theme === 'dark'
  logoKarp.value = isDarkMode
    ? (await import('@/assets/karps_slogan_sv_dark_theme.svg')).default
    : (await import('@/assets/karps_slogan_sv_light_theme.svg')).default
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
          <img :src="logoKarp" alt="Karp logo" width="200" />
        </div>
        <div v-else>
          <img :src="logoKarpEn" alt="Karp logo" width="200" />
        </div>
      </div>
    </div>
    <div class="middle-area">
      <!--<div class="version">{{ $t('titlebar.version') }}<br /></div>-->
      <DataSelection />
    </div>
    <div class="right-area">
      <MenuBar />
      <!--
      <div class="middle-right">
        <div class="choices-area">
        </div>
      </div>
      -->
    </div>
  </div>
</template>

<style scoped>
.header-area {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: end;
  padding-top: 0.5rem;
  padding-bottom: 0rem;
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
  align-items: end;
}

.header-area .right-area {
  display: flex;
  flex: 1;
  justify-content: flex-end;
}

.middle-right {
  align-items: flex-end;
}

.header-area .right-area .middle-right {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  margin-right: 1rem;
  box-sizing: border-box;
}

.header-area .choices-area {
  display: flex;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  gap: 1rem;
  align-items: baseline;
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

@media (max-width: 1000px) {
  .header-area {
    flex-direction: column;
    align-items: center;
  }
  .middle-area,
  .right-area {
    align-items: center;
  }
}
</style>
