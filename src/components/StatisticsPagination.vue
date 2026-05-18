<script setup lang="ts">
import { computed } from 'vue'
import { lexicalStore } from '@/stores/store'

const props = defineProps<{
  statisticsResultTotal: number
}>()

const lexicalStorage = lexicalStore()

// pages

// pages

const currentPageStart = computed({
  get: () => lexicalStorage.statisticsPageStart,
  set: (value) => (lexicalStorage.statisticsPageStart = value),
})
const currentPageSize = computed({
  get: () => lexicalStorage.statisticsPageSize,
  set: (value) => (lexicalStorage.statisticsPageSize = value),
})

const totalPages = computed(() => {
  return Math.ceil(props.statisticsResultTotal / currentPageSize.value)
})

const firstPage = () => {
  currentPageStart.value = 1
}

const prevPage = () => {
  if (currentPageStart.value > 1) {
    currentPageStart.value--
  }
}

const nextPage = () => {
  if (currentPageStart.value < totalPages.value) {
    currentPageStart.value++
  }
}

const lastPage = () => {
  currentPageStart.value = totalPages.value
}

const itemsPerPage = () => {
  currentPageStart.value = Math.ceil(
    currentPageStart.value * (lexicalStorage.statisticsPageStart / currentPageStart.value),
  )
  lexicalStorage.statisticsPageStart = currentPageStart.value
  lexicalStorage.statisticsPageSize = currentPageSize.value
  localStorage.setItem('defaultStatisticsPageSize', String(currentPageSize.value))
}
</script>

<template>
  <div class="pagination">
    <span class="subsection">
      <span>
        {{ $t('table.footer.page') }}: {{ currentPageStart }}
        {{ $t('table.of') }}
        {{ totalPages }}
      </span>
    </span>

    <span class="subsection">
      <button @click="firstPage" :disabled="currentPageStart === 1">
        <font-awesome-icon :icon="['fas', 'backward-step']" />
      </button>
      <button @click="prevPage" :disabled="currentPageStart === 1">
        <font-awesome-icon :icon="['fas', 'backward']" />
      </button>
      <button @click="nextPage" :disabled="currentPageStart === totalPages">
        <font-awesome-icon :icon="['fas', 'forward']" />
      </button>
      <button @click="lastPage" :disabled="currentPageStart === totalPages">
        <font-awesome-icon :icon="['fas', 'forward-step']" />
      </button>
    </span>

    <span class="subsection">
      <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }} </label>:
      <select @click="itemsPerPage" id="itemsPerPage" v-model="currentPageSize">
        <option v-for="option in [10, 25, 50, 100, 1000]" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </span>
  </div>
</template>
<style src="@/assets/table.css" scoped></style>

<style scoped>
.pagination {
}
.subsection {
  margin-right: 0.5rem;
}

.subsection button {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
</style>
