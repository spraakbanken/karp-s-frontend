<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { lexicalStore } from './stores/store'

onMounted(() => {
  document.documentElement.lang = lexicalStore().activeLocale
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
