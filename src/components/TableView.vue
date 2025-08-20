<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { getTableData } from '@/api/apiService'
import type { Dataset } from '@/types/datasetConfig'
import SubTableView from '@/components/SubTableView.vue'
//import type { forEach } from 'es-toolkit/compat'

const lexicalStorage = lexicalStore()

const currentResult = ref<Record<string, { entries: Dataset[]; total: number }>>({})
const currentValues = ref<Dataset[]>([])
const currentTab = ref(lexicalStorage.activeResultTab)
const isLoading = ref(false)

const fetchData = async () => {
  console.log('fetchData()', lexicalStorage.selectedFields)
  lexicalStorage.setIsData(false)
  const newDatasets = lexicalStorage.selectedDatasets
  if (newDatasets.length > 0) {
    try {
      isLoading.value = true
      const data = await getTableData()
      isLoading.value = false
      currentResult.value = data
      currentValues.value = newDatasets.flatMap(
        (key) => currentResult.value[key] || [],
      ) as unknown as Dataset[]
      // did we get any results?
      Object.entries(currentResult.value).forEach(([key, value]) => {
        if (value.total > 0) {
          lexicalStorage.setIsData(true)
        }
      })
      if (lexicalStorage.isStart) {
        lexicalStorage.setIsStart(false)
      }
    } catch (error) {
      isLoading.value = false
      console.error('Error fetching data:', error)
    }
  } else {
    currentResult.value = {}
    currentValues.value = []
  }
}

watch(
  () => lexicalStorage.isData,
  (newIsData) => {
    if (!newIsData) {
      currentResult.value = {}
      currentValues.value = []
    }
  },
)

watch(
  () => lexicalStorage.selectedDatasets,
  (newDatasets) => {
    if (newDatasets.length === 0) {
      currentResult.value = {}
      currentValues.value = []
    }
  },
)
watch(
  () => currentTab.value,
  () => {
    if (currentTab.value === 'table') {
      fetchData()
    }
  },
  { immediate: true },
)

/*
const listLimit = computed({
  get: () => lexicalStorage.listLimit,
  set: (value) => lexicalStorage.setListLimit(value),
})
*/

watch(
  () => [lexicalStorage.isSearch],
  () => {
    console.log('Watch isSearch!')

    if (lexicalStorage.isSearch) {
      lexicalStorage.setIsSearch(false)
      //setTimeout(function () {
      fetchData()
      //}, 1000)
    }
  },
)

/*
watch(
  () => [lexicalStorage.selectedDatasets, lexicalStorage.selectedFields],
  () => {
    console.log('Watch lexical!')
    fetchData()
  },
  {
    deep: true,
  },
)
*/
</script>

<template>
  <div class="table-wrapper">
    <p v-if="isLoading" class="message">
      {{ $t('message.loading') }}
    </p>
    <!-- show no data -->
    <!--  <p v-if="lexicalStorage.selectedDatasets.length == 0">
      {{ $t('message.nodatasetselected') }}
    </p>
    -->
    <!-- show table -->
    <div v-if="lexicalStorage.isData">
      <!--
      <div class="graph-parameter">
        {{ $t('dataselector.list.limit') }}:
        <input type="number" size="5" min="1" v-model="listLimit" @change="fetchData" />
      </div>
      -->
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
  padding-left: 0.5rem;
  padding-top: 0.5rem;
}

.table-container {
  margin-bottom: 0rem;
}

.graph-parameter {
  margin-top: 0.5rem;
  margin-left: 0.5rem;
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

.message {
  margin: auto;
}
</style>
