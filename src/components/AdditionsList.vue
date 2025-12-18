<script setup lang="ts">
//import { computed, ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { secondsToDate } from '@/utils/utils'

const lexicalStorage = lexicalStore()

// open window at url link for given resourceId (ds)
const clickResourceSearch = (ds: string) => {
  const url = '/karplabb/?resources=' + ds
  window.open(url, '_self')
}
const clickResourceInfo = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div v-for="(value, index) in lexicalStorage.datasetDates" :key="index" class="latest-box">
    <div v-if="index < 5" class="latest-row">
      <button class="button" @click="clickResourceInfo(value.resourceUrl)">
        {{ $t('additions.button.info') }}
      </button>
      <button class="button" @click="clickResourceSearch(value.resourceId)">
        {{ $t('additions.button.search') }}
      </button>
      <!--
      <a :href="value.resourceUrl" target="_blank">
        <img src="@/assets/sb_symbol_info.svg" class="datasets-icon" />
      </a>
      <a :href="'/karplabb/?resources=' + value.resourceId"
        >
      </a>
      -->
      <span class="latest-label">{{ value.label }}</span>
      <span class="latest-date">{{ secondsToDate(value.updated) }}</span>
    </div>
  </div>
</template>

<style scoped>
.latest-box {
}

.latest-row button {
  margin-right: 0.5rem;
  background-color: var(--color-infocontrol-button-bg);
  color: var(--color-infocontrol-button-text);
  border-radius: 4px;
  border: 0;
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
