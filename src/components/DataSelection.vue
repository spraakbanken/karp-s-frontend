<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'
import { secondsToDate } from '@/utils/utils'
import type { ResourceLocalized } from '@/types/datasetConfig'

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

const datasetInfo = ref(<ResourceLocalized>{
  label: '',
  description: '',
  fields: [],
  link: '',
  size: '',
  tags: [],
  updated: '',
  word: '',
})
const datasetInfoFill = (dataset: string) => {
  //lexicalStorage.currentConfig.resources[0].description.swe
  const elt = lexicalStorage.currentConfig.resources.find((x) => x.resourceId === dataset)
  if (elt != undefined) {
    if (lexicalStorage.activeLocale == 'sv') {
      datasetInfo.value['label'] = elt.label.swe ? elt.label.swe : (elt.label as unknown as string)
      datasetInfo.value['description'] = elt.description ? elt.description.swe : ''
    } else {
      datasetInfo.value['label'] = elt.label.eng ? elt.label.eng : (elt.label as unknown as string)
      datasetInfo.value['description'] = elt.description ? elt.description.eng : ''
    }
    datasetInfo.value['size'] = elt.size
    datasetInfo.value['updated'] = elt.updated ? secondsToDate(elt.updated) : ''
    datasetInfo.value['link'] = elt.link
    datasetInfo.value['word'] = elt.word
    datasetInfo.value['fields'] = elt.fields
  }
}

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

  //console.log('selectTags', tag, selectedDatasets.value)
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
      label = c.label.swe ? c.label.swe : (c.label as unknown as string)
    } else {
      label = c.label.eng ? c.label.eng : (c.label as unknown as string)
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
    //console.log('--DataSelection/watch 2', newDatasets, oldDatasets)
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

        <div
          class="dropdown-menu"
          v-if="isDropdownOpen"
          :class="{ 'datasets-list-wider': datasetInfo['label'] !== '' }"
        >
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
          <div class="datasets-group">
            <div class="datasets-list">
              <div v-for="dataset in filterDatasets" :key="dataset" class="dropdown-item">
                <div>
                  <input
                    type="checkbox"
                    :value="dataset"
                    v-model="selectedDatasets"
                    @change="selectDataset"
                  />
                  {{ lexicalStorage.datasetLabels[dataset] }}
                </div>
                <img
                  src="@/assets/sb_symbol_info.svg"
                  @click="datasetInfoFill(dataset)"
                  class="datasets-icon"
                />
              </div>
            </div>
            <div class="datasets-info">
              <div class="datasets-info-label">{{ datasetInfo.label }}</div>
              <div class="">{{ datasetInfo.description }}</div>
              <div class="datasets-info-label">{{ $t('dataset.updated') }}</div>
              <div class="">{{ datasetInfo.updated }}</div>
              <div class="datasets-info-label">{{ $t('dataset.size') }}</div>
              <div class="">{{ datasetInfo.size }}</div>
              <div class="datasets-info-label">{{ $t('dataset.link') }}</div>
              <div class="">
                <a :href="datasetInfo.link" target="_blank">{{ datasetInfo.link }}</a>
              </div>
              <div class="datasets-info-label">{{ $t('dataset.word') }}</div>
              <div class="">{{ datasetInfo.word }}</div>
              <div class="datasets-info-label">{{ $t('dataset.fields') }}</div>
              <div class="">
                <div v-for="item in datasetInfo.fields" :key="item">
                  {{ item }}
                </div>
              </div>
            </div>
          </div>
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

.datasets-group {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 400px;
  align-content: flex-start;
  background-color: var(--sb-grey-light);
}

.datasets-list {
  overflow: auto;
  max-height: 100%;
  width: 200px;
  background-color: white;
}

.datasets-list-wider {
  width: 500px;
}

.datasets-icon {
  float: right;
  display: block;
  margin-left: auto;
  padding: 0.5rem;
  width: 2rem;
}

.datasets-info {
  background-color: var(--sb-grey-light);
  padding: 0.5rem;
  width: 200px;
  white-space: pre-line;
}

.datasets-info-label {
  font-weight: bold;
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
