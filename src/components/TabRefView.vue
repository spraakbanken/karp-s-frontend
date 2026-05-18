<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

import { groupBy } from 'es-toolkit'

import { ROWS_PER_PAGE } from '@/utils/constants'
import {
  type DatasetEntry,
  type DatasetResult,
  type Entry,
  type EntryS,
  type FieldConfig,
  entryWordField,
} from '@/types/datasetConfig'
import { getTabRefData } from '@/api/apiService'
import { formatCell, isImage } from '@/utils/utils'
import { checkJwtToken } from '@/api/authService'

const props = defineProps<{
  id: number
  resourceId: string[]
  columnField: string
  columnValue: string
}>()

const { t } = useI18n()

const lexicalStorage = lexicalStore()

/*
const tableResult = computed({
  get: () => lexicalStorage.tabRefSetup[props.id].tableResult,
  set: (value) => (lexicalStorage.tabRefSetup[props.id].tableResult = value),
})
*/

const tableResult: Ref<DatasetResult> = ref({
  hits: [],
  resourceHits: {},
  resourceOrder: {},
  total: 0,
})

// currentResult as returned from groupBy()
const tableResultGrp = ref<Record<string, { entry: Entry; resourceId: string }[]>>({})
// with rows sorted and put in (ordered) array
const tableResultGrpSorted = ref(lexicalStorage.tabRefSetup[props.id].tableResultGrpSorted)

const fetchData = async () => {
  checkJwtToken()

  lexicalStorage.tabRefSetup[props.id].isLoading = true
  const data = await getTabRefData(
    props.resourceId,
    props.columnField,
    props.columnValue,
    tablePageRowStart.value,
    tablePageSize.value,
  )
  if (Object.keys(data).length > 0) {
    tableResult.value = data
    lexicalStorage.tabRefSetup[props.id].tableTotal = tableResult.value.total
    groupData()
    // save data
    lexicalStorage.tabRefSetup[props.id].tableResultGrpSorted = tableResultGrpSorted.value
    lexicalStorage.tabRefSetup[props.id].isLoading = false
  }
}

const groupData = () => {
  tableResultGrp.value = groupBy(tableResult.value.hits, (item) => item.resourceId)
  tableResultGrpSorted.value = {}

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
      // fields in correct order
      const fieldsFromConfig: FieldConfig[] =
        lexicalStorage.fieldsInDatasets[dataset_unsorted[i].resourceId]
      // sorted row
      const e1: EntryS[] = []

      // add entryword as first column
      e1.push({ name: entryWordField, value: e0[entryWord] })

      // loop over config, when field is found, add value to new row/array
      for (const key in fieldsFromConfig) {
        e1.push({ name: fieldsFromConfig[key].name, value: e0[fieldsFromConfig[key].name] })
      }
      // add new row/array to sorted result
      tableResultGrpSorted.value[resId].push({ entry: e1, resourceId: resId })
    }
  }
}

const tablePageRowStart = ref(lexicalStorage.tabRefSetup[props.id].tablePageRowStart)
const tablePageSize = ref(lexicalStorage.tabRefSetup[props.id].tablePageSize)

const totalPages = computed(() => {
  return Math.ceil(lexicalStorage.tabRefSetup[props.id].tableTotal / tablePageSize.value)
})

const firstPage = () => {
  tablePageRowStart.value = 0
}

const prevPage = () => {
  if (tablePageRowStart.value > 0) {
    tablePageRowStart.value -= tablePageSize.value
    if (tablePageRowStart.value < 0) {
      tablePageRowStart.value = 0
    } else if (tablePageRowStart.value < tablePageSize.value) {
      tablePageRowStart.value = 0
    }
  }
}

const nextPage = () => {
  if (tablePageRowStart.value < lexicalStorage.tabRefSetup[props.id].tableTotal - 1) {
    tablePageRowStart.value += tablePageSize.value
  }
}

const lastPage = () => {
  tablePageRowStart.value =
    Math.floor((lexicalStorage.tabRefSetup[props.id].tableTotal - 1) / tablePageSize.value) *
    tablePageSize.value
}

const itemsPerPage = () => {
  //fetchData()
  // handled by watch()
}

watch(
  () => tablePageRowStart.value,
  () => {
    lexicalStorage.tabRefSetup[props.id].tablePageRowStart = tablePageRowStart.value
    fetchData()
  },
)

watch(
  () => tablePageSize.value,
  () => {
    lexicalStorage.tabRefSetup[props.id].tablePageSize = tablePageSize.value
    fetchData()
  },
)

onMounted(async () => {
  // query only on first showing
  if (Object.keys(tableResultGrpSorted.value).length === 0) {
    tablePageRowStart.value = 0
    tablePageSize.value = ROWS_PER_PAGE
    fetchData()
  } else {
    tablePageRowStart.value = lexicalStorage.tabRefSetup[props.id].tablePageRowStart
    tablePageSize.value = lexicalStorage.tabRefSetup[props.id].tablePageSize
  }
})
</script>

<template>
  <div class="table-wrapper">
    <p v-if="lexicalStorage.tabRefSetup[props.id].isLoading" class="message-big">
      {{ $t('message.loading') }}
    </p>

    <template v-for="(rItem, key, index) in tableResultGrpSorted" :key="index">
      <table class="fancy-table">
        <tbody>
          <!-- show dataset name -->
          <tr>
            <td colspan="100%" class="dataset-label">
              <span class="icon-placement">
                <font-awesome-icon :icon="['fas', 'square']" />
              </span>
              {{ lexicalStorage.datasetLabels[key] }}:
              {{ tableResultGrpSorted[key].length }}
            </td>
          </tr>

          <!-- column names -->
          <tr>
            <th
              v-for="(value, key) in rItem[0].entry"
              :key="key"
              :class="{
                'header-list': lexicalStorage.isList(value.name),
                'header-compile': value.name == entryWordField,
              }"
            >
              <div class="header-content">
                <span>
                  {{ lexicalStorage.localizeField(value.name) }}
                  <template v-if="value.name == entryWordField">
                    {{
                      '(' +
                      lexicalStorage.localizeField(
                        lexicalStorage.currentConfig.resources.find(
                          (i) => i.resourceId === rItem[0]['resourceId'],
                        )?.entryWord.field!,
                      ) +
                      ')'
                    }}
                  </template>
                </span>
              </div>
            </th>
          </tr>

          <!-- show dataset entries -->
          <template v-for="(cItem, cKey) in rItem" :key="cKey">
            <tr>
              <td
                v-for="(value2, key) in cItem.entry"
                :key="key"
                :style="isImage(value2.value) ? 'white-space: nowrap' : ''"
              >
                <span v-html="formatCell(value2.value)"></span>
                <span v-if="isImage(value2.value)">
                  <a
                    :href="'/karplabb/img?img=' + value2.value"
                    target="_blank"
                    :title="t('table.imgbrowse')"
                  >
                    <font-awesome-icon :icon="['fas', 'images']" />
                  </a>
                </span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>

    <!-- pagination -->
    <div class="pagination">
      <!--<div v-if="props.data.length" class="pagination">-->
      <button @click="firstPage" :disabled="tablePageRowStart === 0">
        <span> <font-awesome-icon :icon="['fas', 'backward-fast']" /> </span>
      </button>
      <button @click="prevPage" :disabled="tablePageRowStart === 0">
        <span> <font-awesome-icon :icon="['fas', 'backward']" /> </span>
      </button>
      <span style="color: var(--color-text)"
        >{{ $t('table.footer.page') }}: {{ Math.floor(tablePageRowStart / tablePageSize) + 1 }}
        {{ $t('table.of') }} {{ totalPages }} ({{ $t('table.footer.hit') }}:
        {{ tablePageRowStart + 1 }}-{{
          tablePageRowStart + tablePageSize > lexicalStorage.tabRefSetup[props.id].tableTotal
            ? lexicalStorage.tabRefSetup[props.id].tableTotal
            : tablePageRowStart + tablePageSize
        }}
        {{ $t('table.of') }} {{ lexicalStorage.tabRefSetup[props.id].tableTotal }})</span
      >
      <button
        @click="nextPage"
        :disabled="
          tablePageRowStart + tablePageSize >= lexicalStorage.tabRefSetup[props.id].tableTotal - 1
        "
      >
        <span> <font-awesome-icon :icon="['fas', 'forward']" /> </span>
      </button>
      <button
        @click="lastPage"
        :disabled="
          tablePageRowStart + tablePageSize >= lexicalStorage.tabRefSetup[props.id].tableTotal - 1
        "
      >
        <span> <font-awesome-icon :icon="['fas', 'forward-fast']" /> </span>
      </button>
      <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }}</label
      >:
      <select
        @click="itemsPerPage"
        id="itemsPerPage"
        v-model="tablePageSize"
        class="items-per-page"
      >
        <option v-for="option in [10, 25, 50, 100, 1000]" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<style src="@/assets/table.css" scoped></style>

<style scoped>
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

.dataset-label {
  text-align: left;
  background-color: var(--color-background);
  color: var(--color-text);
  font-weight: bold;
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
</style>
