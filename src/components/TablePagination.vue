<script setup lang="ts">
import { computed } from 'vue'
import { lexicalStore } from '@/stores/store'

const props = defineProps<{
  tableResultTotal: number
  paginationId: string
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
  localStorage.setItem('defaultTablePageSize', String(currentPageSize.value))
}
</script>

<template>
  <div class="pagination">
    <span class="subsection">
      <span>
        {{ $t('table.footer.page') }}: {{ Math.ceil(currentPageRowStart / currentPageSize) + 1 }}
        {{ $t('table.of') }}
        {{ totalPages + Math.ceil((currentPageRowStart % currentPageSize) / currentPageSize) }}
      </span>
    </span>
    <span class="subsection">
      <button
        @click="firstPage"
        :disabled="currentPageRowStart === 0"
        :aria-label="$t('aria.first.page')"
      >
        <font-awesome-icon :icon="['fas', 'backward-step']" />
      </button>
      <button
        @click="prevPage"
        :disabled="currentPageRowStart === 0"
        :aria-label="$t('aria.previous.page')"
      >
        <font-awesome-icon :icon="['fas', 'backward']" />
      </button>
      <button
        @click="nextPage"
        :disabled="currentPageRowStart + currentPageSize >= props.tableResultTotal - 1"
        :aria-label="$t('aria.next.page')"
      >
        <font-awesome-icon :icon="['fas', 'forward']" />
      </button>
      <button
        @click="lastPage"
        :disabled="currentPageRowStart + currentPageSize >= props.tableResultTotal - 1"
        :aria-label="$t('aria.last.page')"
      >
        <font-awesome-icon :icon="['fas', 'forward-step']" />
      </button>
    </span>
    <span class="subsection">
      <label :for="itemsPerPage + props.paginationId">{{ $t('table.footer.itemsperpage') }} </label
      >:
      <select
        @click="itemsPerPage"
        :id="itemsPerPage + props.paginationId"
        v-model="currentPageSize"
      >
        <option v-for="option in [10, 25, 50, 100, 1000]" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </span>
    <span class="subsection">
      {{ $t('table.footer.hit') }}: {{ currentPageRowStart + 1 }}-{{
        currentPageRowStart + currentPageSize > props.tableResultTotal
          ? props.tableResultTotal
          : currentPageRowStart + currentPageSize
      }}
      {{ $t('table.of') }} {{ props.tableResultTotal }}
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
