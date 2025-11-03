<script setup lang="ts">
import { ROW_MAX_HEIGHT, ROW_SHOW_EXPANDED_DEFAULT } from '@/utils/constants'
import { computed, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { getTableData } from '@/api/apiService'
import {
  type DatasetResult,
  type DatasetEntry,
  type Entry,
  type EntryS,
  type FieldConfig,
  entryWordField,
} from '@/types/datasetConfig'
import { formatCell } from '@/utils/utils'
import { useI18n } from 'vue-i18n'
import MaxHeight from '@/components/MaxHeight.vue'
//import { template } from 'es-toolkit/compat'
import { groupBy } from 'es-toolkit'

const { t } = useI18n()

const lexicalStorage = lexicalStore()

// result

const currentResult = ref<DatasetResult>({
  hits: [],
  resourceHits: {},
  resourceOrder: {},
  total: 0,
})

// currentResult as returned from groupBy()
const currentResultGrp = ref<Record<string, { entry: Entry; resourceId: string }[]>>({})
// with rows sorted and put in (ordered) array
const currentResultGrpSorted = ref<Record<string, { entry: EntryS[]; resourceId: string }[]>>({})

const currentCommonFields = computed(() => lexicalStorage.currentCommonFields)

// sort column
const sortField = ref(lexicalStorage.sortField)

// always show expanded rows (no "View more" button)
const showExpanded = ref(ROW_SHOW_EXPANDED_DEFAULT)

// pages

const currentPageStart = computed({
  get: () => lexicalStorage.pageStart,
  set: (value) => (lexicalStorage.pageStart = value),
})

const currentPageSize = computed({
  get: () => lexicalStorage.pageSize,
  set: (value) => (lexicalStorage.pageSize = value),
})

const totalPages = computed(() => {
  return Math.ceil(currentResult.value.total / currentPageSize.value)
})

const firstPage = () => {
  currentPageStart.value = 1
}

const prevPage = () => {
  if (currentPageStart.value > 1) {
    currentPageStart.value--
  }
}

const nextPage = () => {
  if (currentPageStart.value < totalPages.value) {
    currentPageStart.value++
  }
}

const lastPage = () => {
  currentPageStart.value = totalPages.value
}

const itemsPerPage = () => {
  currentPageStart.value = Math.ceil(
    currentPageStart.value * (lexicalStorage.pageStart / currentPageStart.value),
  )
  lexicalStorage.pageStart = currentPageStart.value
  lexicalStorage.pageSize = currentPageSize.value
}

// sort columns

const doSort = (s: string) => {
  sortField.value = s
  if (sortField.value == lexicalStorage.sortField) {
    if (lexicalStorage.sortOrder == 'asc') {
      lexicalStorage.sortOrder = 'desc'
    } else {
      lexicalStorage.sortOrder = 'asc'
    }
  } else {
    lexicalStorage.sortOrder = 'asc'
  }
  lexicalStorage.sortField = sortField.value
  fetchData()

  console.log('doSort()', sortField.value)
}

const errorMessage = ref('')

const fetchData = async () => {
  // abort any current running queries
  if (lexicalStorage.abortController !== null) {
    lexicalStorage.abortController.abort()
  }
  // convert checkboxes to search "position"
  for (const sf in lexicalStorage.selectedFields) {
    if (lexicalStorage.selectedFields[sf].positionMedial) {
      lexicalStorage.selectedFields[sf].position = 'contains'
    } else if (lexicalStorage.selectedFields[sf].positionInitial) {
      lexicalStorage.selectedFields[sf].position = 'startswith'
    } else if (lexicalStorage.selectedFields[sf].positionFinal) {
      lexicalStorage.selectedFields[sf].position = 'endswith'
    } else {
      lexicalStorage.selectedFields[sf].position = 'equals'
    }
  }

  lexicalStorage.setIsData(false)
  const newDatasets = lexicalStorage.selectedDatasets
  if (newDatasets.length > 0) {
    try {
      errorMessage.value = ''
      const data = await getTableData(currentPageStart.value, currentPageSize.value)
      if (Object.keys(data).length !== 0) {
        currentResult.value = data
        currentResultGrp.value = groupBy(currentResult.value.hits, (item) => item.resourceId)
        currentResultGrpSorted.value = {}
        //console.log('fetchdata() - after getTableData()', data, currentResultGrp.value)

        // sort columns based on config
        // transform key,value-pairs to (ordered) array of key,value-pairs
        for (const resId in currentResultGrp.value) {
          // original
          const dataset_unsorted: DatasetEntry[] = currentResultGrp.value[resId]
          // with sorted rows
          currentResultGrpSorted.value[resId] = []

          // we will fill the first column with the value of the entryword
          const resIndex = lexicalStorage.currentConfig.resources.findIndex(
            (item) => item.resourceId === resId,
          )
          const entryWord = lexicalStorage.currentConfig.resources[resIndex].entryWord.field

          // for each unsorted row
          for (let i = 0; i < dataset_unsorted.length; i++) {
            // unsorted row
            const e0: Entry = dataset_unsorted[i].entry
            //for (const key in e0) {
            //  console.log('ORDERO: ', key, e0[key])
            //}
            // fields in correct order
            const fieldsFromConfig: FieldConfig[] =
              lexicalStorage.fieldsInDatasets[dataset_unsorted[i].resourceId]
            // sorted row
            const e1: EntryS[] = []

            // add entryword as first column
            e1.push({ name: entryWordField, value: e0[entryWord] })

            // loop over config, when field is found, add value to new row/array
            for (const key in fieldsFromConfig) {
              //console.log('ORDERS:', key, fieldsFromConfig[key].name, e0[fieldsFromConfig[key].name])
              e1.push({ name: fieldsFromConfig[key].name, value: e0[fieldsFromConfig[key].name] })
            }
            // add new row/array to sorted result
            currentResultGrpSorted.value[resId].push({ entry: e1, resourceId: resId })
          }
        }
      }
      lexicalStorage.setIsData(currentResult.value.total > 0)
    } catch (error) {
      errorMessage.value = t('error.fetching.data') + ' (' + error + ')'
    }
  } else {
    currentResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
    //currentValues.value = []
  }
}
/*
watch(
  () => currentPageStart.value,
  (newPageStart, oldPageStart) => {
    if (oldPageStart !== undefined) {
      //lexicalStorage.pageStart = currentPage.value
      console.log('WATCH currentPageStart', currentPageStart.value)
      lexicalStorage.pageStart = currentPageStart.value
      //fetchData()
    }
  },
)

watch(
  () => currentPageSize.value,
  (newPageSize, oldPageSize) => {
    if (oldPageSize !== undefined) {
      //lexicalStorage.pageSize = itemsPerPage.value
      console.log('WATCH currentPageSize', currentPageSize.value, oldPageSize, newPageSize)
      lexicalStorage.pageSize = currentPageSize.value
      currentPageStart.value = Math.ceil(currentPageStart.value * (oldPageSize / newPageSize))
      console.log('WATCH currentPageSize, currentPageStart: ', currentPageStart.value)
      lexicalStorage.pageStart = currentPageStart.value
      //fetchData()
    }
  },
)
*/
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

const currentTab = ref(lexicalStorage.activeResultTab)

watch(
  () => currentTab.value,
  () => {
    console.log('WATCH currentTab')
    if (lexicalStorage.abortController !== null) {
      lexicalStorage.abortController.abort()
    }
    lexicalStorage.resetIsLoading()
    if (currentTab.value === 'table') {
      fetchData()
    }
  },
  { immediate: true },
)

watch(
  () => lexicalStorage.isSearch,
  () => {
    if (lexicalStorage.isSearch) {
      console.log('TableView - Watch isSearch!')
      lexicalStorage.setIsSearch(false)
      //setTimeout(function () {
      //currentPageStart.value = 1
      fetchData()
      //}, 1000)
    }
  },
  { immediate: true },
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
  for (const index in currentResult.value.resourceOrder) {
    if (currentResult.value.resourceOrder[index] === ds) {
      break
    } else {
      hitCount += currentResult.value.resourceHits[currentResult.value.resourceOrder[index]]
    }
  }
  currentPageStart.value = Math.floor(hitCount / currentPageSize.value) + 1
  //console.log('Page: ', currentPage.value, hitCount)
}
</script>

<template>
  <div class="table-wrapper">
    <p v-if="lexicalStorage.isLoading" class="message-big">
      {{ $t('message.loading') }}
    </p>
    <p v-if="errorMessage != ''" class="message-error">
      {{ errorMessage }}
    </p>
    <p
      v-if="!lexicalStorage.isData && !lexicalStorage.isStart && !lexicalStorage.isLoading"
      class="message-big"
    >
      {{ $t('error.nodata') }}
    </p>

    <!-- show no datasets -->
    <!--  <p v-if="lexicalStorage.selectedDatasets.length == 0">
      {{ $t('message.nodatasetselected') }}
    </p>
    -->
    <!-- show table -->
    <div v-if="lexicalStorage.isData">
      <!-- picsbar -->
      <table class="picsbar">
        <tbody>
          <tr class="picsbar-row">
            <template v-for="(value, key) in currentResult.resourceOrder" :key="key">
              <td
                v-if="currentResult.resourceHits[value] > 0"
                class="picsbar-tooltip"
                :style="{ width: currentResult.resourceHits[value] / currentResult.total + '%' }"
                @click="picsbar(value)"
              >
                <template v-if="Object.keys(currentResult.resourceOrder).length < 6">
                  {{ lexicalStorage.datasetLabels[value] }}
                </template>
                <span class="picsbar-tooltiptext"
                  >{{ lexicalStorage.datasetLabels[value] }}:
                  {{ currentResult.resourceHits[value] }}</span
                >
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <!-- show all cells expanded -->
      <label for="showExpanded">
        <input type="checkbox" id="showExpanded" value="true" v-model="showExpanded" />
        {{ $t('table.show.expanded') }}</label
      >

      <!-- table -->
      {{ 'CRGrpS: ' + String(currentResult.total) }}
      <template v-for="(item, key, index) in currentResultGrpSorted" :key="index">
        <table v-if="currentResult.total > 0" class="fancy-table">
          <tbody>
            <!-- show dataset name -->
            <tr>
              <td colspan="100%" class="dataset-label">
                {{ lexicalStorage.datasetLabels[key] }}:
                {{ currentResult.resourceHits[key] }}
              </td>
            </tr>
            <!-- column names -->
            <tr>
              <th
                v-for="(value, key) in item[0].entry"
                :key="key"
                :class="{
                  'header-list': lexicalStorage.isList(value.name),
                  'header-compile': value.name == entryWordField,
                }"
              >
                <div class="header-content">
                  <span
                    :class="{
                      'header-list-text': lexicalStorage.isList(value.name),
                    }"
                    >{{ lexicalStorage.localizeField(value.name) }}
                    <template v-if="value.name == entryWordField">
                      {{
                        '(' +
                        lexicalStorage.localizeField(
                          lexicalStorage.currentConfig.resources.find(
                            (i) => i.resourceId === item[0]['resourceId'],
                          )?.entryWord.field!,
                        ) +
                        ')'
                      }}</template
                    >
                    <!--
                    {{
                      lexicalStorage.isList(value.name) ? '(' + t('table.header.list') + ')' : ''
                    }}--></span
                  >
                  <span
                    class="header-sortable"
                    :class="{ 'header-sortable-selected': lexicalStorage.sortField == value.name }"
                    v-if="currentCommonFields.find((obj) => obj.name === value.name)"
                    @click="doSort(value.name)"
                    >{{
                      lexicalStorage.sortOrder == 'asc' || lexicalStorage.sortField != value.name
                        ? '▼'
                        : '▲'
                    }}</span
                  >
                </div>
              </th>
            </tr>

            <!-- show dataset entries -->
            <template v-for="(value1, key) in item" :key="key">
              <tr>
                <td v-for="(value2, key) in value1.entry" :key="key">
                  <template v-if="showExpanded">
                    <span v-html="formatCell(value2.value)"></span>
                  </template>
                  <template v-else>
                    <MaxHeight :max-height="ROW_MAX_HEIGHT">
                      <span v-html="formatCell(value2.value)"></span>
                    </MaxHeight>
                  </template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </template>
      <div class="pagination">
        <!--<div v-if="props.data.length" class="pagination">-->
        <button @click="firstPage" :disabled="currentPageStart === 1">
          <i class="material-icons">first_page</i>
        </button>
        <button @click="prevPage" :disabled="currentPageStart === 1">
          <i class="material-icons">chevron_left</i>
        </button>
        <span style="color: var(--color-text)"
          >{{ currentPageStart }} {{ $t('table.of') }} {{ totalPages }}</span
        >
        <button @click="nextPage" :disabled="currentPageStart === totalPages">
          <i class="material-icons">chevron_right</i>
        </button>
        <button @click="lastPage" :disabled="currentPageStart === totalPages">
          <i class="material-icons">last_page</i>
        </button>
        <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }}</label>
        <select
          @click="itemsPerPage"
          id="itemsPerPage"
          v-model="currentPageSize"
          class="items-per-page"
        >
          <option v-for="option in [10, 25, 50, 100, 1000]" :key="option" :value="option">
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
  /*
  border-style: solid;
  border-color: var(--color-complement);
  border-width: 0.5rem 0 0 0;
  */
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

/* picsbar */
.picsbar {
  table-layout: fixed;
  overflow-x: clip;
}

.picsbar tr {
  height: 24px;
}

.picsbar td {
  max-height: 16px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
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
  position: absolute; /* absolute */
  top: 100%; /* At the bottom of the tooltip */
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--sb-orange) transparent transparent transparent;
}

.picsbar-tooltip:hover .picsbar-tooltiptext {
  visibility: visible;
  white-space: normal;
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
}

.header-content {
  display: flex;
  align-items: top;
  justify-content: space-between;
}

.header-content span {
  display: flex;
}

.header-sortable {
  color: var(--sb-grey-medium);
  cursor: pointer;
}

.header-sortable-selected {
  color: var(--sb-orange);
}

.header-list {
  font-style: italic;
  background-color: var(--sb-grey-light);
  color: black;
}

.header-compile {
  background-color: var(--sb-orange);
  color: white;
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
  background-color: white;
  color: black;
  font-weight: bold;
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
