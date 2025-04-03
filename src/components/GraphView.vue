<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { Dataset } from '@/types/datasetConfig'
import { getStatisticsData } from '@/api/apiService'
import type { paramConfig } from '@/types/parameterPosition'
import * as d3 from 'd3'

const lexicalStorage = lexicalStore()
const currentTab = ref(lexicalStorage.activeTab)

const graph_max_number_of_values = 100

const currentResult = ref<Dataset[]>([])
const tableHeaders = ref<string[]>([])
//const currentTab = ref(lexicalStorage.activeTab)

const graph_threshold = ref<number>(5)
const graph_textangled = ref<boolean>(false)
const graph_barwidth = ref<number>(60)
const graph_dots = ref<boolean>(false)

const graph_value_max = ref<number>(0)
const graph_value_count = ref<number>(0)

const fetchData = async () => {
  const newParams = lexicalStorage.selectedParameters
  const newCompileParams = lexicalStorage.selectedCompileParams
  const newColumns = lexicalStorage.selectedColumns
  if (newParams && newCompileParams.length > 0) {
    console.log('fetchData', newCompileParams, newCompileParams)
    try {
      const { tableData, headers } = await getStatisticsData(
        newParams as Record<string, paramConfig>,
        newCompileParams as string[],
        newColumns as string[],
      )
      currentResult.value = tableData
      tableHeaders.value = headers
      // console.log('currentResult', currentResult.value);
      graph_threshold.value = 1
      drawChart()
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  } else {
    currentResult.value = []
  }
}

const drawChart = () => {
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
    const value: number = <number>row2[<number>row2_length - 1] // last # is always total
    //console.log('category=', category, 'value=', value)
    if (value >= graph_threshold.value) {
      if (graph_value_count.value < graph_max_number_of_values) {
        dataObj[category] = value
        if (value > graph_value_max.value) {
          graph_value_max.value = value
        }
      }
      graph_value_count.value++
    }
  }
  //console.log('drawChart() Dataobj len=', Object.keys(dataObj).length, graph_value_count.value)

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

    const width =
      (barWidth + barSpace) *
      (graph_value_count.value < graph_max_number_of_values
        ? graph_value_count.value
        : graph_max_number_of_values)

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
        .attr('y', yscale(element))
        .attr('height', height - yscale(element))
        .attr('width', barWidth)
        .attr('fill', '#F0581A')
        .attr('transform', `translate(${leftMargin}, ${topMargin})`)

      // dot
      if (graph_dots.value) {
        g.append('circle')
          .attr('cx', x + leftMargin + barWidth / 2)
          .attr('cy', yscale(element) + 30)
          .attr('r', graph_dot_r)
          .attr('fill', '#000000')
      }

      g.append('text')
        .attr('x', x + barWidth / 2)
        .attr('y', yscale(element) - graph_dot_r - 1)
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

watch(
  () => currentTab.value,
  () => {
    if (currentTab.value === 'graph') {
      fetchData()
    }
  },
  { immediate: true },
)

/*
watch(
  () => lexicalStorage.activeTab,
  (newTab, oldTab) => {
    if (newTab !== oldTab) {
      fetchData()
    }
  },
  { immediate: true },
)
  */

watch(
  () => [
    lexicalStorage.selectedParameters,
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
      <button @click="exportSVG()" class="export-button">{{ $t('graphs.export.svg') }}</button>
      <!--
      <button @click="exportPNG()" class="export-button">{{ $t('graphs.export.png') }}</button>
      -->
      <span class="graph-parameter">
        {{ $t('graphs.threshold') }}
        <input type="number" size="5" min="0" v-model="graph_threshold" @change="updateData" />
      </span>
      <span class="graph-parameter">
        <input type="checkbox" v-model="graph_textangled" @change="updateData" />
        {{ $t('graphs.textangled') }}
      </span>
      <span class="graph-parameter">
        {{ $t('graphs.barwidth') }}
        <input type="number" size="5" min="0" v-model="graph_barwidth" @change="updateData" />
      </span>
      <span class="graph-parameter">
        <input type="checkbox" v-model="graph_dots" @change="updateData" />
        {{ $t('graphs.dots') }}
      </span>
    </div>
    <p v-else class="message">{{ $t('error.nodata') }}</p>
    <p v-if="graph_value_count > graph_max_number_of_values">
      {{ $t('graphs.maxnumberofvalues', { number: graph_max_number_of_values }) }}
    </p>

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

.graph-parameter {
  margin-left: 1rem;
}
</style>
