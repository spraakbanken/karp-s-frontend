<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'

const lexicalStorage = lexicalStore()

const selectedDatasets = computed({
  get: () => lexicalStorage.selectedDatasets,
  set: (value) => lexicalStorage.setSelectedDataset(value),
})
const selectedTags = computed({
  get: () => lexicalStorage.selectedTags,
  set: (value) => lexicalStorage.setSelectedTag(value),
})
const selectedParameters = computed({
  get: () => lexicalStorage.selectedParameters,
  set: (value) => lexicalStorage.setParameters(value),
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
const currentParams = computed(() => lexicalStorage.currentParameters)
//const totalDatasets = computed(() => lexicalStorage.totalDatasets)
/*
const selectedParametersArray = computed({
  get: () => Object.keys(lexicalStorage.selectedParameters),
  set: (value) => value,
})
  */
const selectedParametersArray = ref<string[]>([])
const searchDatasets = ref('')
const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const isDropdownColumns = ref(false)
const isDropdownCompileParams = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const parameters = ref<Record<string, paramConfig>>({})
const ParameterPosition = ['startswith', 'endswith', 'contains', 'equals', 'regex']
const ParameterPositionText = [
  'dataselector.parameter.position.startswith',
  'dataselector.parameter.position.endswith',
  'dataselector.parameter.position.contains',
  'dataselector.parameter.position.equals',
  'dataselector.parameter.position.regex',
]
const ParameterPositionEnabled = [true, false, false, true, false]

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  isDropdownParams.value = false
  isDropdownColumns.value = false
  isDropdownCompileParams.value = false
}

const toggleDropdownParams = () => {
  isDropdownParams.value = !isDropdownParams.value
  isDropdownOpen.value = false
  isDropdownColumns.value = false
  isDropdownCompileParams.value = false
}

const toggleDropdownColumns = () => {
  isDropdownColumns.value = !isDropdownColumns.value
  isDropdownOpen.value = false
  isDropdownParams.value = false
  isDropdownCompileParams.value = false
}

const toggleDropdownCompileParams = () => {
  isDropdownCompileParams.value = !isDropdownCompileParams.value
  isDropdownOpen.value = false
  isDropdownParams.value = false
  isDropdownColumns.value = false
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

const selectTags = () => {
  lexicalStorage.setSelectedTag(selectedTags.value)
}

// update state from URL
const updateData = () => {
  lexicalStorage.setParameters(parameters.value)
}

// update state from URL
const updateColumns = () => {
  lexicalStorage.setSelectedColumns(selectedColumns.value)
}

// update state from URL
const updateCompileParams = () => {
  lexicalStorage.setSelectedCompileParams(selectedCompileParams.value)
}

const filterDatasets = computed(() => {
  if (!searchDatasets.value) {
    return currentDatasets.value
  }
  //const locale = useI18n()
  let label = ''

  const arr = []
  const currentConfig = lexicalStorage.currentConfig
  for (const c of currentConfig.resources) {
    if (lexicalStorage.activeLocale == 'sv') {
      label = c.label.swe ? c.label.swe : c.label
    } else {
      label = c.label.eng ? c.label.eng : c.label
    }
    //const label: string = c.label.eng ? c.label.eng : c.label
    if (label.indexOf(searchDatasets.value) !== -1) {
      arr.push(c.resourceId)
    }
  }

  /*
  //const arr = lexicalStorage.datasetLabels
  //const query = searchDatasets.value
  //const x = arr.filter((element) => element.toLowerCase().indexOf(query.toLowerCase()) !== -1)
  const x = currentDatasets.value.filter((dataset) => dataset.indexOf(searchDatasets.value) !== -1)
  //     dataset.toLowerCase().includes(searchDatasets.value.toLowerCase()),
  */
  console.log('COMPUTED filterDatasets:', searchDatasets.value, currentDatasets.value, arr)

  return arr
})

watch(selectedParametersArray, (newParams) => {
  console.log('WATCH selectedParametersArray:', newParams)
  newParams.forEach((param) => {
    console.log('   param:', param)
    if (!parameters.value[param]) {
      parameters.value[param] = { value: '', position: 'equals' }
    }
  })

  Object.keys(parameters.value).forEach((param) => {
    if (!newParams.includes(param)) {
      delete parameters.value[param]
    }
  })
})

watch(
  () => currentParams.value,
  (newParams) => {
    console.log('--DataSelection/watch 1', newParams)
    if (newParams.length === 0) {
      parameters.value = {}
      selectedParameters.value = {}
      selectedColumns.value = []
      selectedCompileParams.value = []
      updateData()
    }
  },
)

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

watch(
  () => lexicalStorage.selectedParameters,
  (newSelectedParameters) => {
    console.log('watch selectedParameters', newSelectedParameters)
    selectedParametersArray.value = Object.keys(newSelectedParameters)
    console.log('-- parameters1', parameters, selectedParametersArray.value)
    Object.keys(newSelectedParameters).forEach((param) => {
      if (!parameters.value[param]) {
        parameters.value[param] = {
          value: newSelectedParameters[param].value,
          position: newSelectedParameters[param].position,
        }
      }
    })
    console.log('-- parameters2', parameters)
  },
)
</script>

<template>
  <div ref="dropdownContainer" class="data-component">
    <div class="data-selection">
      <span>{{ $t('dataselector.datasets') }}</span>
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
        <div class="dropdown-menu" v-if="isDropdownOpen">
          <div class="dropdown-group">{{ $t('dataselector.tags.title') }}</div>
          <div v-for="tag in currentTags" :key="tag" class="dropdown-tags">
            <input type="checkbox" :value="tag" v-model="selectedTags" @change="selectTags" />
            {{ lexicalStorage.currentConfig.tags[tag].label }}
          </div>
          <div class="dropdown-group">{{ $t('dataselector.datasets.title') }}</div>
          <div class="dropdown-filter">
            {{ $t('dataselector.datasets.filter') }}: <input type="text" v-model="searchDatasets" />
          </div>
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
    <!-- Select field(s) for search -->
    <div
      class="dropdown"
      :class="{
        'dropdown-open': isDropdownParams,
        'dropdown-disabled': selectedDatasets.length === 0,
      }"
      :disabled="selectedDatasets.length === 0"
    >
      <span>{{ $t('dataselector.parameters') }}</span>
      <div class="dropdown-toggle" @click="toggleDropdownParams">
        <span v-if="selectedDatasets.length === 0">{{ $t('dataselector.noparameters') }}</span>
        <span v-else-if="currentParams.length === 0">{{
          $t('dataselector.datasets.nocommon')
        }}</span>
        <span v-else-if="selectedParametersArray.length === 0">{{
          $t('dataselector.noparameters')
        }}</span>
        <span v-else>{{ selectedParametersArray.join(', ') }}</span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownParams">
        <label v-for="param in currentParams" :key="param.name" class="dropdown-item">
          <input type="checkbox" :value="param.name" v-model="selectedParametersArray" />
          {{ param.name }}
        </label>
      </div>
    </div>
    <!-- Search-box -->
    <div v-for="param in selectedParametersArray" :key="param" class="search-container">
      <span :for="param">{{ $t('dataselector.parameters.prefix') }}: {{ param }}</span>
      <div class="input-group">
        {{ console.log('Param=', param, selectedParametersArray) }}
        <select v-model="parameters[param].position">
          <option value="" disabled>{{ $t('dataselector.parameters.position') }}</option>
          <option
            v-for="(position, index) in ParameterPosition"
            :key="position"
            :value="position"
            :disabled="!ParameterPositionEnabled[index]"
          >
            {{ $t(ParameterPositionText[index]) }}
          </option>
        </select>
        <input
          class="search-input"
          type="text"
          :id="param"
          v-model="parameters[param].value"
          :placeholder="$t('dataselector.parameters.placeholder')"
          @change="updateData"
        />
      </div>
    </div>
    <!-- Statistics -->
    <div class="statistics">
      <div class="statistics-header">
        {{ $t('dataselector.statistics') }}
      </div>
      <!-- Chose field for compilation -->
      <div
        class="dropdown"
        :class="{
          'dropdown-open': isDropdownColumns,
          'dropdown-disabled': selectedDatasets.length === 0,
        }"
      >
        <span>{{ $t('dataselector.statistics.parameter') }}</span>
        <div class="dropdown-toggle" @click="toggleDropdownCompileParams">
          <span v-if="selectedCompileParams.length === 0">{{
            $t('dataselector.statistics.noparameter')
          }}</span>
          <span v-else>{{ selectedCompileParams.join(', ') }}</span>
        </div>
        <div class="dropdown-menu" v-if="isDropdownCompileParams">
          <label v-for="param in currentParams" :key="param.name" class="dropdown-item">
            <input
              type="checkbox"
              :value="param.name"
              v-model="selectedCompileParams"
              @change="updateCompileParams"
            />
            {{ param.name }}
          </label>
        </div>
      </div>
      <!-- Select fields for statistics -->
      <div
        class="dropdown"
        :class="{
          'dropdown-open': isDropdownColumns,
          'dropdown-disabled': selectedDatasets.length === 0,
        }"
      >
        <span>{{ $t('dataselector.statistics.columns') }}</span>
        <div class="dropdown-toggle" @click="toggleDropdownColumns">
          <span v-if="selectedColumns.length === 0">{{
            $t('dataselector.statistics.nocolumns')
          }}</span>
          <span v-else>{{ selectedColumns.join(', ') }}</span>
        </div>
        <div class="dropdown-menu" v-if="isDropdownColumns">
          <label v-for="param in currentParams" :key="param.name" class="dropdown-item">
            <input
              type="checkbox"
              :value="param.name"
              v-model="selectedColumns"
              @change="updateColumns"
            />
            {{ param.name }}
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
  opacity: 0.6;
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
