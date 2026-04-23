<script setup lang="ts">
import { onMounted, ref } from 'vue'

const logoSB = ref('')
const logoGU = ref('')
const logoGUEn = ref('')

const updateTheme = async () => {
  const theme = document.documentElement.getAttribute('data-theme')
  const isDarkMode = theme === 'dark'
  logoSB.value = isDarkMode
    ? (await import('@/assets/sprakbanken_text_dark_theme.svg')).default
    : (await import('@/assets/sprakbanken_text_light_theme.svg')).default
  logoGU.value = isDarkMode
    ? (await import('@/assets/gu_vert_sv_inv.svg')).default
    : (await import('@/assets/gu_vert_sv.svg')).default
  logoGUEn.value = isDarkMode
    ? (await import('@/assets/gu_vert_en_inv.svg')).default
    : (await import('@/assets/gu_vert_en.svg')).default
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
</script>

<template>
  <div class="footer-area">
    <div class="footer-area-left">
      <!--
      <a href="https://spraakbanken.gu.se"><img :src="logoSB" alt="Språkbanken Text logo" /></a>
      -->
      <div class="sb-box">
        <a href="https://spraakbanken.gu.se/" target="_new">
          <img :src="logoSB" alt="Språkbanken Text" />
        </a>
      </div>
      <template v-if="$i18n.locale == 'sv'">
        <div>
          <a href="https://spraakbanken.gu.se/om">{{ $t('footer.aboutus') }}</a>
        </div>
        <div>
          <a href="https://spraakbanken.gu.se/aktuellt">{{ $t('footer.newsfromus') }}</a>
        </div>
        <div>
          <a href="https://spraakbanken.gu.se/verktyg">{{ $t('footer.otherplatforms') }}</a>
        </div>
      </template>
      <template v-if="$i18n.locale == 'en'">
        <div>
          <a href="https://spraakbanken.gu.se/en/about">{{ $t('footer.aboutus') }}</a>
        </div>
        <div>
          <a href="https://spraakbanken.gu.se/en/news-and-events">{{ $t('footer.newsfromus') }}</a>
        </div>
        <div>
          <a href="https://spraakbanken.gu.se/en/tools">{{ $t('footer.otherplatforms') }}</a>
        </div>
      </template>
    </div>
    <div class="footer-area-middle">
      <div>
        <template v-if="$i18n.locale == 'sv'">
          <a href="https://spraakbanken.gu.se/kontakt">{{ $t('footer.help') }}</a>
        </template>
        <template v-if="$i18n.locale == 'en'">
          <a href="https://spraakbanken.gu.se/en/contact">{{ $t('footer.help') }}</a>
        </template>
      </div>
    </div>
    <div class="footer-area-right">
      <div class="gu-box">
        <div v-if="$i18n.locale == 'sv'">
          <a href="https://gu.se/" target="_new">
            <img :src="logoGU" alt="Göteborgs universitet" width="124px" />
          </a>
        </div>
        <div v-else>
          <a href="https://gu.se/en" target="_new">
            <img :src="logoGUEn" alt="University of Gothenburg" width="124px" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.footer-area {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-right: 2rem;
  padding-left: 2rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1rem;
  background-color: var(--color-bg);
  box-sizing: border-box;
  width: 100%;
  border-top: 1px solid var(--color-background-alt2);
}

.footer-area-left {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: flex-start;
  color: white;
  flex: 1;
  padding: 0rem;
  box-sizing: border-box;
}

.footer-area-middle {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: white;
  flex: 1;
  padding: 0rem;
  box-sizing: border-box;
}

.footer-area-right {
  display: flex;
  justify-content: flex-end;
  color: white;
  flex: 1;
  padding: 0rem;
  box-sizing: border-box;
}

.footer-area a {
  color: var(--color-text);
  text-decoration: underline;
}

.footer-area .contact {
  color: var(--sb-orange);
  text-align: center;
}

.sb-box {
  box-sizing: border-box;
}

.sb-box img {
  width: 14rem;
}

.gu-box {
  box-sizing: border-box;
}

.gu-box img {
  box-sizing: border-box;
}

@media (max-width: 1000px) {
  .footer-area {
    flex-direction: column;
    align-items: center;
  }
  .middle-area,
  .right-area {
    align-items: center;
  }
}
</style>
