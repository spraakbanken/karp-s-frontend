<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'

const lexicalStorage = lexicalStore()

const selectedDatasets = ref(lexicalStorage.selectedDatasets) // selectedKeys
const currentDatasets = computed(() => lexicalStorage.datasetKeys)
const selectedParams = ref(lexicalStorage.selectedParams)
const selectedColumns = ref(lexicalStorage.selectedColumns)
const selectedCompileParams = ref(lexicalStorage.selectedCompileParams)
const paramsCollection = computed(() => lexicalStorage.currentParams)
const totalDatasets = computed(() => lexicalStorage.totalDatasets)

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

watch(selectedParams, (newParams) => {
  newParams.forEach((param) => {
    if (!parameters.value[param]) {
      parameters.value[param] = { value: '', position: 'equals' }
    }
  })

  Object.keys(parameters.value).forEach((param) => {
    if (!newParams.includes(param)) {
      delete parameters.value[param]
    }
  })
  // console.log('parameters', parameters.value)
})

// paramsCollection = available fields in selected datasets
watch(
  () => paramsCollection.value,
  (newParams) => {
    console.log('DS WATCH1')
    if (newParams.length === 0) {
      parameters.value = {}
      selectedParams.value = []
      selectedColumns.value = []
      selectedCompileParams.value = []
      updateData()
    }
  },
)

watch(
  () => selectedDatasets.value,
  (newDatasets) => {
    console.log('DS WATCH2')
    if (newDatasets.length === 0) {
      parameters.value = {}
      selectedParams.value = []
      selectedColumns.value = []
      selectedCompileParams.value = []
      //updateData()
    }
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
          {{ totalDatasets }})
        </div>
        <div class="dropdown-menu" v-if="isDropdownOpen">
          <label v-for="dataset in currentDatasets" :key="dataset" class="dropdown-item">
            <input
              type="checkbox"
              :value="dataset"
              v-model="selectedDatasets"
              @change="selectDataset"
            />
            {{ lexicalStorage.lexicalLabels[dataset] }}
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
        <span v-else-if="paramsCollection.length === 0">{{
          $t('dataselector.datasets.nocommon')
        }}</span>
        <span v-else-if="selectedParams.length === 0">{{ $t('dataselector.noparameters') }}</span>
        <span v-else>{{ selectedParams.join(', ') }}</span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownParams">
        <label v-for="param in paramsCollection" :key="param" class="dropdown-item">
          <input type="checkbox" :value="param" v-model="selectedParams" />
          {{ param }}
        </label>
      </div>
    </div>
    <!-- Sök-ruta -->
    <div v-for="param in selectedParams" :key="param" class="search-container">
      <span :for="param">{{ $t('dataselector.parameters.prefix') }}: {{ param }}</span>
      <div class="input-group">
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
      <!-- Välj parameter för sammanställning -->
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
          <label v-for="param in paramsCollection" :key="param" class="dropdown-item">
            <input
              type="checkbox"
              :value="param"
              v-model="selectedCompileParams"
              @change="updateCompileParams"
            />
            {{ param }}
          </label>
        </div>
      </div>
      <!-- Välj kolumner för statistik -->
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
          <label v-for="param in paramsCollection" :key="param" class="dropdown-item">
            <input
              type="checkbox"
              :value="param"
              v-model="selectedColumns"
              @change="updateColumns"
            />
            {{ param }}
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
  max-height: 200px;
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
