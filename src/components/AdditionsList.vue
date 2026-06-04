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
    <div v-if="index < 10" class="latest-row">
      <button class="button" @click="clickResourceInfo(value.resourceUrl)">
        {{ $t('additions.button.info') }}
      </button>
      <button class="button" @click="clickResourceSearch(value.resourceId)">
        {{ $t('additions.button.search') }}
      </button>
      <span class="latest-label">{{ value.label }}</span>
      <!-- show locked status -->
      <span v-if="value.limitedAccess" :title="$t('datasets.icon.limitedaccess')">
        <span
          v-if="lexicalStorage.grantedDatasets.includes(value.resourceId)"
          class="datasets-icon-status"
        >
          <font-awesome-icon :icon="['fas', 'lock-open']" />
        </span>
        <span v-else class="datasets-icon-status">
          <font-awesome-icon :icon="['fas', 'lock']" />
        </span>
      </span>
      <!-- show protected metadata status (Mink private resources) -->
      <span v-if="value.protectedMetadata" :title="$t('datasets.icon.protectedmetadata')">
        <font-awesome-icon :icon="['fas', 'user-lock']" />
      </span>

      <span class="latest-date">{{ secondsToDate(value.updated) }}</span>
    </div>
  </div>
</template>

<style scoped>
.latest-box {
}

.latest-row button {
  margin-right: 0.2rem;
  margin-bottom: 0.5rem;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 1px solid var(--sb-orange);
  cursor: pointer;
  font-weight: bold;
}

.latest-row button:hover {
  background-color: var(--button-action-bg-hover-color);
  color: var(--button-action-text-hover-color);
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
