<script setup lang="ts">
//import { computed, ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { secondsToDate } from '@/utils/utils'

const lexicalStorage = lexicalStore()
</script>

<template>
  <div v-for="(value, index) in lexicalStorage.datasetDates" :key="index" class="latest-box">
    <div v-if="index < 5" class="latest-row">
      <a :href="value.resourceUrl" target="_blank">
        <img src="@/assets/sb_symbol_info.svg" class="datasets-icon" />
      </a>
      <a :href="'/karplabb/?resources=' + value.resourceId"
        ><span class="latest-label">{{ value.label }}</span>
      </a>
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

.datasets-icon {
  height: 18px;
  width: 2rem;
  vertical-align: text-bottom;
}
</style>
