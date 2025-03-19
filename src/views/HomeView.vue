<script setup lang="ts">
import { lexicalStore } from '../stores/store'
import DataSelection from '@/components/DataSelection.vue'
import TableView from '@/components/TableView.vue'
import StatisticsView from '@/components/StatisticsView.vue'
import GraphView from '@/components/GraphView.vue'
import { onMounted, ref } from 'vue'
// import { useRoute, useRouter } from 'vue-router'

import { getLexicalDatasets } from '@/api/apiService'

const lexicalStorage = lexicalStore()

onMounted(async () => {
  try {
    // console.log('fetching datasets')
    const datasets = await getLexicalDatasets()
    lexicalStorage.setDefault(datasets)
  } catch (error) {
    console.error(error)
  }
})

// const selectedDataset = computed(() => lexicalStorage.selectedDatasets)

const activeTab = ref(lexicalStorage.activeTab)

const setActiveTab = (tab: string) => {
  lexicalStorage.setActiveTab(tab)
  activeTab.value = tab
}

// const route = useRoute()
// const router = useRouter()
// onMounted(() => {
//   const dataset = route.query.lex as string
//   if (dataset) {
//     lexicalStorage.setSelectedDataset(dataset.split(','))
//   }
// })

// watch(lexicalStorage.datasetKeys, (newDataset) => {
//   if (newDataset.length === 0) {
//     router.push({ query: {} })
//   } else {
//     router.push({ query: { lex: newDataset.join(',') } })
//   }
// })
</script>

<template>
  <div class="tabs">
    <button :class="{ active: activeTab === 'table' }" @click="setActiveTab('table')">
      Tables
    </button>
    <button :class="{ active: activeTab === 'statistics' }" @click="setActiveTab('statistics')">
      Statistics
    </button>
    <!-- <button :class="{ active: activeTab === 'graph' }" @click="setActiveTab('graph')">
          Graph
        </button> -->
  </div>
  <main class="container">
    <div class="column-left">
      <DataSelection />
    </div>
    <div class="column-right">
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
  padding: 1rem;
}

.column-right {
  padding: 0rem 0;
}
.column-left:nth-child(1) {
  border-right: 2px solid var(--border-color);
}

.tabs {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0rem;
  border-bottom: 2px solid var(--border-color);
  padding-left: 1rem;
  padding-top: 0.5rem;
  background-color: chocolate;
}

.tabs button {
  padding: 0.5rem 1rem;
  margin: 0;
  border: none;
  /* border: 1px solid var(--border-color); */
  border-bottom: none;
  background-color: var(--button-bg-color);
  color: var(--button-text-color);
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
  color: var(--button-active-text-color);
  border-bottom: 2px solid white;
  font-weight: bold;
}
</style>
