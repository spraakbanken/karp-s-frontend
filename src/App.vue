<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { lexicalStore } from '@/stores/store'

import { RouterView } from 'vue-router'
import router from '@/router'

import TitleBar from './components/TitleBar.vue'
import FooterView from './components/FooterView.vue'
import { getLexicalDatasets } from '@/api/apiService'
import { syncStoreWithRouter, SyncResult } from '@/router/syncStoreWithRouter'

const lexicalStorage = lexicalStore()
const syncResult = ref<SyncResult>(SyncResult.SYNC_RESULT_NOT_SYNCED)

onMounted(async () => {
  // does user prefer dark mode?
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (mediaQuery.matches) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  // read config
  try {
    const datasets = await getLexicalDatasets()
    lexicalStorage.setDefault(datasets)
    syncResult.value = syncStoreWithRouter(router)
    //console.log('syncResult:', syncResult.value)
    if (syncResult.value === SyncResult.SYNC_RESULT_SYNCED) {
      lexicalStorage.setIsStart(false)
      //TODO lexicalStorage.setIsSearch(true)
    } else if (syncResult.value === SyncResult.SYNC_RESULT_DATASET_UNKNOWN) {
      lexicalStorage.setDefault(datasets)
    }
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div class="wrapper">
    <header>
      <TitleBar />
    </header>
    <div
      v-if="syncResult === SyncResult.SYNC_RESULT_DATASET_UNKNOWN && lexicalStorage.isStart"
      class="message-error"
    >
      {{ $t('url.dataset.unknown') }}
    </div>
    <div class="main">
      <RouterView />
    </div>
    <footer class="footer">
      <FooterView />
    </footer>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}

header {
  line-height: 1.5;
  max-height: 100vh;
  /*width: 100vw;*/
  /* border-bottom: 2px solid var(--border-color); */
}

footer {
  height: 150px;
}

.main {
  flex: 1;
}
/*
@media (max-width: 1024px) {
  .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: nowrap;
    place-items: left;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
  */
</style>
