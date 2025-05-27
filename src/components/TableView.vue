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

const isLoading = ref(false)

const fetchData = async () => {
  isLoading.value = true

  const newDatasets = lexicalStorage.selectedDatasets
  if (newDatasets.length > 0) {
    try {
      const data = await getTableData()
      isLoading.value = false
      currentResult.value = data
      currentValues.value = newDatasets.flatMap(
        (key) => currentResult.value[key] || [],
      ) as unknown as Dataset[]
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
    <!-- show no data -->
    <p v-if="lexicalStorage.selectedDatasets.length == 0">
      {{ $t('message.nodatasetselected') }}
    </p>
    <p v-else-if="isLoading" class="message">
      {{ $t('message.loading') }}
    </p>
    <p v-else-if="Object.keys(currentResult).length == 0">
      {{ $t('error.nodata') }}
    </p>

    <!-- show table -->
    <div v-else>
      <div class="table-container" v-for="(dataset, index) in currentResult" :key="index">
        <SubTableView
          :data="currentResult[index].entries"
          :dataset="index"
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
