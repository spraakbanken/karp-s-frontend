<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { Dataset } from '@/types/datasetConfig'
import { getStatisticsData } from '@/api/apiService'
import type { paramConfig } from '@/types/parameterPosition'

const lexicalStorage = lexicalStore()

const currentResult = ref<Dataset[]>([])
const tableHeaders = ref<string[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentTab = ref(lexicalStorage.activeTab)

const isDropdownColumns = ref(false)
const isDropdownCompileParams = ref(false)

const toggleDropdownColumns = () => {
  isDropdownColumns.value = !isDropdownColumns.value
  //  isDropdownOpen.value = false
  //  isDropdownParams.value = false
  isDropdownCompileParams.value = false
}

const toggleDropdownCompileParams = () => {
  isDropdownCompileParams.value = !isDropdownCompileParams.value
  //  isDropdownOpen.value = false
  //  isDropdownParams.value = false
  isDropdownColumns.value = false
}

const selectedDatasets = computed({
  get: () => lexicalStorage.selectedDatasets,
  set: (value) => lexicalStorage.setSelectedDataset(value),
})

const selectedCompileParams = computed({
  get: () => lexicalStorage.selectedCompileParams,
  set: (value) => lexicalStorage.setSelectedCompileParams(value),
})
const selectedColumns = computed({
  get: () => lexicalStorage.selectedColumns,
  set: (value) => lexicalStorage.setSelectedColumns(value),
})

const currentParams = computed(() => lexicalStorage.currentParameters)

// update state from URL
const updateColumns = () => {
  lexicalStorage.setSelectedColumns(selectedColumns.value)
}

// update state from URL
const updateCompileParams = () => {
  lexicalStorage.setSelectedCompileParams(selectedCompileParams.value)
}

const fetchDataLoaded = ref(false)

const fetchData = async () => {
  const newParams = lexicalStorage.selectedParameters
  const newCompileParams = lexicalStorage.selectedCompileParams
  const newColumns = lexicalStorage.selectedColumns
  console.log(newParams, newCompileParams, newColumns)
  if (newParams && newCompileParams.length > 0) {
    try {
      const { tableData, headers } = await getStatisticsData(
        newParams as Record<string, paramConfig>,
        newCompileParams as string[],
        newColumns as string[],
      )
      fetchDataLoaded.value = true
      currentResult.value = tableData
      tableHeaders.value = headers
      // console.log('currentResult', currentResult.value);
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  } else {
    currentResult.value = []
  }
}

watch(
  () => currentTab.value,
  () => {
    if (currentTab.value === 'statistics') {
      fetchData()
    }
  },
  { immediate: true },
)

watch(
  () => [
    lexicalStorage.selectedDatasets,
    lexicalStorage.selectedParameters,
    lexicalStorage.selectedCompileParams,
    lexicalStorage.selectedColumns,
  ],
  () => {
    fetchData()
  },
  { deep: true },
)

const sortedData = computed(() => {
  if (!sortKey.value) return currentResult.value

  return [...currentResult.value].sort((a, b) => {
    const aValue = a[sortKey.value]
    const bValue = b[sortKey.value]

    if (aValue === bValue) return 0

    const order = sortOrder.value === 'asc' ? 1 : -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * order
    }

    return (aValue as unknown as number) > (bValue as unknown as number) ? order : -order
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(currentResult.value.length / itemsPerPage.value)
})

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

const firstPage = () => {
  currentPage.value = 1
}

const lastPage = () => {
  currentPage.value = totalPages.value
}

const sortTable = (key: string) => {
  // console.log(key)
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

/*
  Export current statistics to CSV with header
*/
const exportCSV = () => {
  let csv = ''

  // write headers
  //  for (const title in currentResult.value[0]) {
  console.log()
  for (const key in tableHeaders.value) {
    csv += tableHeaders.value[key] + ','
  }
  csv += '\n'

  // find out which columns are collections (lists of values)
  const collectionColumn = []
  for (const key of lexicalStorage.currentParameters) {
    if (key.collection) {
      collectionColumn.push(key.name)
    }
  }
  console.log('CSV cc', collectionColumn, tableHeaders.value)

  // write data
  for (const row in currentResult.value) {
    const value = currentResult.value[row]
    // value could be array
    //console.log('CurrP', lexicalStorage.currentParameters)
    for (const key in value) {
      console.log('CSV type', key, value[key], Object.keys(tableHeaders.value)[key])
      if (collectionColumn.includes(tableHeaders.value[key])) {
        csv += value[key].replace('"', '').replace('[', '').replace(']', '').replace(',', ';') + ','
      } else {
        csv += value[key] + ','
      }
    }
    csv += '\n'
  }
  console.log('CSV =', csv)
  // save as file
  const anchor = document.createElement('a')
  anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  anchor.target = '_blank'
  anchor.download = 'karp-s-export.csv'
  anchor.click()
}
</script>

<template>
  <!-- statistics settings -->
  <div class="statistics">
    <!-- chose field for compilation -->
    <div
      class="statistics-dropdown"
      :class="{
        'statistics-dropdown-open': isDropdownColumns,
        'statistics-dropdown-disabled': selectedDatasets.length === 0,
      }"
    >
      <span>{{ $t('dataselector.statistics.parameter') }}</span>
      <div class="statistics-dropdown-toggle" @click="toggleDropdownCompileParams">
        <span v-if="selectedCompileParams.length === 0">{{
          $t('dataselector.statistics.noparameter')
        }}</span>
        <span v-else>{{ selectedCompileParams.join(', ') }}</span>
      </div>
      <div class="statistics-dropdown-menu" v-if="isDropdownCompileParams">
        <label v-for="param in currentParams" :key="param.name" class="statistics-dropdown-item">
          <input
            type="checkbox"
            :value="param.name"
            v-model="selectedCompileParams"
            @change="updateCompileParams"
          />
          {{ param.name }}
        </label>
      </div>
    </div>
    <!-- select additional fields for statistics -->
    <div
      class="statistics-dropdown"
      :class="{
        'statistics-dropdown-open': isDropdownColumns,
        'statistics-dropdown-disabled': selectedDatasets.length === 0,
      }"
    >
      <span>{{ $t('dataselector.statistics.columns') }}</span>
      <div class="statistics-dropdown-toggle" @click="toggleDropdownColumns">
        <span v-if="selectedColumns.length === 0">{{
          $t('dataselector.statistics.nocolumns')
        }}</span>
        <span v-else>{{ selectedColumns.join(', ') }}</span>
      </div>
      <div class="statistics-dropdown-menu" v-if="isDropdownColumns">
        <label v-for="param in currentParams" :key="param.name" class="statistics-dropdown-item">
          <input
            type="checkbox"
            :value="param.name"
            v-model="selectedColumns"
            @change="updateColumns"
          />
          {{ param.name }}
        </label>
      </div>
    </div>
    <div v-if="currentResult.length">
      <button @click="exportCSV()" class="export-button">{{ $t('statistics.exportCSV') }}</button>
    </div>
  </div>

  <!-- show table -->
  <div class="table-wrapper">
    <table v-if="currentResult.length" class="fancy-table">
      <thead>
        <tr>
          <th v-for="key in tableHeaders" :key="key" @click="sortTable(String(key))">
            <div class="header-content">
              <span>{{ key }}</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in paginatedData" :key="item + '-' + index">
          <td v-for="(value, key) in item" :key="key">
            {{ Array.isArray(value) ? value.join(', ') : value }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- show no data -->
    <p v-else-if="lexicalStorage.selectedDatasets.length == 0">
      {{ $t('message.nodatasetselected') }}
    </p>
    <p v-else-if="!fetchDataLoaded" class="message">
      {{ $t('message.loading') }}
    </p>
    <p v-else>
      {{ $t('error.nodata') }}
    </p>

    <!-- show pagers -->
    <div v-if="currentResult.length" class="pagination">
      <button @click="firstPage" :disabled="currentPage === 1">
        <i class="material-icons">first_page</i>
      </button>
      <button @click="prevPage" :disabled="currentPage === 1">
        <i class="material-icons">chevron_left</i>
      </button>
      <span>{{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        <i class="material-icons">chevron_right</i>
      </button>
      <button @click="lastPage" :disabled="currentPage === totalPages">
        <i class="material-icons">last_page</i>
      </button>
      <label for="itemsPerPage">Items per page:</label>
      <select id="itemsPerPage" v-model="itemsPerPage" class="items-per-page">
        <option v-for="option in [10, 20, 50, 100]" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.statistics {
  background-color: var(--sb-grey-light);
  padding: 0.5rem;
  color: black;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.statistics-header {
  font-size: medium;
  font-weight: bold;
}

.statistics-dropdown {
  position: relative;
  margin-bottom: 1rem;
  margin-right: 1rem;
  width: 400px;
}

.statistics-dropdown-open {
  border-color: var(--sb-orange);
}

.statistics-dropdown-disabled {
  pointer-events: none;
  color: var(--sb-grey-medium);
  cursor: not-allowed;
}

.statistics-dropdown-toggle {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
}

.statistics-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.statistics-dropdown-open .dropdown-menu {
  border-color: var(--color-border-open);
}

.statistics-dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: var(--color-text);
}

.statistics-dropdown-item input {
  margin-right: 0.5rem;
}

.table-wrapper {
  display: grid;
  position: relative;
  /* margin-top: 2rem; */
  padding: 1rem;
}

.fancy-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 1rem;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

th,
td {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
}

th {
  background-color: var(--sb-orange-light);
  /* background-color: var(--table-head-bg); */
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

.export-button {
  margin-top: 2rem;
}

.message {
  margin: 0.5rem;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
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
