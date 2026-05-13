<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

import { groupBy } from 'es-toolkit'

import { checkJwtToken } from '@/api/authService'

import {
  ROW_SHOW_COMPACT_DEFAULT,
  SORT_ORDER_ASCENDING,
  SORT_ORDER_DESCENDING,
} from '@/utils/constants'
import {
  type DatasetEntry,
  type Entry,
  type EntryS,
  type FieldConfig,
  entryWordField,
} from '@/types/datasetConfig'
import { getTableData } from '@/api/apiService'
import { formatCell, isImage } from '@/utils/utils'

import TableRowCompact from '@/components/TableRowCompact.vue'
import ColVisDropDown from './ColVisDropDown.vue'
import ColVisGlobalDropDown from './ColVisGlobalDropDown.vue'
import TablePagination from './TablePagination.vue'

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

// open window at url link for given resourceId (ds)
const clickResourceInfo = (ds: string) => {
  const url = lexicalStorage.currentConfig.resources.find((x) => x.resourceId === ds)
  if (url !== undefined) {
    window.open(url.link, '_blank')
  }
}

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
const sortField = ref(lexicalStorage.tableSortField)

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

watch(
  () => currentPageRowStart.value,
  () => {
    //lexicalStorage.pageStart = currentPage.value
    //console.log('WATCH currentPageStart.value', currentPageRowStart.value)
    fetchData()
  },
)

watch(
  () => currentPageSize.value,
  () => {
    lexicalStorage.tablePageSize = currentPageSize.value
    fetchData()
  },
)

// sort column selection

const doSort = (field: string, sortOrder: string) => {
  sortField.value = field
  lexicalStorage.tableSortField = field
  lexicalStorage.tableSortOrder = sortOrder
  fetchData()
}

const errorMessage = ref('')

const fetchData = async () => {
  // abort any current running queries
  if (lexicalStorage.abortController !== null) {
    lexicalStorage.abortController.abort()
  }

  // JWT token valid?
  checkJwtToken()

  /*
  // convert checkboxes to search "position"

  for (let sf = 0; sf < lexicalStorage.selectedFieldsCount; sf++) {
    if (lexicalStorage.selectedFields[sf].positionMedial) {
      lexicalStorage.selectedFields[sf].position = POSITION_CONTAINS
    } else if (lexicalStorage.selectedFields[sf].positionInitial) {
      lexicalStorage.selectedFields[sf].position = POSITION_STARTSWITH
    } else if (lexicalStorage.selectedFields[sf].positionFinal) {
      lexicalStorage.selectedFields[sf].position = POSITION_ENDSWITH
    } else {
      lexicalStorage.selectedFields[sf].position = POSITION_EQUALS
    }
  }
  */

  lexicalStorage.setIsTableData(false)
  const newDatasets = lexicalStorage.selectedDatasets
  if (newDatasets.length > 0) {
    try {
      errorMessage.value = ''
      const data = await getTableData(currentPageRowStart.value, currentPageSize.value)
      if (Object.keys(data).length !== 0) {
        tableResult.value = data
        groupData()
      }
      lexicalStorage.setIsTableData(tableResult.value.total > 0)
    } catch (error) {
      errorMessage.value = t('error.fetching.data') + ' (' + error + ')'
    }
  } else {
    tableResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
    //currentValues.value = []
  }
}

// group fetched result on dataset, and sort columns according to config column order
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
        if (fieldsFromConfig[key].name !== entryWordField) {
          e1.push({ name: fieldsFromConfig[key].name, value: e0[fieldsFromConfig[key].name] })
        }
      }
      // add new row/array to sorted result
      tableResultGrpSorted.value[resId].push({ entry: e1, resourceId: resId })
    }
  }
}

watch(
  () => lexicalStorage.isTableData,
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
    //console.log('WATCH TableView: selectedDatasets', lexicalStorage.selectedDatasets)
    if (newDatasets.length === 0) {
      tableResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
      //currentValues.value = []
    } else if (newDatasets.length === 1) {
      showCompact.value = false
    }
    // set all column visibility to primary, secondary fields will not be visible
    /*
    for (const ds of lexicalStorage.selectedDatasets) {
      const res = lexicalStorage.currentConfig.resources.find((item) => item.resourceId === ds)
      if (res !== undefined) {
        for (const fi of res.fields) {
          const colfi = lexicalStorage.columnVis[ds].find((item) => item.columnField === fi.name)
          if (colfi !== undefined) {
            colfi.vis = fi.primary
          }
        }
      }
    }
    */
  },
)

const currentTab = ref(lexicalStorage.activeResultTab)

watch(
  () => currentTab.value,
  () => {
    // if switching from statistics, cancel any running statistics queries
    if (lexicalStorage.isTableSearch) {
      if (lexicalStorage.abortController !== null) {
        lexicalStorage.abortController.abort()
      }
      lexicalStorage.resetIsTableLoading()
    }
    groupData()
  },
  { immediate: true },
)

watch(
  () => lexicalStorage.isTableSearch,
  () => {
    if (lexicalStorage.isTableSearch) {
      lexicalStorage.setIsTableSearch(false)
      fetchData()
    }
  },
  { immediate: true },
)

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
}

// return fraction of total picsbar
const picsbarFractionTotalClass = (ds: string) => {
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
  const fraction = hitCount / tableResult.value.total
  return {
    'picsbar-tooltiptext-r': fraction < 0.25,
    'picsbar-tooltiptext-l': fraction > 0.75,
    'picsbar-tooltiptext': fraction >= 0.25 && fraction <= 0.75,
  }
}

/*
const showImg = (img: string) => {
  console.log('SHowImg:', img, window.location.pathname)

  window.location.pathname += 'img?img=' + img
}
*/
</script>

<template>
  <div class="table-wrapper">
    <p v-if="lexicalStorage.isTableLoading" class="message-big">
      {{ $t('message.loading') }}
    </p>
    <p v-if="errorMessage != ''" class="message-error">
      {{ errorMessage }}
    </p>
    <p
      v-if="
        !lexicalStorage.isTableData && !lexicalStorage.isStart && !lexicalStorage.isTableLoading
      "
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
    <div v-if="lexicalStorage.isTableData">
      <!-- picsbar -->
      <table class="picsbar">
        <tbody>
          <tr>
            <template v-for="(value, key) in tableResult.resourceOrder" :key="key">
              <td
                v-if="tableResult.resourceHits[value] > 0"
                class="picsbar-tooltip"
                :style="{
                  width: 100 * (tableResult.resourceHits[value] / tableResult.total) + '%',
                }"
                @click="picsbar(value)"
              >
                <template v-if="Object.keys(tableResult.resourceOrder).length < 6">
                  {{ lexicalStorage.datasetLabels[value] }}
                </template>
                <span :class="picsbarFractionTotalClass(value)"
                  >{{ lexicalStorage.datasetLabels[value] }}:
                  {{ tableResult.resourceHits[value] }}</span
                >
              </td>
            </template>
          </tr>
        </tbody>
      </table>
      <!-- picsbar position indicator -->
      <table class="picsbar-pos">
        <tbody>
          <tr>
            <td :style="{ width: 100 * (currentPageRowStart / tableResult.total) + '%' }"></td>
            <td
              :style="{
                width: Math.max(0.25, 100 * (currentPageSize / tableResult.total)) + '%',
              }"
              style="background-color: var(--sb-orange)"
            ></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="info-control">
        <!-- show all cells expanded -->
        <label for="showCompact">
          <input type="checkbox" id="showCompact" value="true" v-model="showCompact" />
          {{ $t('table.show.compact') }}
        </label>
        <ColVisGlobalDropDown />
      </div>
      <TablePagination :tableResultTotal="tableResult.total"></TablePagination>

      <!-- tables -->
      <div class="table-container">
        <template v-for="(item, ds, index) in tableResultGrpSorted" :key="index">
          <table v-if="tableResult.total > 0" class="fancy-table">
            <tbody>
              <!-- show dataset name -->
              <tr>
                <td colspan="100%" class="dataset-label">
                  <!--<span class="material-icons icon-placement">square</span>-->
                  {{ lexicalStorage.datasetLabels[ds] }}
                  <button class="button" @click="clickResourceInfo(ds)">Info</button>
                  <span class="hits">
                    {{ tableResult.resourceHits[ds] }}
                    {{
                      tableResult.resourceHits[ds] > 1
                        ? $t('table.total.hits')
                        : $t('table.total.hit')
                    }}
                  </span>
                  <ColVisDropDown :resourceId="ds" />
                  <span v-for="(value, i) in item[0].entry" :key="i"> </span>
                </td>
              </tr>
              <!-- if at least one column is visible -->
              <template
                v-if="
                  lexicalStorage.columnVis[ds].reduce((count, item) => {
                    return item.vis ? count + 1 : count
                  }, 0) > 0
                "
              >
                <!-- column names -->
                <tr>
                  <!-- empty cell for expand_more/less -->
                  <th v-if="showCompact" class="header-compile"></th>
                  <template v-for="(value, key) in item[0].entry">
                    <th
                      v-if="
                        lexicalStorage.columnVis[ds].find((f) => f.columnField === value.name)?.vis
                      "
                      :key="key"
                      :class="{
                        'header-list': lexicalStorage.isList(value.name),
                      }"
                    >
                      <!--'header-compile': value.name == entryWordField, -->
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
                        </span>
                        <template v-if="currentCommonFields.find((obj) => obj.name === value.name)">
                          <span class="header-sortable material-icons">
                            <span
                              @click="doSort(value.name, SORT_ORDER_ASCENDING)"
                              :class="{
                                'header-sortable-selected':
                                  lexicalStorage.tableSortOrder == SORT_ORDER_ASCENDING &&
                                  lexicalStorage.tableSortField == value.name,
                              }"
                            >
                              {{ 'keyboard_arrow_down' }}
                            </span>
                            <span
                              @click="doSort(value.name, SORT_ORDER_DESCENDING)"
                              :class="{
                                'header-sortable-selected':
                                  lexicalStorage.tableSortOrder == SORT_ORDER_DESCENDING &&
                                  lexicalStorage.tableSortField == value.name,
                              }"
                            >
                              {{ 'keyboard_arrow_up' }}
                            </span>
                          </span>
                        </template>
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
                            lexicalStorage.columnVis[ds].find((f) => f.columnField === value2.name)
                              ?.vis
                          "
                        >
                          <span>
                            <!--<span style="white-space: nowrap">-->
                            <span v-html="formatCell(value2.value)"></span>
                            <span v-if="isImage(value2.value)">
                              &nbsp;<a
                                :href="'/karplabb/img?img=' + value2.value"
                                class="material-icons action-link"
                                target="_blank"
                                :title="t('table.imgbrowse')"
                              >
                                open_in_browser
                              </a>
                            </span>
                          </span>
                        </td>
                      </template>
                    </tr>
                  </template>
                </template>
              </template>
            </tbody>
          </table>
        </template>
      </div>
      <!-- pagination -->
      <TablePagination :tableResultTotal="tableResult.total"></TablePagination>
    </div>
  </div>
</template>

<style src="@/assets/table.css" scoped></style>

<style scoped>
.table-wrapper {
  padding: 0.5rem;
}

.table-container {
  margin-bottom: 0rem;
  overflow-x: scroll;
  width: 100%;
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
  background-color: var(--color-background-alt);
  height: 2.5rem;
}

.tabs button {
  padding: 0.5rem 1rem;
  margin: 0;
  border: none;
  border: 1px solid white;
  border-bottom: none;
  color: var(--color-text);
  background-color: var(--color-background-alt2);
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
  border-color: var(--color-border);
  border-spacing: 0;
  width: 100%;
}

.picsbar tr {
  height: 24px;
}

.picsbar td {
  border: 1px solid var(--color-border);
  max-height: 16px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  margin: 0;
  padding: 0;
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

.picsbar-tooltip .picsbar-tooltiptext-r {
  width: 120px;
  bottom: 100%;
  left: 50%;
  margin-left: 0px; /* Use half of the width (120/2 = 60), to center the tooltip */

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

.picsbar-tooltip .picsbar-tooltiptext-l {
  width: 120px;
  bottom: 100%;
  left: 50%;
  margin-left: -120px; /* Use half of the width (120/2 = 60), to center the tooltip */

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

/*
.picsbar-tooltip .picsbar-tooltiptext::after,
.picsbar-tooltip .picsbar-tooltiptext-r::after,
.picsbar-tooltip .picsbar-tooltiptext-l::after {
  content: ' ';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--sb-orange) transparent transparent transparent;
}
*/

.picsbar-tooltip:hover .picsbar-tooltiptext,
.picsbar-tooltip:hover .picsbar-tooltiptext-r,
.picsbar-tooltip:hover .picsbar-tooltiptext-l {
  visibility: visible;
  white-space: normal;
}

.picsbar-pos {
  table-layout: fixed;
  overflow-x: clip;
  margin: 0;
  border-spacing: 0;
  width: 100%;
}

.picsbar-pos tr {
  height: 6px;
  background-color: transparent;
}

.picsbar-pos td {
  border: none;
  text-align: center;
  white-space: nowrap;
  margin: 0;
  padding: 0;
}

.picsbar-pos tr:hover {
  background-color: transparent;
}

/* Info and control before table */

.info-control {
  background-color: var(--color-infocontrol-bg);
  color: var(--color-infocontrol-text);
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
  accent-color: var(--sb-orange);
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
  color: var(--sb-grey-medium);
}

.header-sortable-selected {
  color: black;
}

.header-list {
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

.dataset-label button {
  margin-right: 0.25rem;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 1px solid var(--sb-orange);
  cursor: pointer;
  font-weight: bold;
}

.dataset-label button:hover {
  background-color: var(--button-action-bg-hover-color);
  color: var(--button-action-text-hover-color);
}

.dataset-label .hits {
  margin-right: 0.25rem;
}

.icon-placement {
  color: var(--sb-orange);
  vertical-align: top;
  font-size: 22px;
}

.action-link {
  vertical-align: top;
  font-size: 22px;
  text-decoration: none;
}

.fancy-table {
}
</style>
