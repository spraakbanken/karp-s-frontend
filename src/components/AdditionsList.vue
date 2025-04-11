<script setup lang="ts">
import { computed } from 'vue'
import { lexicalStore } from '@/stores/store'

const lexicalStorage = lexicalStore()
const datasetDates = computed(() => lexicalStorage.datasetDates)

const secondsToDate = (seconds: string): string => {
  const date = new Date(parseInt(seconds) * 1000)
  return date.toISOString().substring(0, 10)
}
</script>

<template>
  <div v-for="(value, index) in datasetDates" :key="index" class="latest-box">
    <div v-if="index < 5" class="latest-row">
      <span class="latest-label">{{ value.label }}</span>
      <span class="latest-date">{{ secondsToDate(value.updated) }}</span>
    </div>
  </div>
</template>

<style scoped>
.latest-box {
}
.latest-row {
}
.latest-label {
  font-weight: normal;
}
.latest-date {
  float: right;
}
</style>
