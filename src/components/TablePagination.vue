<script setup lang="ts">
import { computed } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  tableResultTotal: number
}>()

const lexicalStorage = lexicalStore()

// pages

const currentPageRowStart = computed({
  get: () => lexicalStorage.tablePageRowStart,
  set: (value) => (lexicalStorage.tablePageRowStart = value),
})

const currentPageSize = computed({
  get: () => lexicalStorage.tablePageSize,
  set: (value) => (lexicalStorage.tablePageSize = value),
})

const totalPages = computed(() => {
  return Math.ceil(props.tableResultTotal / currentPageSize.value)
})

const firstPage = () => {
  currentPageRowStart.value = 0
}

const prevPage = () => {
  if (currentPageRowStart.value > 0) {
    currentPageRowStart.value -= currentPageSize.value
    if (currentPageRowStart.value < 0) {
      currentPageRowStart.value = 0
    } /* else if (currentPageRowStart.value < currentPageSize.value) {
      currentPageRowStart.value = 0
    }*/
  }
}

const nextPage = () => {
  if (currentPageRowStart.value < props.tableResultTotal - 1) {
    currentPageRowStart.value += currentPageSize.value
  }
}

const lastPage = () => {
  currentPageRowStart.value =
    Math.floor((props.tableResultTotal - 1) / currentPageSize.value) * currentPageSize.value
}

const itemsPerPage = () => {
  //fetchData()
}
</script>

<template>
  <div class="pagination">
    <span>
      {{ $t('table.footer.page') }}: {{ Math.ceil(currentPageRowStart / currentPageSize) + 1 }}
      {{ $t('table.of') }}
      {{ totalPages + Math.ceil((currentPageRowStart % currentPageSize) / currentPageSize) }}
    </span>
    <button @click="firstPage" :disabled="currentPageRowStart === 0">
      <span class="material-icons">first_page</span>
    </button>
    <button @click="prevPage" :disabled="currentPageRowStart === 0">
      <span class="material-icons">chevron_left</span>
    </button>
    <button
      @click="nextPage"
      :disabled="currentPageRowStart + currentPageSize >= props.tableResultTotal - 1"
    >
      <span class="material-icons">chevron_right</span>
    </button>
    <button
      @click="lastPage"
      :disabled="currentPageRowStart + currentPageSize >= props.tableResultTotal - 1"
    >
      <span class="material-icons">last_page</span>
    </button>

    <label for="itemsPerPage">{{ $t('table.footer.itemsperpage') }} </label>:
    <select @click="itemsPerPage" id="itemsPerPage" v-model="currentPageSize">
      <option v-for="option in [10, 25, 50, 100, 1000]" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
    {{ $t('table.footer.hit') }}: {{ currentPageRowStart + 1 }}-{{
      currentPageRowStart + currentPageSize > props.tableResultTotal
        ? props.tableResultTotal
        : currentPageRowStart + currentPageSize
    }}
    {{ $t('table.of') }} {{ props.tableResultTotal }}
  </div>
</template>
<style src="@/assets/table.css" scoped></style>

<style scoped>
.pagination {
}
</style>
