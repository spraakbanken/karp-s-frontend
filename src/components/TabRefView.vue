<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

import { groupBy } from 'es-toolkit'

import {
  type DatasetEntry,
  type Entry,
  type EntryS,
  type FieldConfig,
  entryWordField,
} from '@/types/datasetConfig'
import { getTabRefData } from '@/api/apiService'
import { formatCell } from '@/utils/utils'

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

const tableResult = ref({})

// currentResult as returned from groupBy()
const tableResultGrp = ref<Record<string, { entry: Entry; resourceId: string }[]>>({})
// with rows sorted and put in (ordered) array
const tableResultGrpSorted = ref(lexicalStorage.tabRefSetup[props.id].tableResultGrpSorted)

const fetchData = async () => {
  lexicalStorage.tabRefSetup[props.id].isLoading = true
  const data = await getTabRefData(props.resourceId, props.columnField, props.columnValue, 1, 9999)
  if (Object.keys(data).length > 0) {
    tableResult.value = data
    groupData()
    // save data
    lexicalStorage.tabRefSetup[props.id].tableResultGrpSorted = tableResultGrpSorted.value
    lexicalStorage.tabRefSetup[props.id].isLoading = false
  }
  //    tableResult.value = { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 }
}

const groupData = () => {
  tableResultGrp.value = groupBy(tableResult.value.hits, (item) => item.resourceId)
  tableResultGrpSorted.value = {}
  //console.log('fetchdata() - after getTableData()', tableResultGrp.value)

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

onMounted(async () => {
  if (Object.keys(tableResultGrpSorted.value).length === 0) {
    fetchData()
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
              <td v-for="(value2, key) in cItem.entry" :key="key">
                <span v-html="formatCell(value2.value)"></span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>
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
  background-color: var(--sb-orange-light);
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
</style>
