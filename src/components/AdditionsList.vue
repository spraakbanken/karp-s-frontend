<script setup lang="ts">
import { computed, ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { secondsToDate } from '@/utils/utils'

const lexicalStorage = lexicalStore()
</script>

<template>
  {{ console.log(lexicalStorage.datasetDates.length) }}
  <div v-for="(value, index) in lexicalStorage.datasetDates" :key="index" class="latest-box">
    {{ console.log('latest: ', value, index) }}

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
