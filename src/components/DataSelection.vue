<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import {
  type SelectedFieldConfig,
  entryWordProperty,
  entryWordDescriptionProperty,
} from '@/types/datasetConfig'
import { secondsToDate } from '@/utils/utils'
import type { ResourceLocalized } from '@/types/datasetConfig'

const previousDataset = ref('')
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
const selectedFields = computed({
  get: () => lexicalStorage.selectedFields,
  set: (value) => lexicalStorage.setSelectedFields(value),
})
const selectedCompileParams = computed({
  get: () => lexicalStorage.selectedCompileFields,
  set: (value) => lexicalStorage.setSelectedCompileFields(value),
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
  [entryWordProperty]: '',
  [entryWordDescriptionProperty]: '',
})

const datasetInfoFill = (dataset: string) => {
  console.log('DSI: ', dataset, previousDataset.value)
  if (dataset !== previousDataset.value) {
    const elt = lexicalStorage.currentConfig.resources.find((x) => x.resourceId === dataset)
    if (elt != undefined) {
      //    if (datasetInfo.value['label'])
      if (lexicalStorage.activeLocale == 'sv') {
        datasetInfo.value['label'] = elt.label.swe
          ? elt.label.swe
          : (elt.label as unknown as string)
        datasetInfo.value['description'] = elt.description ? elt.description.swe : ''
        datasetInfo.value[entryWordDescriptionProperty] = (
          typeof elt[entryWordProperty].description == 'string'
            ? elt[entryWordProperty].description
            : elt[entryWordProperty].description.swe
        ) as string
      } else {
        datasetInfo.value['label'] = elt.label.eng
          ? elt.label.eng
          : (elt.label as unknown as string)
        datasetInfo.value['description'] = elt.description ? elt.description.eng : ''
        datasetInfo.value[entryWordDescriptionProperty] =
          typeof elt[entryWordProperty].description == 'string'
            ? elt[entryWordProperty].description
            : elt[entryWordProperty].description.eng
      }
      datasetInfo.value['size'] = elt.size
      datasetInfo.value['updated'] = elt.updated ? secondsToDate(elt.updated) : ''
      datasetInfo.value['link'] = elt.link
      datasetInfo.value[entryWordProperty] = elt[entryWordProperty].field
      datasetInfo.value['fields'] = elt.fields
      //}

      previousDataset.value = dataset
    }
  } else {
    datasetInfo.value['label'] = ''
    datasetInfo.value['description'] = ''
    datasetInfo.value['size'] = ''
    datasetInfo.value['updated'] = ''
    datasetInfo.value['link'] = ''
    datasetInfo.value[entryWordProperty] = ''
    datasetInfo.value['fields'] = []
    previousDataset.value = ''
  }
}

const searchDatasets = ref('')
const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const isDropdownColumns = ref(false)
const isDropdownCompileParams = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const fields = ref<Record<string, SelectedFieldConfig>>({})

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

const selectDataset = () => {
  console.log('selectDataset:', selectedDatasets.value.length)
  lexicalStorage.setSelectedDataset(selectedDatasets.value)
}

// INFO: doesn't trigger the watch (because selectedDatasets is "computed")
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

  // TODO: unneccessary?
  //lexicalStorage.setSelectedDataset(selectedDatasets.value)
  selectDataset()
}

const unselectTags = () => {
  //  selectedDatasets.value = []
  lexicalStorage.setSelectedDataset([])
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
  () => selectedDatasets,
  (newDatasets, oldDatasets) => {
    console.log('WATCH: DataSelection selectedDatasets', newDatasets)
    if (oldDatasets.value.length === 0) {
      // set "ingångsord" to default, also for statistics
      lexicalStorage.setStartField()
    }
    // console.log('--DataSelection/watch 2', newDatasets, oldDatasets)
    if (newDatasets.value.length === 0) {
      fields.value = {}
      selectedFields.value = {}
      selectedColumns.value = []
      selectedCompileParams.value = []
      lexicalStorage.setIsSearch(true)
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
    <!-- <span style="font-weight: bold">{{ $t('dataselector.datasets') }}</span> -->
    <div class="dropdown" :class="{ 'dropdown-open': isDropdownOpen }">
      <div class="dropdown-toggle" @click="toggleDropdown">
        {{ selectedDatasets.length }}
        {{ $t('dataselector.datasets.selected.of') }}
        {{ currentDatasets.length }}
        {{
          selectedDatasets.length === 1
            ? $t('dataselector.dataset.selected')
            : $t('dataselector.datasets.selected')
        }}
        <i class="arrow-down"></i>
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

          <div class="datasets-info" v-if="datasetInfo['label'] !== ''">
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
            <div class="">{{ datasetInfo[entryWordProperty] }}</div>
            <div class="datasets-info-description">
              {{ datasetInfo[entryWordDescriptionProperty] }}
            </div>
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
</template>

<style scoped>
.data-component {
  padding: 0rem;
  width: 300px;
}

.dropdown {
  border: 1px solid var(--sb-orange-light);
  background-color: var(--button-background-alt);
  border-radius: 4px;
  margin-bottom: 1rem;
  position: relative;
  color: black;
}

.dropdown-open {
  border-color: var(--sb-orange);
}

.dropdown-group {
  background-color: var(--sb-grey-light);
  color: black;
  padding-left: 0.5rem;
}

.dropdown-disabled {
  color: var(--sb-grey-medium);
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-toggle {
  cursor: pointer;
  margin: auto;
  padding: 0.5rem;
  width: 90%;
  text-align: center;
}

.dropdown:hover {
  background-color: white;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  max-height: 500px;
  scrollbar-width: 0;
  overflow-y: visible;
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
  color: var(--color-text);
}

.datasets-group {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  max-height: 360px;
  align-content: flex-start;
  color: var(--color-text);
  overflow-y: scroll;
}

.datasets-list {
  max-height: 100%;
  width: 280px;
  background-color: var(--color-background);
  overflow-y: auto;
}

.datasets-list-wider {
  width: 550px;
}

.datasets-icon {
  float: right;
  display: block;
  margin-left: auto;
  padding: 0.5rem;
  width: 2rem;
}

.datasets-info {
  background-color: var(--color-background);
  padding: 0.5rem;
  width: 260px;
  white-space: pre-line;
  overflow-y: auto;
}

.datasets-info-label {
  font-weight: bold;
}

.datasets-info-description {
  font-style: italic;
}
</style>
