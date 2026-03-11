<script setup lang="ts">
import { onMounted, ref } from 'vue'
import router from '@/router'

const imgBrowserURL = ref('')

onMounted(() => {
  const query = new URLSearchParams(window.location.search)
  imgBrowserURL.value = query.get('img') || ''
  //console.log('ImgView q:', query)
})

const nextImg = async () => {
  const next = imgBrowserURL.value.replace(/(\D+)(\d+)(\.png)$/, (match, prefix, num, suffix) => {
    const newNum = String(Number(num) + 1).padStart(num.length, '0')
    return prefix + newNum + suffix
  })

  if (await checkImageExists(next)) {
    imgBrowserURL.value = next
    router.push({ query: { img: imgBrowserURL.value } })
  }
}

const prevImg = async () => {
  const prev = imgBrowserURL.value.replace(/(\D+)(\d+)(\.png)$/, (match, prefix, num, suffix) => {
    const newNum = String(Number(num) - 1).padStart(num.length, '0')
    return prefix + newNum + suffix
  })

  if (await checkImageExists(prev)) {
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
    <div class="imgbrowser-content">
      <div class="imgbrowser-header">
        <div class="imgbrowser-filename">
          {{ imgBrowserURL.split('/').pop() }}
        </div>
        <div>
          <button class="imgbrowser-btn material-icons" @click="prevImg">navigate_before</button>
          &nbsp;
          <button class="imgbrowser-btn material-icons" @click="nextImg">navigate_next</button>
        </div>
      </div>
      <div class="imgbrowser-image">
        <img :src="imgBrowserURL" :alt="imgBrowserURL" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.imgbrowser-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #666;
}

.imgbrowser-content {
  background-color: #eee;
  border: 1px solid black;
}

.imgbrowser-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  background-color: #eee;
}

.imgbrowser-filename {
  font-family: Arial, Helvetica, sans-serif;
  font-size: medium;
  color: black;
  margin-bottom: 0.5rem;
}

.imgbrowser-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.imgbrowser-btn {
  background: none;
  border-radius: 0.5rem;
  border: 1px solid black;
  font-size: 28px;
  cursor: pointer;
  color: #666;
}
</style>
