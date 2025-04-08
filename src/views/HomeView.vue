<script setup lang="ts">
import { lexicalStore } from '../stores/store'
import DataSelection from '@/components/DataSelection.vue'
import TableView from '@/components/TableView.vue'
import StatisticsView from '@/components/StatisticsView.vue'
import GraphView from '@/components/GraphView.vue'
import { onMounted, ref } from 'vue'
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
    syncStoreWithRouter(router)
  } catch (error) {
    console.error(error)
  }
})

const activeTab = ref(lexicalStorage.activeTab)

const setActiveTab = (tab: string) => {
  lexicalStorage.setActiveTab(tab)
  activeTab.value = tab
}
</script>

<template>
  <main class="container">
    <div class="column-left">
      <div class="dataselection-header">{{ $t('dataselector.heading') }}</div>
      <DataSelection />
    </div>
    <div class="column-right">
      <div class="tabs">
        <button :class="{ active: activeTab === 'table' }" @click="setActiveTab('table')">
          {{ $t('tab.tables') }}
        </button>
        <button :class="{ active: activeTab === 'statistics' }" @click="setActiveTab('statistics')">
          {{ $t('tab.statistics') }}
        </button>
        <button :class="{ active: activeTab === 'graph' }" @click="setActiveTab('graph')">
          {{ $t('tab.graph') }}
        </button>
      </div>
      <TableView v-if="activeTab === 'table'" />
      <StatisticsView v-if="activeTab === 'statistics'" />
      <GraphView v-if="activeTab === 'graph'" />
    </div>
  </main>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 0rem;
  padding: 0;
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

.dataselection-header {
  height: 2.5rem;
  padding-top: 0.5rem;
  padding-left: 1rem;
  background-color: var(--color-complement);
  font-size: medium;
  font-weight: bold;
}

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

.tabs button.active {
  background-color: none;
  font-weight: bold;
  background-color: white;
}
</style>
