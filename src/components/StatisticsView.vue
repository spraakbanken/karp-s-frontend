<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { entryWordField, entryWordFieldCamel, type Dataset } from '@/types/datasetConfig'
import { getStatisticsData } from '@/api/apiService'
import type { SelectedFieldConfig, CountHeadersColumn } from '@/types/datasetConfig.ts'
import * as d3 from 'd3'
import MaxHeight from '@/components/MaxHeight.vue'
import { formatCell } from '@/utils/utils'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const lexicalStorage = lexicalStore()

const currentResult = ref<Dataset[]>([])
const tableHeaders = ref<CountHeadersColumn[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(100)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentTab = ref(lexicalStorage.activeResultTab)
const showExpanded = ref(false)
const columnCount = ref(false)

const isDropdownColumns = ref(false)
const isDropdownCompileFields = ref(false)
const dropdownContainerS = ref<HTMLElement | null>(null)

const toggleDropdownCompileFields = () => {
  isDropdownCompileFields.value = !isDropdownCompileFields.value
  //  isDropdownOpen.value = false
  //  isDropdownParams.value = false
  isDropdownColumns.value = false
  // possibly trigger search if closing dropdown
  if (isSearchChanged.value && !isDropdownCompileFields.value) {
    lexicalStorage.setIsSearch(true)
    isSearchChanged.value = false
  }
}

const toggleDropdownColumns = () => {
  isDropdownColumns.value = !isDropdownColumns.value
  //  isDropdownOpen.value = false
  //  isDropdownParams.value = false
  isDropdownCompileFields.value = false
  // if closing
  if (!isDropdownColumns.value) {
    if (selectedColumns.value.length === 0) {
      selectedColumns.value = [entryWordField]
    }
  }
  // possibly trigger search if closing dropdown
  if (isSearchChanged.value && !isDropdownColumns.value) {
    lexicalStorage.setIsSearch(true)
    isSearchChanged.value = false
  }
}

const handleClickOutsideS = (event: MouseEvent) => {
  if (dropdownContainerS.value && !dropdownContainerS.value.contains(event.target as Node)) {
    //console.log('handleClickOutsideS')
    isDropdownColumns.value = false
    isDropdownCompileFields.value = false
    // make sure at least "Antal" is selected as column
    if (selectedColumns.value.length === 0) {
      selectedColumns.value = [entryWordField]
    }
    // trigger search
    if (isSearchChanged.value) {
      lexicalStorage.setIsSearch(true)
      isSearchChanged.value = false
    }
  }
}
/*
const selectedDatasets = computed({
  get: () => lexicalStorage.selectedDatasets,
  set: (value) => lexicalStorage.setSelectedDataset(value),
})
*/
const selectedCompileFields = computed({
  get: () => lexicalStorage.selectedCompileFields,
  set: (value) => lexicalStorage.setSelectedCompileFields(value),
})
const selectedColumns = computed({
  get: () => lexicalStorage.selectedColumns,
  set: (value) => lexicalStorage.setSelectedColumns(value),
})

//const currentFields = computed(() => lexicalStorage.currentFields)
const currentCommonFields = computed(() => lexicalStorage.currentCommonFields)

// sort column
const sortField = ref(lexicalStorage.sortField)

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

// update state from URL
const updateCompileParams = () => {
  lexicalStorage.setSelectedCompileFields(selectedCompileFields.value)
}

// update state from URL
const updateColumns = () => {
  updateShowHitsCheckbox.value = false
  lexicalStorage.setSelectedColumns(selectedColumns.value)
}

const updateShowHitsCheckbox = ref(selectedColumns.value.length == 0)
// UI show hits choice in "Additonal columns" dropdown
const updateShowHits = () => {
  //console.log('CHKBOX:', updateShowHitsCheckbox.value)
  if (updateShowHitsCheckbox.value) {
    selectedColumns.value = []
  } else {
    //selectedColumns.value = [entryWordField]
  }
}

// show overview switch
const showOverview = ref(false)

const isSearchChanged = ref(false)
const errorMessage = ref('')

const fetchData = async () => {
  // abort any current running queries
  lexicalStorage.abortController.abort()

  currentResult.value = []
  const newFields = lexicalStorage.selectedFields
  const newCompileFields = lexicalStorage.selectedCompileFields
  const newColumns = lexicalStorage.selectedColumns
  lexicalStorage.setIsData(false)

  //console.log('fetchData', newParams, newCompileParams, newColumns)
  if (newFields && newCompileFields.length > 0) {
    try {
      errorMessage.value = ''

      const { tableData, headers } = await getStatisticsData(
        newFields as Record<string, SelectedFieldConfig>,
        newCompileFields as string[],
        newColumns as string[],
        columnCount.value as boolean,
      )
      currentResult.value = tableData
      if (currentResult.value.length > 0) {
        lexicalStorage.setIsData(true)
      }
      //console.log('fetchData result ', currentResult.value.length, currentResult.value)
      tableHeaders.value = headers
      // make sure any appearences of "entryWord" i headers
      // are replaced by "entry_word"
      // ie replace entryWordFieldCamel with entryWordField

      tableHeaders.value.forEach((f, i) => {
        if (f.columnField == entryWordFieldCamel) {
          tableHeaders.value[i].columnField = entryWordField
        }
        if (f.headerField == entryWordFieldCamel) {
          tableHeaders.value[i].headerField = entryWordField
        }
      })
      // console.log('currentResult', currentResult.value);
    } catch (error) {
      errorMessage.value = t('error.fetching.data') + ' (' + error + ')'
    }
  } else {
    currentResult.value = []
  }
}

watch(
  () => currentTab.value,
  () => {
    lexicalStorage.abortController.abort()
    lexicalStorage.resetIsLoading()
    if (currentTab.value === 'statistics') {
      fetchData()
    }
  },
  { immediate: true },
)

watch(
  () => lexicalStorage.selectedDatasets,
  (newDatasets, oldDatasets) => {
    //console.log('WATCH: Stat - selectedDatasets', newDatasets.length, oldDatasets.length)
    if (newDatasets.length === 0) {
      currentResult.value = []
      lexicalStorage.setIsData(false)
    }
    selectedCompileFields.value = [entryWordField]
    selectedColumns.value = []
  },
)

watch(
  () => [lexicalStorage.selectedCompileFields, lexicalStorage.selectedColumns, columnCount],
  async () => {
    //console.log('WATCH compile, column, count')
    isSearchChanged.value = true
    /*
      await fetchData()
      updateOverview() // draw graph
    */
  },
  { deep: true },
)

watch(
  () => lexicalStorage.isSearch,
  async () => {
    if (lexicalStorage.isSearch) {
      lexicalStorage.setIsSearch(false)
      {
        await fetchData()
        //console.log('upd overview')
        updateOverview() // draw graph
      }
    }
  },
)

const sortedData = computed(() => {
  //console.log('Recalc!', sortKey.value)
  if (!sortKey.value) return currentResult.value

  return [...currentResult.value].sort((a, b) => {
    //const aValue = a[sortKey.value]
    //const bValue = b[sortKey.value]
    // data is of format a[0] = "name", a[1] = number
    const aValue = a[1]
    const bValue = b[1]
    //console.log('Sort', aValue, bValue, a, b)
    if (aValue === bValue) return 0

    const order = sortOrder.value === 'asc' ? 1 : -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * order
    }

    return (aValue as unknown as number) > (bValue as unknown as number) ? order : -order
  })
})

const paginatedData = computed(() => {
  //console.log('paginatedData!')

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

onMounted(() => {
  document.addEventListener('click', handleClickOutsideS)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideS)
})

/*
  Export current statistics to CSV with header
*/
const exportCSV = () => {
  let csv = ''

  // write headers
  for (const key in tableHeaders.value) {
    if (tableHeaders.value[key].type == 'compile') {
      csv += lexicalStorage.localizeField(tableHeaders.value[key].columnField) + ','
    } else if (tableHeaders.value[key].type == 'value') {
      csv +=
        lexicalStorage.localizeField(tableHeaders.value[key].columnField) +
        ' (' +
        lexicalStorage.datasetLabels[tableHeaders.value[key].headerValue] +
        '),'
    } else if (tableHeaders.value[key].type == 'total') {
      // mirror template headers
      if (columnCount.value && selectedColumns.value.length > 0) {
        if (tableHeaders.value[key].headerField) {
          csv +=
            lexicalStorage.localizeField(tableHeaders.value[key].headerField) +
            ' (' +
            tableHeaders.value[key].headerValue +
            '),'
        } else {
          csv += t('statistics.total') + ','
        }
      } else if (tableHeaders.value[key].headerField) {
        if (selectedColumns.value.length > 0) {
          csv +=
            lexicalStorage.localizeField(tableHeaders.value[key].headerField) +
            ' (' +
            tableHeaders.value[key].headerValue +
            '),'
        } else {
          csv += lexicalStorage.datasetLabels[tableHeaders.value[key].headerValue] + ','
        }
      } else {
        csv += t('statistics.total') + ','
      }
    }
  }
  csv += '\n'
  // find out which columns are collections (lists of values)
  const collectionColumn = []
  for (const key of lexicalStorage.currentFields) {
    if (key.collection) {
      collectionColumn.push(key.name)
    }
  }

  // write data
  for (const row in currentResult.value) {
    const rowItems: Dataset = currentResult.value[row]
    // value could be array
    for (const key in rowItems) {
      const key_number = Number(key)
      if ('columnField' in tableHeaders.value[key_number]) {
        if (collectionColumn.includes(tableHeaders.value[key_number].columnField)) {
          console.log('Columnfield:', rowItems[key])
          csv += '"' + formatCell(rowItems[key], '; ') + '\",'
        } else {
          csv += '"' + rowItems[key] + '\",'
        }
      } else {
        csv += '"' + rowItems[key] + '\",'
      }
    }
    csv += '\n'
  }
  //console.log('CSV =', csv)
  // save as file
  const anchor = document.createElement('a')
  anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  anchor.target = '_blank'
  anchor.download = 'karp-s-export.csv'
  anchor.click()
}
/*
  Graph/Overview
*/
//const graph_max_number_of_values = 100

const graph_threshold = ref<number>(1)
const graph_textangled = ref<boolean>(false)
const graph_barwidth = ref<number>(60)
const graph_dots = ref<boolean>(false)

const graph_value_max = ref<number>(0)
const graph_value_count = ref<number>(0)

const drawChart = () => {
  console.log('drawChart() ', currentResult.value.length)
  interface dict {
    [key: string]: string | number
  }
  const dataObj: dict = {}
  graph_value_max.value = 0
  graph_value_count.value = 0
  // write data
  for (const row in currentResult.value) {
    const row2 = currentResult.value[row]
    const category: string = <string>row2[0] // first # is always category
    const row2_length = row2.length
    const value: number = <number>(<unknown>row2[<number>(<unknown>row2_length) - 1]) // last # is always total
    // last # is always total
    //console.log('row=', row, 'category=', category, 'value=', value)
    if (value >= graph_threshold.value) {
      //if (graph_value_count.value < graph_max_number_of_values) {
      dataObj[category] = value
      if (value > graph_value_max.value) {
        graph_value_max.value = value
        //}
      }
      graph_value_count.value++
    }
  }
  console.log('drawChart() Dataobj len=', Object.keys(dataObj).length, graph_value_count.value)

  if (graph_value_count.value > 0) {
    // create graph

    const barWidth = graph_barwidth.value
    const barSpace = 20
    const graph_dot_r = 3
    const leftMargin = 30
    const rightMargin = 20
    const bottomMargin = 120
    const topMargin = 30

    const height = 400

    d3.selectAll('#karps_graph svg').remove()

    /*
    const width =
      (barWidth + barSpace) *
      (graph_value_count.value < graph_max_number_of_values
        ? graph_value_count.value
        : graph_max_number_of_values)
    */
    const width = (barWidth + barSpace) * graph_value_count.value

    const svg = d3
      .select('#karps_graph')
      .append('svg')
      .attr('width', width + leftMargin + rightMargin)
      .attr('height', height + topMargin + bottomMargin)

    // X scale and axis
    const xscale = d3.scaleBand().domain(Object.keys(dataObj)).range([0, width])
    const x_axis = d3.axisBottom(xscale)

    if (graph_textangled.value) {
      svg
        .append('g')
        .attr('transform', `translate(${leftMargin}, ${topMargin + height})`)
        .call(x_axis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-65)')
    } else {
      svg
        .append('g')
        .attr('transform', `translate(${leftMargin}, ${topMargin + height})`)
        .call(x_axis)
    }

    // Y scale and axis

    const yscale = d3.scaleLinear().domain([0, graph_value_max.value]).range([height, 0])
    const yAxisTicks = yscale.ticks().filter(Number.isInteger)
    const y_axis = d3.axisLeft(yscale).tickValues(yAxisTicks).tickFormat(d3.format('d'))

    svg.append('g').attr('transform', `translate(${leftMargin}, ${topMargin})`).call(y_axis)

    Object.values(dataObj).forEach((element, index) => {
      const g = svg.append('g')

      const x = index * (barWidth + barSpace) + leftMargin / 2

      g.append('rect')
        .attr('x', x)
        .attr('y', yscale(element as number))
        .attr('height', height - yscale(element as number))
        .attr('width', barWidth)
        .attr('fill', '#F0581A')
        .attr('transform', `translate(${leftMargin}, ${topMargin})`)

      // dot
      if (graph_dots.value) {
        g.append('circle')
          .attr('cx', x + leftMargin + barWidth / 2)
          .attr('cy', yscale(element as number) + 30)
          .attr('r', graph_dot_r)
          .attr('fill', '#000000')
      }

      g.append('text')
        .attr('x', x + barWidth / 2)
        .attr('y', yscale(element as number) - graph_dot_r - 1)
        .attr('text-anchor', 'middle')
        .text(element)
        .attr('transform', `translate(${leftMargin}, ${topMargin})`)
    })
  } else {
    d3.selectAll('#karps_graph svg').remove()
  }
}

// Export graph as SVG
// https://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an
const exportSVG = () => {
  const svgEl = document.getElementById('karps_graph')
  if (svgEl !== null) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const svgData = svgEl.innerHTML
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = 'overview.svg'
    downloadLink.click()
  }
}

const updateOverview = () => {
  if (showOverview.value) {
    drawChart()
  }
}
</script>

<template>
  <div v-if="!lexicalStorage.isStart">
    <!-- statistics settings -->
    <div class="statistics" ref="dropdownContainerS">
      <!-- chose field for compilation -->
      <div
        class="statistics-dropdown"
        :class="{
          'statistics-dropdown-open': isDropdownColumns,
          'statistics-dropdown-disabled': lexicalStorage.selectedDatasets.length === 0,
        }"
      >
        <span>{{ $t('dataselector.statistics.parameter') }}</span>
        <div class="statistics-dropdown-toggle" @click="toggleDropdownCompileFields">
          <span v-if="selectedCompileFields.length === 0">{{
            $t('dataselector.statistics.noparameter')
          }}</span>
          <span v-else>{{
            selectedCompileFields.map((x) => lexicalStorage.localizeField(x)).join(', ')
          }}</span>
        </div>
        <div class="statistics-dropdown-menu" v-if="isDropdownCompileFields">
          <label
            v-for="param in currentCommonFields"
            :key="param.name"
            class="statistics-dropdown-item"
          >
            <input
              type="checkbox"
              :value="param.name"
              v-model="selectedCompileFields"
              @change="updateCompileParams"
            />
            {{ lexicalStorage.localizeField(param.name) }}
          </label>
        </div>
      </div>
      <!-- select additional fields for statistics -->
      <div
        class="statistics-dropdown"
        :class="{
          'statistics-dropdown-open': isDropdownColumns,
          'statistics-dropdown-disabled': lexicalStorage.selectedDatasets.length === 0,
        }"
      >
        <span>{{ $t('dataselector.statistics.columns') }}</span>
        <div class="statistics-dropdown-toggle" @click="toggleDropdownColumns">
          <span v-if="selectedColumns.length === 0">{{
            $t('dataselector.statistics.nocolumns')
          }}</span>
          <span v-else
            >{{ selectedColumns.map((x) => lexicalStorage.localizeField(x)).join(', ') }}
          </span>
        </div>
        <div class="statistics-dropdown-menu" v-if="isDropdownColumns">
          <label class="statistics-dropdown-item">
            <input type="checkbox" v-model="updateShowHitsCheckbox" @change="updateShowHits" />
            {{ $t('dataselector.statistics.nocolumns') }}
          </label>
          <label
            v-for="param in currentCommonFields"
            :key="param.name"
            class="statistics-dropdown-item"
          >
            <input
              type="checkbox"
              :value="param.name"
              v-model="selectedColumns"
              @change="updateColumns"
            />
            {{ lexicalStorage.localizeField(param.name) }}
          </label>
        </div>
        <div>
          <!-- show count instead of value -->
          <label for="columnCount">
            <input type="checkbox" id="columnCount" value="true" v-model="columnCount" />
            {{ $t('statistics.showColumnCount') }}</label
          >
        </div>
      </div>
      <div v-if="currentResult.length">
        <div>
          <button @click="exportCSV()" class="export-button">
            {{ $t('statistics.exportCSV') }}
          </button>
        </div>
        <div>
          <label for="showOverviewCheckbox">
            <input
              type="checkbox"
              id="showOverviewCheckbox"
              v-model="showOverview"
              @change="updateOverview()"
            />
            {{ $t('statistics.showOverview') }}
          </label>
        </div>
        <div>
          <!-- show all cells expanded -->
          <label for="showExpanded">
            <input type="checkbox" id="showExpanded" value="true" v-model="showExpanded" />
            {{ $t('table.show.expanded') }}</label
          >
        </div>
      </div>
    </div>

    <!-- show overview/graph -->
    <div v-if="showOverview" class="overview-wrapper">
      <div class="overview-settings">
        <button @click="exportSVG()" class="export-button">{{ $t('graphs.export.svg') }}</button>
        <!--
      <button @click="exportPNG()" class="export-button">{{ $t('graphs.export.png') }}</button>
      -->
        <span class="overview-setting">
          {{ $t('graphs.threshold') }}
          <input
            type="number"
            size="5"
            min="0"
            v-model="graph_threshold"
            @change="updateOverview"
          />
        </span>
        <span class="overview-setting">
          <input type="checkbox" v-model="graph_textangled" @change="updateOverview" />
          {{ $t('graphs.textangled') }}
        </span>
        <span class="overview-setting">
          {{ $t('graphs.barwidth') }}
          <input type="number" size="5" min="0" v-model="graph_barwidth" @change="updateOverview" />
        </span>
        <span class="overview-setting">
          <input type="checkbox" v-model="graph_dots" @change="updateOverview" />
          {{ $t('graphs.dots') }}
        </span>
      </div>
      <!--
      <div v-if="graph_value_count > graph_max_number_of_values" class="overview-max">
        {{ $t('graphs.maxnumberofvalues', { number: graph_max_number_of_values }) }}
      </div>
      -->
      <div id="karps_graph"></div>
    </div>

    <!-- show table -->
    <div v-else class="table-wrapper">
      <!-- show error message -->
      <p v-if="errorMessage != ''" class="message">
        {{ errorMessage }}
      </p>
      <!-- show no data message -->
      <p v-else-if="lexicalStorage.selectedDatasets.length == 0" class="message">
        {{ $t('message.nodatasetselected') }}
      </p>
      <!-- show loading message -->
      <p v-else-if="lexicalStorage.isLoading > 0" class="message-big">
        {{ $t('message.loading') }}
      </p>
      <p v-if="!lexicalStorage.isData" class="message-big">
        {{ $t('error.nodata') }}
      </p>

      <table v-if="currentResult.length" class="fancy-table">
        <thead>
          <!-- show number of hits -->
          <tr>
            <td colspan="100%" class="dataset-label">
              {{ $t('statistics.numberOfHits') }}:
              {{ currentResult.length }}
            </td>
          </tr>

          <tr>
            <th
              v-for="(key, index) in tableHeaders"
              :key="index"
              @click="sortTable(String(index))"
              :class="{
                'header-list': lexicalStorage.isList(key.columnField),
                'header-total': key.type == 'total',
                'header-compile': key.type == 'compile',
              }"
            >
              <div class="header-content">
                <template v-if="key.type == 'compile'">
                  <span>
                    {{ lexicalStorage.localizeField(key.columnField) }}
                  </span>
                  <!--
                  <span>
                    {{
                      lexicalStorage.isList(key.columnField)
                        ? '(' + t('table.header.list') + ')'
                        : ''
                    }}
                  </span>-->
                </template>
                <template v-if="key.type == 'value'">
                  <div class="header-value-col">
                    <div class="header-value-row">
                      <span>
                        {{ lexicalStorage.localizeField(key.columnField) }}
                        <!--{{
                          lexicalStorage.isList(key.columnField)
                            ? '(' + t('table.header.list') + ')'
                            : ''
                      }}-->
                      </span>

                      <span
                        class="header-sortable"
                        :class="{
                          'header-sortable-selected': lexicalStorage.sortField == key.columnField,
                        }"
                        v-if="currentCommonFields.find((obj) => obj.name === key.columnField)"
                        @click="doSort(key.columnField)"
                      >
                        {{
                          lexicalStorage.sortOrder == 'asc' ||
                          lexicalStorage.sortField != key.columnField
                            ? '▼'
                            : '▲'
                        }}
                      </span>
                    </div>
                    <div>
                      <span class="resource">
                        {{ lexicalStorage.datasetLabels[key.headerValue] }}
                      </span>
                    </div>
                  </div>
                </template>
                <template v-if="key.type == 'total'">
                  <span v-if="columnCount && selectedColumns.length > 0">
                    <template v-if="key.headerField">
                      {{ lexicalStorage.localizeField(key.headerField) }}<br />
                      {{ key.headerValue }}
                    </template>
                    <template v-else>
                      {{ t('statistics.total') }}
                    </template>
                  </span>
                  <span v-else-if="key.headerField">
                    <span v-if="selectedColumns.length > 0">
                      {{ lexicalStorage.localizeField(key.headerField) }}<br />
                      {{ key.headerValue }}
                    </span>
                    <span v-else>
                      {{ lexicalStorage.datasetLabels[key.headerValue] }}
                    </span>
                  </span>
                  <span v-else>
                    {{ t('statistics.total') }}
                  </span>
                </template>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedData" :key="item + '-' + index">
            <td v-for="(value, key) in item" :key="key">
              <template v-if="showExpanded">
                <span v-html="formatCell(value)"></span>
              </template>
              <template v-else>
                <MaxHeight :max-height="32">
                  <span v-html="formatCell(value)"></span>
                </MaxHeight>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- show pagers -->
      <div v-if="currentResult.length" class="pagination">
        <button @click="firstPage" :disabled="currentPage === 1">
          <i class="material-icons">first_page</i>
        </button>
        <button @click="prevPage" :disabled="currentPage === 1">
          <i class="material-icons">chevron_left</i>
        </button>
        <span style="color: var(--color-text)"> {{ currentPage }} of {{ totalPages }} </span>
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

.overview-wrapper {
  display: grid;
  position: relative;
  /* margin-top: 2rem; */
  padding: 1rem;
}

.overview-settings {
  padding: 0;
}

.overview-setting {
  padding-left: 1rem;
}

.overview-max {
  margin-top: 1rem;
}

.tab {
  display: inline-block;
  padding: 0.7rem 1rem;
  background-color: var(--table-head-bg);
  color: var(--color-heading);
  font-weight: bold;
  border: 1px solid var(--color-border);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  position: relative;
  width: fit-content;
}

/* table */

.table-wrapper {
  display: grid;
  position: relative;
  /* margin-top: 2rem; */
  padding-left: 0.5rem;
  padding-top: 0.5rem;
}

.fancy-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 1rem;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  /* cursor: pointer; */
  vertical-align: top;
}

th .resource {
  font-style: italic;
}

.dataset-label {
  text-align: center;
  background-color: white;
  color: black;
  font-weight: bold;
}

.header-content {
  display: flex;
  align-items: top;
  flex-direction: row;
  justify-content: space-between;
}

.header-value-col {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.header-value-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.header-sortable {
  color: var(--sb-grey-medium);
  cursor: pointer;
}

.header-sortable-selected {
  color: var(--sb-orange);
}

/*
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content span {
  display: flex;
  align-items: center;
}
*/

.header-compile {
  background-color: var(--sb-orange);
  color: white;
}

.header-list {
  background-color: var(--sb-grey-light);
  color: black;
}

.header-total {
  background-color: black;
  color: white;
}

/* elements */

.export-button {
  margin-top: 0rem;
}

.overview-settings .export-button {
  margin: 0;
}

/* table */

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

/* pagination */

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

/* Info and error messages */

.message {
  margin: auto;
  text-align: center;
  font-style: italic;
}

.message-big {
  margin: auto;
  text-align: center;
  font-style: italic;
  font-size: x-large;
  margin-bottom: 1rem;
}
</style>
