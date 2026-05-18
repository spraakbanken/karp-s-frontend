<script setup lang="ts">
import { ref } from 'vue'
import { useToggle } from '@vueuse/core'
//import type { ColumnVisField, EntryS } from '@/types/datasetConfig'
import { formatCell } from '@/utils/utils'
import type { Dataset } from '@/types/datasetConfig'
import { ROW_MAX_HEIGHT, BE_STATISTICS_VALUES_ID } from '@/utils/constants'
import { isNumber } from 'es-toolkit/compat'
import { lexicalStore } from '@/stores/store'

const props = defineProps<{
  item: Dataset
  tableRow: number
  showCompact: boolean
  updateShowHitsCheckbox: boolean
  paginatedDataRow: Dataset
}>()

const lexicalStorage = lexicalStore()

/* Show "popup" message that we have added a ref table */
function showSnackbar() {
  const x = document.getElementById('snackbar')
  if (x !== null) {
    x.className = 'show'
    setTimeout(function () {
      x.className = x.className.replace('show', '')
    }, 3000)
  }
}

const refClick = (tRow: number, tCol: number) => {
  showSnackbar()
  if (tCol < lexicalStorage.selectedCompileFields.length) {
    const xValue = props.paginatedDataRow[tCol]
    const xField = lexicalStorage.statisticsHeaders[tCol].columnField
    const xTables = lexicalStorage.selectedDatasets
    //console.log('CLICK0: ', xValue, xField, xTables)
    lexicalStorage.addTabRef(xTables, xField, xValue)
  } else {
    const xValue = props.paginatedDataRow[tCol].values[0].value
    const xField = lexicalStorage.statisticsHeaders[tCol].columnField
    const xTables = lexicalStorage.statisticsHeaders[tCol].headerValue
    //console.log('CLICK: ', tRow, tCol, xValue, xField, xTables)
    lexicalStorage.addTabRef([xTables], xField, xValue)
  }
}
const thflag = ref(false)
const tdRefs = ref([])
const isTooTall = () => {
  if (tdRefs.value.length > 0) {
    let h = 0
    tdRefs.value.forEach((element) => (h = element.offsetHeight > h ? element.offsetHeight : h))
    //console.log('tdrefs len:', tdRefs.value.length, h, props.item.resourceId)
    thflag.value = h > ROW_MAX_HEIGHT
    return h > ROW_MAX_HEIGHT
  } else {
    return false
  }
}
const [expanded, toggleExpanded] = useToggle(!props.showCompact)
</script>

<template>
  <tr :class="{ 'limited-height': !expanded && isTooTall() }">
    <template v-for="(value, tableCol) in item" :key="tableCol">
      <!-- is value just a number? -->
      <template v-if="isNumber(value)">
        <!--first column -->
        <td
          v-if="thflag && tableCol === 0 && showCompact"
          class="button-span"
          @click="toggleExpanded()"
        >
          <font-awesome-icon :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']" />
        </td>
        <td v-else-if="tableCol === 0 && showCompact"></td>
        <!-- show data as number-->
        <td
          :class="{
            'total-column': tableCol == lexicalStorage.selectedCompileFields.length,
            'total-null': value.count === 0,
          }"
        >
          {{ value }}
        </td>
      </template>
      <!-- is value just a number in an object? -->
      <template
        v-else-if="
          typeof value === 'object' &&
          value !== null &&
          ((BE_STATISTICS_VALUES_ID in value && value[BE_STATISTICS_VALUES_ID].length === 0) ||
            !(BE_STATISTICS_VALUES_ID in value))
        "
      >
        <!--first column -->
        <td
          v-if="thflag && tableCol === 0 && showCompact"
          class="button-span"
          @click="toggleExpanded()"
        >
          <font-awesome-icon :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']" />
        </td>
        <td v-else-if="tableCol === 0 && showCompact"></td>
        <td
          class="numeric"
          :class="{
            'total-column': tableCol == lexicalStorage.selectedCompileFields.length,
            'total-null': value.count === 0,
          }"
        >
          {{ value.count }}
        </td>
      </template>
      <!-- other -->
      <template v-else>
        <!--first column -->
        <td
          v-if="thflag && tableCol === 0 && showCompact"
          class="button-span"
          @click="toggleExpanded()"
        >
          <font-awesome-icon :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']" />
        </td>
        <td v-else-if="tableCol === 0 && showCompact"></td>
        <!--show data -->
        <td ref="tdRefs">
          <div :class="{ 'mhr-div': !expanded && thflag }">
            <span
              v-html="formatCell(value, undefined, undefined, updateShowHitsCheckbox)"
              @click="refClick(Number(tableRow), Number(tableCol))"
              class="cell-clickable"
            ></span>
          </div>
        </td>
      </template>
    </template>
  </tr>
</template>

<style src="@/assets/table.css" scoped></style>

<style scoped>
.limited-height {
  max-height: 33px;
  overflow: hidden;
}

.mhr-div {
  max-height: 29px;
  overflow: hidden;
}

.overflow-auto {
  overflow: hidden;
}

.button-span {
  margin: 0;
  padding: 0;
  cursor: pointer;
  vertical-align: text-bottom;
  font-size: 30px;
  border: none;
}

.button-slim {
  background-color: var(--sb-grey-dark);
  color: white;
  font-weight: bolder;
  font-size: larger;
}

.cell-clickable {
  color: var(--text-link);
  cursor: pointer;
}

td.total-column {
  background-color: var(--sb-grey-light);
  color: black;
  font-weight: bold;
  text-align: right;
}

.numeric {
  text-align: right;
}

/* table */

th.resource {
  font-style: italic;
}

tr.total {
  background-color: var(--sb-grey-light);
  color: black;
  font-weight: bold;
}

td.total-column {
  background-color: var(--sb-grey-light);
  color: black;
  font-weight: bold;
  text-align: right;
}

td.total-null {
  color: var(--sb-grey-light);
  text-align: right;
}

tr:nth-child(odd) td.total-null {
  color: #c0c0c0;
}

.numeric {
  text-align: right;
}

.dataset-label {
  text-align: left;
  background-color: white;
  color: black;
  font-weight: bold;
}
</style>
