<script setup lang="ts">
import { onMounted, ref } from 'vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import sprakbankenLogo from '@/assets/sprakbanken_text_light_theme.svg'

const { t } = useI18n()

const imgBrowserURL = ref('')

const pageNumber = ref<number | null>(null)

onMounted(() => {
  const query = new URLSearchParams(window.location.search)
  imgBrowserURL.value = query.get('img') || ''
  //console.log('ImgView q:', query)
})

function replacePageNumber(filename: string, newPageNumber: number) {
  return filename.replace(/_(\d+)\./, (_, digits) => {
    const padded = String(newPageNumber).padStart(digits.length, '0')
    return `_${padded}.`
  })
}

const handleClick = async () => {
  if (pageNumber.value !== null) {
    // Use the numeric value here
    const next = replacePageNumber(imgBrowserURL.value, pageNumber.value)
    if (await checkImageExists(next)) {
      imgBrowserURL.value = next
      router.push({ query: { img: imgBrowserURL.value } })
    }
  }
}

const nextImg = async () => {
  let newNum = ''
  const next = imgBrowserURL.value.replace(
    /(\D+)(\d+)(\.(png|jpg))$/,
    (match, prefix, num, suffix) => {
      //  const next = imgBrowserURL.value.replace(/(\D+)(\d+)(\.png)$/, (match, prefix, num, suffix) => {
      newNum = String(Number(num) + 1).padStart(num.length, '0')
      return prefix + newNum + suffix
    },
  )

  if (await checkImageExists(next)) {
    pageNumber.value = Number(newNum)
    imgBrowserURL.value = next
    router.push({ query: { img: imgBrowserURL.value } })
  }
}

const prevImg = async () => {
  let newNum = ''
  const prev = imgBrowserURL.value.replace(
    /(\D+)(\d+)(\.(png|jpg))$/,
    (match, prefix, num, suffix) => {
      newNum = String(Number(num) - 1).padStart(num.length, '0')
      return prefix + newNum + suffix
    },
  )

  if (await checkImageExists(prev)) {
    pageNumber.value = Number(newNum)
    imgBrowserURL.value = prev
    router.push({ query: { img: imgBrowserURL.value } })
  }
}

const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}
</script>

<template>
  <div class="imgbrowser-wrapper">
    <div class="imgbrowser-header">
      <div class="imgbrowser-filename">
        {{ imgBrowserURL.split('/').pop() }}
      </div>
      <div class="imgbrowser-page">
        <button class="imgbrowser-btn" @click="prevImg">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
        </button>
        &nbsp;
        <button class="imgbrowser-btn" @click="nextImg">
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </button>
        <span class="imgbrowser-pagenumber">
          <input
            type="number"
            v-model.number="pageNumber"
            :placeholder="t('table.imgbrowse.placeholder')"
            @keyup.enter="handleClick"
          />
          <button @click="handleClick">{{ t('table.imgbrowse.submit') }}</button>
        </span>
      </div>
    </div>
    <div class="imgbrowser-image">
      <img :src="imgBrowserURL" :alt="imgBrowserURL" />
    </div>
    <div class="imgbrowser-footer">
      <a href="https://sprakbanken.se/" target="_new">
        <img :src="sprakbankenLogo" alt="Språkbanken Text" />
      </a>
    </div>
  </div>
</template>

<style scoped>
.imgbrowser-wrapper {
  width: 100%;
  background-color: var(--sb-grey-light);
  display: flex;
  flex-direction: column;
}

.imgbrowser-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
}

.imgbrowser-filename {
  font-family: Arial, Helvetica, sans-serif;
  font-size: medium;
  color: black;
  margin-bottom: 0.5rem;
}

.imgbrowser-page {
  display: flex;
  align-items: center;
}

.imgbrowser-pagenumber input {
  margin-right: 0.5rem;
  margin-left: 0.5rem;
}

.imgbrowser-btn,
.imgbrowser-pagenumber button {
  cursor: pointer;
  padding: 1 0.25rem 1 0.25rem;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 1px solid var(--sb-orange);
  font-weight: bold;
}

.imgbrowser-image {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

@media (min-width: 768px) {
  .imgbrowser-image {
    justify-content: center; /* Center on larger screens */
  }
}

img {
  max-width: 100%;
  height: auto;
}

.imgbrowser-footer {
  align-self: center;
  padding: 1rem;
}
</style>
