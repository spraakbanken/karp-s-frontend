<template>
  <div v-if="activeTab === 'table'">
    <table v-if="filteredDataset.length" class="fancy-table">
      <thead>
        <tr>
          <th v-for="(value, key) in filteredDataset[0]" :key="key" @click="sortTable(String(key))">
            <div class="header-content">
              <span>{{ key }}</span>
              <span v-if="sortKey === key">
                <i class="material-icons">{{
                  sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'
                }}</i>
              </span>
              <span v-else>
                <i class="material-icons">sort</i>
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in paginatedData" :key="item.rank + '-' + index">
          <td v-for="(value, key) in item" :key="key">
            {{ Array.isArray(value) ? value.join(', ') : value }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="filteredDataset.length" class="pagination">
      <button @click="firstPage" :disabled="currentPage === 1">
        <i class="material-icons">first_page</i>
      </button>
      <button @click="prevPage" :disabled="currentPage === 1">
        <i class="material-icons">chevron_left</i>
      </button>
      <span>{{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        <i class="material-icons">chevron_right</i>
      </button>
      <button @click="lastPage" :disabled="currentPage === totalPages">
        <i class="material-icons">last_page</i>
      </button>
      <label for="itemsPerPage">Items per page:</label>
      <select id="itemsPerPage" v-model="itemsPerPage" class="items-per-page">
        <option v-for="option in [10, 20, 50, 100]" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { selectedDataset, searchQuery, activeTab } from '@/stores/store'

const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const filteredDataset = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return selectedDataset.value.filter((item) =>
    Object.values(item).some((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(query)
      } else if (Array.isArray(value)) {
        return value.join(', ').toLowerCase().includes(query)
      }
      return false
    }),
  )
})

const sortedDataset = computed(() => {
  if (!sortKey.value) return filteredDataset.value

  return [...filteredDataset.value].sort((a, b) => {
    const aValue = a[sortKey.value]
    const bValue = b[sortKey.value]

    if (aValue === bValue) return 0

    const order = sortOrder.value === 'asc' ? 1 : -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * order
    }

    return (aValue as number) > (bValue as number) ? 1 : -1 * order
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedDataset.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredDataset.value.length / itemsPerPage.value)
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

const sortTable = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}
</script>

<style scoped>
.fancy-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 1rem;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

th,
td {
  padding: 0.75rem;
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
</style>
