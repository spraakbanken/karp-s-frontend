<script setup lang="ts">
import { ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { getTableData } from '@/api/apiService'
import type { Dataset } from '@/types/datasetConfig'
import SubTableView from '@/components/SubTableView.vue'

const lexicalStorage = lexicalStore()

const currentResult = ref<Record<string, Dataset[]>>({})
const currentValues = ref<Dataset[]>([])

const fetchData = async () => {
  const newDatasets = lexicalStorage.selectedDatasets;
  if (newDatasets.length > 0) {
    try {
      const data = await getTableData('baseform');
      currentResult.value = data;
      // console.log('currentResult', currentResult.value);
      currentValues.value = newDatasets.flatMap((key) => currentResult.value[key] || []) as Dataset[];
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  } else {
    currentResult.value = {};
    currentValues.value = [];
  }
};

watch(
  () => [lexicalStorage.selectedDatasets, lexicalStorage.activeParameters],
  fetchData,
  { deep: true },
)

watch(() => lexicalStorage.activeTab, async (newTab) => {
  if (newTab === 'table') {
    await fetchData()
  }
})
</script>

<template>
  <div class="table-container" v-for="(dataset, index) in currentResult" :key="index">
    <SubTableView :data="dataset" :lexicalKey="index" />
  </div>
</template>

<style scoped>
.table-container {
  margin-bottom: 0rem;
}
</style>
