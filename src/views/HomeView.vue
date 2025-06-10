<script setup lang="ts">
import { lexicalStore } from '../stores/store'
import DataSearch from '@/components/DataSearch.vue'
import TableView from '@/components/TableView.vue'
import StatisticsView from '@/components/StatisticsView.vue'
// import GraphView from '@/components/GraphView.vue'
import { onMounted, ref, watch } from 'vue'
// import { useRoute, useRouter } from 'vue-router'

import { getLexicalDatasets } from '@/api/apiService'

import router from '@/router'
import { syncStoreWithRouter } from '@/router/syncStoreWithRouter'

const lexicalStorage = lexicalStore()

onMounted(async () => {
  try {
    console.log('--HomeView/onMounted()')
    const datasets = await getLexicalDatasets()
    lexicalStorage.setDefault(datasets)
    console.log('--HomeView/onMounted() prep to sync')
    syncStoreWithRouter(router)
  } catch (error) {
    console.error(error)
  }
})

const activeSearchTab = ref(lexicalStorage.activeSearchTab)
const setActiveSearchTab = (tab: string) => {
  lexicalStorage.setActiveSearchTab(tab)
  activeSearchTab.value = tab
}

const activeResultTab = ref(lexicalStorage.activeResultTab)
const setActiveResultTab = (tab: string) => {
  lexicalStorage.setActiveResultTab(tab)
  activeResultTab.value = tab
}

watch(
  () => lexicalStorage.activeResultTab,
  (newTab) => {
    activeResultTab.value = newTab
  },
)
</script>

<template>
  <main class="container">
    <!-- <div class="datasearch-header">{{ $t('dataselector.datasearch') }}</div>-->
    <div class="searchTabs">
      <button
        :class="{ active: activeSearchTab === 'simple' }"
        @click="setActiveSearchTab('simple')"
      >
        {{ $t('tab.search.simple') }}
      </button>
      <button
        :class="{ active: activeSearchTab === 'extended' }"
        @click="setActiveSearchTab('extended')"
      >
        {{ $t('tab.search.extended') }}
      </button>
    </div>
    <DataSearch :searchExtended="activeSearchTab === 'extended'" />
    <div class="tabs">
      <button :class="{ active: activeResultTab === 'table' }" @click="setActiveResultTab('table')">
        {{ $t('tab.tables') }}
      </button>
      <button
        :class="{ active: activeResultTab === 'statistics' }"
        @click="setActiveResultTab('statistics')"
      >
        {{ $t('tab.statistics') }}
      </button>
    </div>
    <TableView v-if="activeResultTab === 'table'" />
    <StatisticsView v-if="activeResultTab === 'statistics'" />
  </main>
</template>

<style scoped>
.container {
  padding: 0;
}

.container .search {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.column-left {
  padding: 0%;
}

.column-right {
  padding: 0rem 0;
}
.column-left:nth-child(1) {
  border-right: 2px solid var(--border-color);
}

.datasearch-header {
  height: 2.5rem;
  padding-top: 0.5rem;
  padding-left: 1rem;
  background-color: var(--color-complement);
  font-size: medium;
  font-weight: bold;
}

.searchTabs,
.tabs {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0rem;
  /*border-bottom: 2px solid var(--border-color);*/
  padding-left: 1rem;
  padding-top: 0.5rem;
  background-color: var(--color-complement);
  height: 2.5rem;
}

.searchTabs button,
.tabs button {
  padding: 0.5rem 1rem;
  margin: 0;
  border: none;
  border: 1px solid white;
  border-bottom: none;
  background-color: var(--color-complement);
  cursor: pointer;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  font-size: var(--font-size);
  font-weight: bold;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.searchTabs button.active,
.tabs button.active {
  background-color: none;
  font-weight: bold;
  background-color: white;
}
</style>
