<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'

const lexicalStorage = lexicalStore()

const selectedDatasets = computed({
  get: () => lexicalStorage.selectedDatasets,
  set: (value) => lexicalStorage.setSelectedDataset(value),
})
/*
const selectedTags = computed({
  get: () => lexicalStorage.selectedTags,
  set: (value) => lexicalStorage.setSelectedTag(value),
})
  */
const selectedParameters = computed({
  get: () => lexicalStorage.selectedParameters,
  set: (value) => lexicalStorage.setSelectedParameters(value),
})
const selectedCompileParams = computed({
  get: () => lexicalStorage.selectedCompileParams,
  set: (value) => lexicalStorage.setSelectedCompileParams(value),
})
const selectedColumns = computed({
  get: () => lexicalStorage.selectedColumns,
  set: (value) => lexicalStorage.setSelectedColumns(value),
})

const currentDatasets = computed(() => lexicalStorage.currentDatasets)
const currentTags = computed(() => lexicalStorage.currentTags)

const searchDatasets = ref('')
const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const isDropdownColumns = ref(false)
const isDropdownCompileParams = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const parameters = ref<Record<string, paramConfig>>({})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  isDropdownParams.value = false
  isDropdownColumns.value = false
  isDropdownCompileParams.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
    isDropdownParams.value = false
    isDropdownColumns.value = false
    isDropdownCompileParams.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const updateSelectedDataset = () => {
  lexicalStorage.setSelectedDataset(selectedDatasets.value)
}

const selectDataset = () => {
  updateSelectedDataset()
}

/*
const selectTags = () => {
  lexicalStorage.setSelectedTag(selectedTags.value)
}
*/
const selectTags = (tag: string) => {
  /*
  if (selectedTags.value.indexOf(tag) == -1) {
    selectedTags.value.push(tag)
  }
*/
  const currentConfig = lexicalStorage.currentConfig
  // select datasets that have one of the tags in newTags
  //selectedDatasets.value = []
  //for (const tag of newTags) {
  for (const elt of currentConfig.resources) {
    if (elt.tags !== undefined) {
      if (elt.tags.includes(tag)) {
        if (!selectedDatasets.value.includes(elt.resourceId)) {
          selectedDatasets.value.push(elt.resourceId)
        }
      }
    }
  }
  //}

  //lexicalStorage.setSelectedTag(selectedTags.value)
  lexicalStorage.setSelectedDataset(selectedDatasets.value)

  console.log('selectTags', tag, selectedDatasets.value)
}

const unselectTags = () => {
  selectedDatasets.value = []
}

const filterDatasets = computed(() => {
  /*
  if (!searchDatasets.value) {
    return currentDatasets.value
  }
*/
  let label: string = ''
  let arr: string[] = []
  const currentConfig = lexicalStorage.currentConfig
  for (const c of currentConfig.resources) {
    if (lexicalStorage.activeLocale == 'sv') {
      label = c.label.swe ? c.label.swe : c.label
    } else {
      label = c.label.eng ? c.label.eng : c.label
    }
    if (
      !searchDatasets.value ||
      label.toLowerCase().indexOf(searchDatasets.value.toLowerCase()) !== -1
    ) {
      arr.push(c.resourceId)
    }
  }

  arr = arr.sort(function (a, b) {
    return lexicalStorage.datasetLabels[a].localeCompare(
      lexicalStorage.datasetLabels[b],
      lexicalStorage.activeLocale,
      { numeric: true },
    )
  })

  //console.log('COMPUTED filterDatasets:', searchDatasets.value, currentDatasets.value, arr)

  return arr
})

watch(
  () => selectedDatasets.value,
  (newDatasets, oldDatasets) => {
    console.log('--DataSelection/watch 2', newDatasets, oldDatasets)
    if (newDatasets.length === 0) {
      parameters.value = {}
      selectedParameters.value = {}
      selectedColumns.value = []
      selectedCompileParams.value = []
      //updateData()
    }
  },
)

/*
watch(
  () => selectedTags.value,
  (newTags) => {
    const currentConfig = lexicalStorage.currentConfig
    // select datasets that have one of the tags in newTags
    selectedDatasets.value = []
    for (const tag of newTags) {
      for (const elt of currentConfig.resources) {
        if (elt.tags !== undefined) {
          if (elt.tags.includes(tag)) {
            if (!selectedDatasets.value.includes(elt.resourceId)) {
              selectedDatasets.value.push(elt.resourceId)
            }
          }
        }
      }
    }
  },
)
  */
</script>

<template>
  <div ref="dropdownContainer" class="data-component">
    <div class="data-selection">
      <span style="font-weight: bold">{{ $t('dataselector.datasets') }}</span>
      <div class="dropdown" :class="{ 'dropdown-open': isDropdownOpen }">
        <div class="dropdown-toggle" @click="toggleDropdown">
          {{
            selectedDatasets.length === 1
              ? $t('dataselector.dataset.selected')
              : $t('dataselector.datasets.selected')
          }}
          ({{ selectedDatasets.length }}
          {{ $t('dataselector.datasets.selected.of') }}
          {{ currentDatasets.length }})
        </div>
        <!-- dropdown -->

        <div class="dropdown-menu" v-if="isDropdownOpen">
          <div class="dropdown-group">{{ $t('dataselector.tags.title') }}</div>
          <!-- show tags -->
          <div class="dropdown-tags">
            <div v-for="tag in currentTags" :key="tag">
              <button @click="selectTags(tag)" class="tags-button">
                {{ lexicalStorage.currentConfig.tags[tag].label }}
              </button>
              <!-- show tags
          <input type="checkbox" :value="tag" v-model="selectedTags" @change="selectTags" />
            {{ lexicalStorage.currentConfig.tags[tag].label }} -->
            </div>
            <button @click="unselectTags()" class="tags-button">
              {{ $t('dataselector.tags.unselect') }}
            </button>
          </div>
          <!-- dataset list -->
          <div class="dropdown-group">{{ $t('dataselector.datasets.title') }}</div>
          <!-- filter -->
          <div class="dropdown-filter">
            {{ $t('dataselector.datasets.filter') }}: <input type="text" v-model="searchDatasets" />
          </div>
          <!-- list datasets -->
          <label v-for="dataset in filterDatasets" :key="dataset" class="dropdown-item">
            <input
              type="checkbox"
              :value="dataset"
              v-model="selectedDatasets"
              @change="selectDataset"
            />
            {{ lexicalStorage.datasetLabels[dataset] }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-component {
  padding: 1rem;
}

.search-container {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.dropdown {
  position: relative;
  margin-bottom: 1rem;
}

.dropdown-open {
  border-color: var(--sb-orange);
}

.dropdown-group {
  background-color: var(--sb-grey-light);
  padding-left: 0.5rem;
}

.dropdown-disabled {
  pointer-events: none;
  color: var(--sb-grey-medium);
  cursor: not-allowed;
}

.dropdown-toggle {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-open .dropdown-menu {
  border-color: var(--color-border-open);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: var(--color-text);
}

.dropdown-item input {
  margin-right: 0.5rem;
}
.dropdown-tags {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: var(--color-text);
}

.dropdown-tags input {
  margin-right: 0.5rem;
}
.dropdown-tags .tags-button {
  margin-right: 0.5rem;
}

.dropdown-filter {
  padding: 0.5rem 1rem;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group select {
  margin-right: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.input-group input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.statistics {
  background-color: var(--sb-grey-light);
  padding: 0.5rem;
  color: black;
}

.statistics-header {
  font-size: medium;
  font-weight: bold;
}

@media (max-width: 600px) {
  .search-input,
  .input-group select {
    height: 30px;
  }
}

@media (min-width: 601px) and (max-width: 1200px) {
  .search-input,
  .input-group select {
    height: 35px;
  }
}

@media (min-width: 1201px) {
  .search-input,
  .input-group select {
    height: 40px;
  }
}
</style>
