<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { Dataset } from '@/types/datasetConfig'
import { getStatisticsData } from '@/api/apiService'
import type { paramConfig } from '@/types/parameterPosition'
import * as d3 from 'd3'

const lexicalStorage = lexicalStore()

const currentResult = ref<Dataset[]>([])
const tableHeaders = ref<string[]>([])
const currentTab = ref(lexicalStorage.activeTab)

const graph_threshold = ref<number>(5)

const fetchData = async () => {
  const newParams = lexicalStorage.activeParameters
  const newCompileParams = lexicalStorage.selectedCompileParams
  const newColumns = lexicalStorage.selectedColumns
  if (newParams || newCompileParams || newColumns) {
    try {
      const { tableData, headers } = await getStatisticsData(
        newParams as Record<string, paramConfig>,
        newCompileParams as string[],
        newColumns as string[],
      )
      currentResult.value = tableData
      tableHeaders.value = headers
      // console.log('currentResult', currentResult.value);
      drawChart()
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  } else {
    currentResult.value = []
  }
}

const drawChart = () => {
  const leftMargin = 30
  const rightMargin = 20
  const bottomMargin = 30
  const topMargin = 30

  let width = 500
  const height = 400

  const barWidth = 60
  const barSpace = 20

  interface dict {
    [key: string]: string | number
  }
  const dataObj: dict = {}
  let graph_value_max: number = 0
  let graph_value_count: number = 0
  //console.log('currentResult.value=', currentResult.value)
  // write data
  for (const row2 in currentResult.value) {
    const row = currentResult.value[row2]
    console.log('row=', row)
    const category: string = <string>row[0] // första
    const value: number = <number>row[1]
    //{{ Array.isArray(value) ? value.join(', ') : value }}
    console.log('category=', category, 'value=', value)
    //const key = value['baseform'] // ta alltid första
    if (value >= graph_threshold.value) {
      dataObj[category] = value // sista alltid total
      if (value > graph_value_max) {
        graph_value_max = value
      }
      graph_value_count++
    }
    console.log('Count=', graph_value_count, ' max=', graph_value_max)

    // bredare
    // hover
    // färger
    // legends?
  }

  // sort on size

  d3.selectAll('#karps_graph svg').remove()

  width = barWidth * graph_value_count

  const svg = d3
    .select('#karps_graph')
    .append('svg')
    .attr('width', width + leftMargin + rightMargin)
    .attr('height', height + topMargin + bottomMargin) // X scale and axis
  let xscale = d3.scaleBand().domain(Object.keys(dataObj)).range([0, width])
  let x_axis = d3.axisBottom(xscale)

  svg
    .append('g')
    .attr('transform', `translate(${leftMargin},   ${topMargin + height})`)
    .call(x_axis) // Y scale and axis

  // Math.max(...Object.values(dataObj)))
  let yscale = d3.scaleLinear().domain([0, graph_value_max]).range([height, 0])
  let y_axis = d3.axisLeft(yscale)

  svg.append('g').attr('transform', `translate(${leftMargin}, ${topMargin})`).call(y_axis)

  Object.values(dataObj).forEach((element, index) => {
    let g = svg.append('g')
    //let barWidth = 40
    //let x = index * barWidth + barWidth / 2
    /*
      let x =
        index * (width / Object.values(dataObj).length) +
        width / Object.values(dataObj).length / 2 -
        barWidth / 2
    */
    let x = index * (barWidth + barSpace)

    g.append('rect')
      .attr('x', x)
      .attr('y', yscale(element))
      .attr('height', height - yscale(element))
      .attr('width', barWidth)
      .attr('fill', '#F0581A')
      .attr('transform', `translate(${leftMargin}, ${topMargin})`)
    g.append('text')
      .attr('x', x)
      .attr('y', yscale(element))
      .text(element)
      .attr('transform', `translate(${leftMargin}, ${topMargin})`)
  })
}

const exportChart = () => {}

watch(
  () => lexicalStorage.activeTab, // currentTab.value,
  (newTab, oldTab) => {
    if (newTab !== oldTab) {
      console.log('FETCH & DRAW')

      fetchData()
      //  drawChart()
    }
  },
  { immediate: true },
)

watch(
  () => [
    lexicalStorage.activeParameters,
    lexicalStorage.selectedCompileParams,
    lexicalStorage.selectedColumns,
  ],
  () => {
    fetchData()
    drawChart()
  },
  { deep: true },
)

const updateData = () => {
  drawChart()
}
</script>

<template>
  <div class="table-wrapper">
    <div v-if="currentResult.length">
      <button @click="exportChart()" class="export-button">{{ $t('graphs.export') }}</button>
      <span>
        {{ $t('graphs.threshold') }}
        <input class="graph-count" type="number" v-model="graph_threshold" @change="updateData" />
      </span>
    </div>
    <p v-else class="message">{{ $t('error.nodata') }}</p>

    <div id="karps_graph"></div>
  </div>
</template>

<style scoped>
.table-wrapper {
  display: grid;
  position: relative;
  /* margin-top: 2rem; */
  padding: 1rem;
}

.export-button {
  margin: 0.5rem;
}

.message {
  margin: 0.5rem;
}
</style>
