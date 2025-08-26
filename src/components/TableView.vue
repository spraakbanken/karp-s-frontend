<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { getTableData } from '@/api/apiService'
import {
  type DatasetResult,
  type Dataset,
  type DatasetEntry,
  type DatasetResultGrp,
  type Entry,
} from '@/types/datasetConfig'
import { useI18n } from 'vue-i18n'
import MaxHeight from '@/components/MaxHeight.vue'
//import { template } from 'es-toolkit/compat'
import { groupBy } from 'es-toolkit'

//import SubTableView from '@/components/SubTableView.vue'
//import type { forEach } from 'es-toolkit/compat'
const { t } = useI18n()

const lexicalStorage = lexicalStore()

const currentResult = ref<DatasetResult>({
  hits: [],
  resourceHits: {},
  resourceOrder: {},
  total: 0,
})
// currentResult as returned from groupBy()
const currentResultGrp = ref<Record<string, { entry: Entry; resourceId: string }[]>>({})

//const currentValues = ref<Dataset[]>([])
const currentTab = ref(lexicalStorage.activeResultTab)
const isLoading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)

/*
type currentResFunc = {
  (res_id: string): string
  current_res_id: string
}
const currentRes = <currentResFunc>((res_id: string) => {
  if (typeof currentRes.current_res_id == 'undefined') {
    currentRes.current_res_id = ''
  }
  if (res_id != currentRes.current_res_id) {
    currentRes.current_res_id = res_id
    return res_id
  } else {
    return ''
  }
})
*/
const fetchData = async () => {
  console.log('fetchData()', lexicalStorage.selectedFields)
  lexicalStorage.setIsData(false)
  const newDatasets = lexicalStorage.selectedDatasets
  if (newDatasets.length > 0) {
    try {
      isLoading.value = true
      const data = await getTableData(currentPage.value, itemsPerPage.value)
      console.log('fetchdata() - after getTableData()', data)
      isLoading.value = false
      currentResult.value = data
      currentResultGrp.value = groupBy(currentResult.value.hits, (item) => item.resourceId)
      console.log('GroupBy:', currentResultGrp.value)
      /*
      currentValues.value = newDatasets.flatMap(
        (key) => currentResult.value[key] || [],
      ) as unknown as Dataset[]
      // did we get any results?
      Object.entries(currentResult.value).forEach(([key, value]) => {
        if (value.total > 0) {
          lexicalStorage.setIsData(true)
        }
      })
        */
      lexicalStorage.setIsData(currentResult.value.total > 0)
      if (lexicalStorage.isStart) {
        lexicalStorage.setIsStart(false)
      }
    } catch (error) {
      isLoading.value = false
      console.error('Error fetching data:', error)
    }
  } else {
    currentResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
    //currentValues.value = []
  }
}

watch(
  () => [currentPage.value, itemsPerPage.value],
  ([newPage, newItemsPerPage]) => {
    //const end = newPage * newItemsPerPage
    //itemsPerPage.value = newItemsPerPage
    // if (end > 10) {
    fetchData()
    // }
  },
  { immediate: true },
)

watch(
  () => lexicalStorage.isData,
  (newIsData) => {
    if (!newIsData) {
      currentResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
      //currentValues.value = []
    }
  },
)

watch(
  () => lexicalStorage.selectedDatasets,
  (newDatasets) => {
    if (newDatasets.length === 0) {
      currentResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
      //currentValues.value = []
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

const picsbar = (ds: string) => {
  // ds = name of dataset
  // look up ds in currentResult.resourceHits
  // add count until found
  // so we should go to page: count / itemsPerPage.value
  let hitCount: number = 0
  /*
  for (const key in currentResult.value.resourceHits) {
    if (key === ds) {
      break
    } else {
      hitCount += currentResult.value.resourceHits[key]
    }
  }
    */
  for (const index in currentResult.value.resourceOrder) {
    if (currentResult.value.resourceOrder[index] === ds) {
      break
    } else {
      hitCount += currentResult.value.resourceHits[currentResult.value.resourceOrder[index]]
    }
  }
  currentPage.value = Math.floor(hitCount / itemsPerPage.value) + 1
  console.log('Page: ', currentPage.value)
}

const totalPages = computed(() => {
  return Math.ceil(currentResult.value.total / itemsPerPage.value)
})

const firstPage = () => {
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const lastPage = () => {
  currentPage.value = totalPages.value
}
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
      <!--
      <div class="table-container" v-for="(dataset, index) in currentResult" :key="index">
        <TableView
          :data="currentResult[index].entries"
          :dataset="index"
          :totalHits="currentResult[index].total"
        />
      </div>
      -->

      <!-- picsbar -->
      <table class="picsbar">
        <tbody>
          <tr>
            <td
              class="picsbar-tooltip"
              v-for="(value, key) in currentResult.resourceOrder"
              :style="{ width: currentResult.resourceHits[value] / currentResult.total + '%' }"
              :key="key"
              @click="picsbar(value)"
            >
              {{ lexicalStorage.datasetLabels[value] }}
              <span class="picsbar-tooltiptext"
                >{{ lexicalStorage.datasetLabels[value] }}:
                {{ currentResult.resourceHits[value] }}</span
              >
            </td>
          </tr>
        </tbody>
      </table>

      <!-- table -->
      <table v-if="currentResult.total > 0" class="fancy-table">
        <thead>
          <tr>
            <th
              v-for="(value, key) in currentResult.hits[0].entry"
              :key="key"
              :class="{
                'header-list': lexicalStorage.isList(key as string),
              }"
            >
              <div class="header-content">
                <span
                  :class="{
                    'header-list-text': lexicalStorage.isList(key as string),
                  }"
                  >{{ lexicalStorage.localizeParam(key as string) }}
                  {{
                    lexicalStorage.isList(key as string) ? '(' + t('table.header.list') + ')' : ''
                  }}</span
                >
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <!--
          <tr v-for="(entry, index) in currentResult.hits" :key="index">
            <td v-if="currentRes(entry.resourceId)">{{ entry.resourceId }}</td>
            <td v-for="(value, key) in entry.entry" :key="key">
              <MaxHeight :max-height="200">
                <span v-html="lexicalStorage.formatCell(value)"></span>
              </MaxHeight>
            </td>
          </tr>
          -->
          <template v-for="(item, key, index) in currentResultGrp" :key="index">
            <!-- show dataset name -->
            <tr>
              <td colspan="100%" class="dataset-label">
                {{ lexicalStorage.datasetLabels[key] }}
              </td>
            </tr>
            <!-- show dataset entries -->
            <template v-for="(value1, key) in item" :key="key">
              <tr>
                <td v-for="(value2, key) in value1.entry" :key="key">
                  <MaxHeight :max-height="200">
                    <span v-html="lexicalStorage.formatCell(value2)"></span>
                  </MaxHeight>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      <div class="pagination">
        <!--<div v-if="props.data.length" class="pagination">-->
        <button @click="firstPage" :disabled="currentPage === 1">
          <i class="material-icons">first_page</i>
        </button>
        <button @click="prevPage" :disabled="currentPage === 1">
          <i class="material-icons">chevron_left</i>
        </button>
        <span style="color: var(--color-text)"
          >{{ currentPage }} {{ $t('table.of') }} {{ totalPages }}</span
        >
        <button @click="nextPage" :disabled="currentPage === totalPages">
          <i class="material-icons">chevron_right</i>
        </button>
        <button @click="lastPage" :disabled="currentPage === totalPages">
          <i class="material-icons">last_page</i>
        </button>
        <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }}</label>
        <select id="itemsPerPage" v-model="itemsPerPage" class="items-per-page">
          <option v-for="option in [10, 20, 50, 100]" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
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

/* picsbar */
.picsbar tr {
  height: 16px;
}
.picsbar td {
  text-align: center;
}
.picsbar td:nth-child(even) {
  background-color: var(--table-row-even-bg);
}

.picsbar td:nth-child(odd) {
  background-color: var(--table-row-odd-bg);
}

.picsbar-tooltip {
  position: relative;
}

.picsbar-tooltip .picsbar-tooltiptext {
  width: 120px;
  bottom: 100%;
  left: 50%;
  margin-left: -60px; /* Use half of the width (120/2 = 60), to center the tooltip */

  visibility: hidden;
  background-color: var(--sb-orange);
  color: #fff;
  text-align: center;
  font-weight: bold;
  border-radius: 6px;
  padding: 5px 0;
  /* Position the tooltip */
  position: absolute;
  z-index: 1;
}

.picsbar-tooltip .picsbar-tooltiptext::after {
  content: ' ';
  position: absolute;
  top: 100%; /* At the bottom of the tooltip */
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--sb-orange) transparent transparent transparent;
}

.picsbar-tooltip:hover .picsbar-tooltiptext {
  visibility: visible;
}

/* table */

.fancy-table {
  border-collapse: collapse;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  margin: 0 0 0 0;
  text-align: left;
  width: 100%;
}

th,
td {
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border: 1px solid var(--color-border);
}

th {
  background-color: var(--table-head-bg);
  color: var(--color-heading);
  font-weight: bold;
  cursor: pointer;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content span {
  display: flex;
  align-items: center;
}

tr {
  vertical-align: top;
}

tr:nth-child(even) {
  background-color: var(--table-row-even-bg);
}

tr:nth-child(odd) {
  background-color: var(--table-row-odd-bg);
}

tr:hover {
  background-color: var(--color-border-hover);
}

.dataset-label {
  text-align: center;
  background-color: var(--sb-grey-dark);
  color: white;
  font-weight: bold;
}

.header-list {
  font-style: italic;
  background-color: var(--sb-grey-light);
  color: black;
}

/* pagination */

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: var(--table-head-bg);
  color: var(--color-heading);
  font-weight: bold;
  border: 1px solid var(--color-border);
  border-bottom: none;
  border-radius: 0 0 4px 4px;
}

.pagination button,
.pagination span,
.pagination select {
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  border: none;
  background-color: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button:disabled {
  background-color: transparent;
  color: #ccc;
  cursor: not-allowed;
}

.pagination span {
  margin: 0 0.5rem;
  background-color: transparent;
  color: black;
}

.pagination select {
  background-color: white;
  color: black;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding-right: 2rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.pagination-controls label {
  margin-right: 0.5rem;
}
</style>
