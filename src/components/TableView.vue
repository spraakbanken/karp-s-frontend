<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

import { groupBy } from 'es-toolkit'

import { ROW_SHOW_COMPACT_DEFAULT } from '@/utils/constants'
import {
  type DatasetEntry,
  type Entry,
  type EntryS,
  type FieldConfig,
  entryWordField,
} from '@/types/datasetConfig'
import { getTableData } from '@/api/apiService'
import { formatCell } from '@/utils/utils'

import TableRowCompact from '@/components/TableRowCompact.vue'
import ColumnVisDropDown from './ColumnVisDropDown.vue'

const { t } = useI18n()

const lexicalStorage = lexicalStore()

// result

/*
const tableResult = ref<DatasetResult>({
  hits: [],
  resourceHits: {},
  resourceOrder: {},
  total: 0,
})
*/

//const tableResult = ref<DatasetResult>(lexicalStorage.tableResult)

const tableResult = computed({
  get: () => lexicalStorage.tableResult,
  set: (value) => (lexicalStorage.tableResult = value),
})

// currentResult as returned from groupBy()
const tableResultGrp = ref<Record<string, { entry: Entry; resourceId: string }[]>>({})
// with rows sorted and put in (ordered) array
const tableResultGrpSorted = ref<Record<string, { entry: EntryS[]; resourceId: string }[]>>({})

const currentCommonFields = computed(() => lexicalStorage.currentCommonFields)

// sort column
const sortField = ref(lexicalStorage.sortField)

// always show expanded rows (no "View more" button)
const showCompact = ref(ROW_SHOW_COMPACT_DEFAULT)

// pages

const currentPageRowStart = computed({
  get: () => lexicalStorage.tablePageRowStart,
  set: (value) => (lexicalStorage.tablePageRowStart = value),
})

const currentPageSize = computed({
  get: () => lexicalStorage.tablePageSize,
  set: (value) => (lexicalStorage.tablePageSize = value),
})

const totalPages = computed(() => {
  return Math.ceil(tableResult.value.total / currentPageSize.value)
})

const firstPage = () => {
  currentPageRowStart.value = 0
}

const prevPage = () => {
  if (currentPageRowStart.value > 0) {
    currentPageRowStart.value -= currentPageSize.value
    if (currentPageRowStart.value < 0) {
      currentPageRowStart.value = 0
    } else if (currentPageRowStart.value < currentPageSize.value) {
      currentPageRowStart.value = 0
    }
  }
}

const nextPage = () => {
  if (currentPageRowStart.value < tableResult.value.total - 1) {
    currentPageRowStart.value += currentPageSize.value
  }
}

const lastPage = () => {
  currentPageRowStart.value =
    Math.floor((tableResult.value.total - 1) / currentPageSize.value) * currentPageSize.value
}

const itemsPerPage = () => {
  //fetchData()
}

watch(
  () => currentPageRowStart.value,
  () => {
    //lexicalStorage.pageStart = currentPage.value
    console.log('WATCH currentPageStart.value', currentPageRowStart.value)
    fetchData()
  },
)

watch(
  () => currentPageSize.value,
  (newItemsPerPage, oldItemsPerPage) => {
    //lexicalStorage.pageSize = itemsPerPage.value
    console.log('WATCH itemsPerPage.value', currentPageSize.value)
    //currentPageStart.value = Math.ceil(currentPageStart.value * (oldItemsPerPage / newItemsPerPage))
    //tableResult.total
    console.log(
      'NEW pagestart',
      currentPageRowStart.value,
      //Math.ceil(currentPageStart.value * (lexicalStorage.pageSize / currentPageSize.value)),
      Math.ceil(currentPageRowStart.value * (oldItemsPerPage / newItemsPerPage)),
    )
    //currentPageStart.value = Math.ceil(currentPageStart.value * (oldItemsPerPage / newItemsPerPage))

    //lexicalStorage.tablePageRowStart = currentPageRowStart.value
    lexicalStorage.tablePageSize = currentPageSize.value
    fetchData()
  },
)

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
      const data = await getTableData(currentPageRowStart.value, currentPageSize.value)
      if (Object.keys(data).length !== 0) {
        tableResult.value = data
        groupData()
      }
      lexicalStorage.setIsData(tableResult.value.total > 0)
    } catch (error) {
      errorMessage.value = t('error.fetching.data') + ' (' + error + ')'
    }
  } else {
    tableResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
    //currentValues.value = []
  }
}

const groupData = () => {
  tableResultGrp.value = groupBy(tableResult.value.hits, (item) => item.resourceId)
  tableResultGrpSorted.value = {}
  //console.log('fetchdata() - after getTableData()', data, currentResultGrp.value)

  // sort columns based on config
  // transform key,value-pairs to (ordered) array of key,value-pairs
  for (const resId in tableResultGrp.value) {
    // original
    const dataset_unsorted: DatasetEntry[] = tableResultGrp.value[resId]
    // with sorted rows
    tableResultGrpSorted.value[resId] = []

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
      tableResultGrpSorted.value[resId].push({ entry: e1, resourceId: resId })
    }
  }
}

watch(
  () => lexicalStorage.isData,
  (newIsData) => {
    if (!newIsData) {
      tableResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
      //currentValues.value = []
    }
  },
)

watch(
  () => lexicalStorage.selectedDatasets,
  (newDatasets) => {
    if (newDatasets.length === 0) {
      tableResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
      //currentValues.value = []
    } else if (newDatasets.length === 1) {
      showCompact.value = false
    }
  },
)

const currentTab = ref(lexicalStorage.activeResultTab)

watch(
  () => currentTab.value,
  () => {
    console.log('WATCH currentTab, tableResult:', tableResult.value.hits)
    /*
    if (lexicalStorage.abortController !== null) {
      lexicalStorage.abortController.abort()
    }
    lexicalStorage.resetIsLoading()
    if (currentTab.value === 'table') {
      fetchData()
    }
    */
    groupData()
  },
  { immediate: true },
)

watch(
  () => lexicalStorage.isTableSearch,
  () => {
    if (lexicalStorage.isTableSearch) {
      console.log('TableView - Watch isSearch!')
      lexicalStorage.setIsTableSearch(false)
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
  for (const index in tableResult.value.resourceOrder) {
    if (tableResult.value.resourceOrder[index] === ds) {
      break
    } else {
      hitCount += tableResult.value.resourceHits[tableResult.value.resourceOrder[index]]
    }
  }
  currentPageRowStart.value = hitCount
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
            <template v-for="(value, key) in tableResult.resourceOrder" :key="key">
              <td
                v-if="tableResult.resourceHits[value] > 0"
                class="picsbar-tooltip"
                :style="{ width: tableResult.resourceHits[value] / tableResult.total + '%' }"
                @click="picsbar(value)"
              >
                <template v-if="Object.keys(tableResult.resourceOrder).length < 6">
                  {{ lexicalStorage.datasetLabels[value] }}
                </template>
                <span class="picsbar-tooltiptext"
                  >{{ lexicalStorage.datasetLabels[value] }}:
                  {{ tableResult.resourceHits[value] }}</span
                >
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <div class="info-control">
        <!-- total # of hits -->
        <span>
          <b>{{ $t('table.total.pre') }}:</b> {{ tableResult.total }}
          {{ $t('table.total.hits') }}
        </span>
        <!-- show all cells expanded -->
        <label for="showCompact">
          <input type="checkbox" id="showCompact" value="true" v-model="showCompact" />
          {{ $t('table.show.compact') }}
        </label>
      </div>

      <!-- table -->
      <template v-for="(item, ds, index) in tableResultGrpSorted" :key="index">
        <table v-if="tableResult.total > 0" class="fancy-table">
          <tbody>
            <!-- show dataset name -->
            <tr>
              <td colspan="100%" class="dataset-label">
                <ColumnVisDropDown :resourceId="ds" />
                {{ lexicalStorage.datasetLabels[ds] }}: {{ tableResult.resourceHits[ds] }}
                {{
                  tableResult.resourceHits[ds] > 1 ? $t('table.total.hits') : $t('table.total.hit')
                }}
                <span v-for="(value, i) in item[0].entry" :key="i"> </span>
              </td>
            </tr>
            <!-- column names -->
            <tr>
              <!-- empty cell for expand_more/less -->
              <th v-if="showCompact" class="header-compile"></th>
              <template v-for="(value, key) in item[0].entry">
                <th
                  v-if="lexicalStorage.columnVis[ds].find((f) => f.columnField === value.name)?.vis"
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
                        }}
                      </template>

                      <!--
                    {{
                      lexicalStorage.isList(value.name) ? '(' + t('table.header.list') + ')' : ''
                    }}--></span
                    >

                    <span
                      class="header-sortable"
                      :class="{
                        'header-sortable-selected': lexicalStorage.sortField == value.name,
                      }"
                      v-if="currentCommonFields.find((obj) => obj.name === value.name)"
                      @click="doSort(value.name)"
                      >{{
                        lexicalStorage.sortOrder == 'asc' || lexicalStorage.sortField != value.name
                          ? '▼'
                          : '▲'
                      }}
                    </span>
                  </div>
                </th>
              </template>
            </tr>

            <!-- show dataset entries -->
            <template v-for="(value1, key) in item" :key="key">
              <template v-if="showCompact">
                <TableRowCompact
                  :maxHeight="33"
                  :value1="value1"
                  :fa="lexicalStorage.columnVis[ds]"
                  :showCompact="showCompact"
                >
                </TableRowCompact>
              </template>

              <template v-else>
                <tr>
                  <template v-for="(value2, key) in value1.entry" :key="key">
                    <td
                      v-if="
                        lexicalStorage.columnVis[ds].find((f) => f.columnField === value2.name)?.vis
                      "
                    >
                      <span v-html="formatCell(value2.value)"></span>
                    </td>
                  </template>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </template>

      <!-- pagination -->
      <div class="pagination">
        <!--<div v-if="props.data.length" class="pagination">-->
        <button @click="firstPage" :disabled="currentPageRowStart === 0">
          <span class="material-icons">first_page</span>
        </button>
        <button @click="prevPage" :disabled="currentPageRowStart === 0">
          <span class="material-icons">chevron_left</span>
        </button>
        <span style="color: var(--color-text)"
          >{{ $t('table.footer.page') }}:
          {{ Math.floor(currentPageRowStart / currentPageSize) + 1 }} {{ $t('table.of') }}
          {{ totalPages }} ({{ $t('table.footer.hit') }}: {{ currentPageRowStart + 1 }}-{{
            currentPageRowStart + currentPageSize > tableResult.total
              ? tableResult.total
              : currentPageRowStart + currentPageSize
          }}
          {{ $t('table.of') }} {{ tableResult.total }})</span
        >
        <button
          @click="nextPage"
          :disabled="currentPageRowStart + currentPageSize >= tableResult.total - 1"
        >
          <span class="material-icons">chevron_right</span>
        </button>
        <button
          @click="lastPage"
          :disabled="currentPageRowStart + currentPageSize >= tableResult.total - 1"
        >
          <span class="material-icons">last_page</span>
        </button>
        <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }}</label
        >:
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

<style src="@/assets/table.css" scoped></style>

<style scoped>
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
  font-weight: bold;
  background-color: var(--color-background-alt);
}

/* picsbar */

.picsbar {
  table-layout: fixed;
  overflow-x: clip;
  margin: 0;
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

/* Info and control before table */

.info-control {
  background-color: var(--sb-grey-dark);
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  display: inline-flex;
  flex-direction: row;
  padding: 0.5rem;
  margin: 0.5rem 0 0.5rem 0;
}

.info-control span {
  margin-right: 1rem;
}

.info-control input {
  cursor: pointer;
}

/* table */

.header-content {
  display: flex;
  align-items: top;
  justify-content: space-between;
}

.header-content span {
  display: flex;
}

.header-sortable {
  cursor: pointer;
  margin-left: 0.5rem;
}

.header-sortable .icon {
  color: var(--sb-grey-medium);
}

.header-sortable-selected {
  color: black;
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

.dataset-label {
  text-align: left;
  background-color: var(--color-background);
  color: var(--color-text);
  font-weight: bold;
}
</style>
