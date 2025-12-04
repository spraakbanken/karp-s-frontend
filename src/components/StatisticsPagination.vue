<script setup lang="ts">
import { computed } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

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
}
</script>

<template>
  <div class="pagination">
    <span>
      {{ $t('table.footer.page') }}: {{ currentPageStart }}
      {{ $t('table.of') }}
      {{ totalPages }}
    </span>
    <button @click="firstPage" :disabled="currentPageStart === 1">
      <span class="material-icons">first_page</span>
    </button>
    <button @click="prevPage" :disabled="currentPageStart === 1">
      <span class="material-icons">chevron_left</span>
    </button>
    <button @click="nextPage" :disabled="currentPageStart === totalPages">
      <span class="material-icons">chevron_right</span>
    </button>
    <button @click="lastPage" :disabled="currentPageStart === totalPages">
      <span class="material-icons">last_page</span>
    </button>

    <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }} </label>:
    <select @click="itemsPerPage" id="itemsPerPage" v-model="currentPageSize">
      <option v-for="option in [10, 25, 50, 100, 1000]" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>
<style src="@/assets/table.css" scoped></style>

<style scoped></style>
