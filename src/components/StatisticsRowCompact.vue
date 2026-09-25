<script setup lang="ts">
import { nextTick, onMounted, onUpdated, ref } from 'vue'
import { useToggle } from '@vueuse/core'
//import type { ColumnVisField, EntryS } from '@/types/datasetConfig'
import { buildEqualsQuery, compileRowSearch, formatCell } from '@/utils/utils'
import {
  isStatisticsObjectCell,
  type CountHeadersColumn,
  type StatisticsDataset,
} from '@/types/datasetConfig'
import { ROW_MAX_HEIGHT, BE_STATISTICS_VALUES_ID } from '@/utils/constants'
import { isNumber } from 'es-toolkit/compat'
import { lexicalStore } from '@/stores/store'

const props = defineProps<{
  item: StatisticsDataset
  tableRow: number
  columnHeads: CountHeadersColumn[]
  showCompact: boolean
  updateShowHitsCheckbox: boolean
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

const refClick = (tCol: number) => {
  const cell = props.item[tCol]
  const header = lexicalStorage.statisticsHeaders[tCol]
  if (cell === undefined || header === undefined) {
    return
  }

  if (tCol === lexicalStorage.selectedCompileFields.length) {
    const search = compileRowSearch(
      props.item,
      props.columnHeads,
      lexicalStorage.selectedCompileFields.length,
    )
    if (!search) {
      return
    }
    lexicalStorage.addTabRef(lexicalStorage.selectedDatasets, search.label, search.query)
  } else if (tCol < lexicalStorage.selectedCompileFields.length) {
    // addTabRef requires a string
    if (typeof cell !== 'string') {
      return
    }
    lexicalStorage.addTabRef(
      lexicalStorage.selectedDatasets,
      cell,
      buildEqualsQuery(header.columnField, cell),
    )
  } else {
    // Only object cells can contain `values`
    if (!isStatisticsObjectCell(cell) || !cell.values?.length) {
      return
    }
    const value = cell.values[0].value
    lexicalStorage.addTabRef(
      [header.headerValue],
      value,
      buildEqualsQuery(header.columnField, value),
    )
  }
  showSnackbar()
}

/* handle compact and expanded view of rows */

const tableHeightFlag = ref(false)
const tdRefs = ref<HTMLTableCellElement[]>([])

const measureHeight = () => {
  const tooTall = tdRefs.value.some((element) => element.scrollHeight > ROW_MAX_HEIGHT)

  if (tableHeightFlag.value !== tooTall) {
    tableHeightFlag.value = tooTall
  }
}

onMounted(() => nextTick(measureHeight))

onUpdated(() => nextTick(measureHeight))

const [expanded, toggleExpanded] = useToggle()
</script>

<template>
  <tr :class="{ 'limited-height': !expanded && tableHeightFlag }">
    <template v-for="(value, tableCol) in item" :key="tableCol">
      <!-- the total column always opens a reference search for this row's compile values -->
      <template v-if="tableCol === lexicalStorage.selectedCompileFields.length">
        <td
          class="numeric table-data total-column"
          :class="{
            'total-null':
              (isNumber(value) && value === 0) ||
              (isStatisticsObjectCell(value) && value.count === 0),
          }"
        >
          <a
            href="#"
            class="cell-clickable"
            @click.prevent="refClick(Number(tableCol))"
            v-html="
              formatCell(
                columnHeads[tableCol].columnField,
                value,
                undefined,
                undefined,
                updateShowHitsCheckbox,
              )
            "
          ></a>
        </td>
      </template>
      <!-- is value just a number? -->
      <template v-else-if="isNumber(value)">
        <!--first column -->
        <td
          v-if="tableHeightFlag && tableCol === 0 && showCompact"
          class="button-span"
          @click="toggleExpanded()"
        >
          <font-awesome-icon
            :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']"
            class="fa-icon"
          />
        </td>
        <td v-else-if="tableCol === 0 && showCompact"></td>
        <!-- show data as number-->
        <td :class="{ 'total-null': value === 0 }" class="table-data">
          {{ value }}
        </td>
      </template>
      <!-- is value just a number in an object? -->
      <template
        v-else-if="
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          (value.values?.length ?? 0) === 0
        "
      >
        <!--first column -->
        <td
          v-if="tableHeightFlag && tableCol === 0 && showCompact"
          class="button-span"
          @click="toggleExpanded()"
        >
          <font-awesome-icon
            :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']"
            class="fa-icon"
          />
        </td>
        <td v-else-if="tableCol === 0 && showCompact"></td>
        <td class="numeric table-data" :class="{ 'total-null': value.count === 0 }">
          {{ value.count }}
        </td>
      </template>
      <!-- other -->
      <template v-else>
        <!--first column -->
        <td
          v-if="tableHeightFlag && tableCol === 0 && showCompact"
          class="button-span"
          @click="toggleExpanded()"
        >
          <font-awesome-icon
            :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']"
            class="fa-icon"
          />
        </td>
        <td v-else-if="tableCol === 0 && showCompact"></td>
        <!--show data -->
        <td class="table-data">
          <div ref="tdRefs" :class="{ 'mhr-div': !expanded && tableHeightFlag }">
            <span
              v-html="
                formatCell(
                  columnHeads[tableCol].columnField,
                  value,
                  undefined,
                  undefined,
                  updateShowHitsCheckbox,
                )
              "
              @click="refClick(Number(tableCol))"
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
  /*font-size: 30px;*/
  border: none;
}

.button-slim {
  background-color: var(--sb-grey-dark);
  color: white;
  font-weight: bolder;
  font-size: larger;
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
