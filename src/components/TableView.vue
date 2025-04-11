<script setup lang="ts">
import { ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { getTableData } from '@/api/apiService'
import type { Dataset } from '@/types/datasetConfig'
import SubTableView from '@/components/SubTableView.vue'

const lexicalStorage = lexicalStore()

const currentResult = ref<Record<string, { entries: Dataset[]; total: number }>>({})
const currentValues = ref<Dataset[]>([])
const currentTab = ref(lexicalStorage.activeTab)
const picBar = ref<string>('')
const picBars = ref<number[]>([])

const fetchData = async () => {
  const newDatasets = lexicalStorage.selectedDatasets
  if (newDatasets.length > 0) {
    try {
      const data = await getTableData()
      currentResult.value = data
      //console.log('data=', data)
      currentValues.value = newDatasets.flatMap(
        (key) => currentResult.value[key] || [],
      ) as Dataset[]
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  } else {
    currentResult.value = {}
    currentValues.value = []
  }
  // console.log('FETCHDATA', currentResult.value, Object.keys(currentResult).length)
}

watch(() => [lexicalStorage.selectedDatasets, lexicalStorage.selectedParameters], fetchData, {
  deep: true,
})

watch(
  () => currentTab.value,
  () => {
    if (currentTab.value === 'table') {
      fetchData()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="table-wrapper">
    <div v-if="Object.keys(currentResult).length > 0">
      <div class="table-container" v-for="(dataset, index) in currentResult" :key="index">
        <SubTableView
          :data="currentResult[index].entries"
          :lexicalKey="index"
          :totalHits="currentResult[index].total"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-wrapper {
  display: grid;
  position: relative;
  /* margin-top: 2rem; */
  padding: 1rem;
}

.table-container {
  margin-bottom: 0rem;
}
.message {
  margin: 0.5rem;
}
</style>
