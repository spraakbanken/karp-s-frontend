<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Dataset } from '@/types/datasetConfig'
import { lexicalStore } from '@/stores/store'
import { getSubTableData } from '@/api/apiService'
import { useI18n } from 'vue-i18n'
import type { forEach } from 'es-toolkit/compat'
import MaxHeight from '@/components/MaxHeight.vue'

const { t } = useI18n()

const lexicalStorage = lexicalStore()

const props = defineProps<{
  data: Dataset[]
  dataset: string
  totalHits: number
}>()

const currentPage = ref(1)
const itemsPerPage = ref(10)
const newData = ref<Dataset[]>([])
const isLoading = ref(false)

const processNewData = async () => {
  console.log('processNewData')
  isLoading.value = true
  try {
    const data = await getSubTableData(
      'baseform',
      currentPage.value,
      itemsPerPage.value,
      props.dataset,
    )
    newData.value = data
  } catch (error) {
    newData.value = []
    console.error('Error processing data:', error)
  }
  isLoading.value = false
}

watch(
  () => [currentPage.value, itemsPerPage.value, props.data],
  ([newPage, newItemsPerPage]) => {
    //const end = newPage * newItemsPerPage
    //itemsPerPage.value = newItemsPerPage
    // if (end > 10) {
    processNewData()
    // }
  },
  { immediate: true },
)

const totalPages = computed(() => {
  return Math.ceil(props.totalHits / itemsPerPage.value)
})

const firstPage = () => {
  currentPage.value = 1
}

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

const lastPage = () => {
  currentPage.value = totalPages.value
}
</script>

<template>
  <div class="table-wrapper">
    <div class="tab">
      {{ lexicalStorage.datasetLabels[props.dataset] }}
      ({{ props.totalHits }})
    </div>

    <table v-if="props.data.length" class="fancy-table">
      <thead>
        <tr>
          <th
            v-for="(value, key) in props.data[0]"
            :key="key"
            :class="{
              'header-list': lexicalStorage.isList(key as string),
            }"
          >
            <div class="header-content">
              <span
                :class="{
                  'header-list-text': lexicalStorage.isList(key as string),
                }"
                >{{ lexicalStorage.localizeField(key as string) }}
                {{
                  lexicalStorage.isList(key as string) ? '(' + t('table.header.list') + ')' : ''
                }}</span
              >
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(item, index) in newData" :key="item.rank + '-' + index">
          <td v-for="(value, key) in item" :key="key">
            <MaxHeight :max-height="200">
              <span v-html="lexicalStorage.formatCell(value)"></span>
            </MaxHeight>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isLoading" class="message">
      {{ $t('message.loading') }}
    </div>

    <div v-if="props.data.length" class="pagination">
      <button @click="firstPage" :disabled="currentPage === 1">
        <i class="material-icons">first_page</i>
      </button>
      <button @click="prevPage" :disabled="currentPage === 1">
        <i class="material-icons">chevron_left</i>
      </button>
      <span style="color: var(--color-text)"
        >{{ currentPage }} {{ $t('table.of') }} {{ totalPages }}</span
      >
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
</template>

<style scoped>
.table-wrapper {
  display: grid;
  position: relative;
  /* margin-top: 2rem; */
  padding: 0.5rem;
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

.fancy-table {
  border-collapse: collapse;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  margin: 0 0 0 0;
  text-align: left;
  width: 100%;
}

.button-expand {
  display: inline-block;
  border: 1px solid #333;
  cursor: pointer;
  padding: 1px 2px;
  border-radius: 4px;
  margin-left: 4px;
  font-size: 12px;
}

/*
th,
td {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border: 1px solid var(--color-border);
}
*/
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
  cursor: pointer;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content span {
  display: flex;
  align-items: center;
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

.header-list {
  font-style: italic;
  background-color: var(--sb-grey-light);
  color: black;
}

.message {
}
</style>
