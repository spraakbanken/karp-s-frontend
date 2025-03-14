<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'

const lexicalStorage = lexicalStore()

const selectedKeys = ref(lexicalStorage.selectedDatasets)
const currentDatasets = computed(() => lexicalStorage.datasetKeys)
// const searchQuery = computed(() => lexicalStorage.searchQuery)
const selectedParams = ref(lexicalStorage.selectedParams)
const selectedColumns = ref(lexicalStorage.selectedColumns)
const paramsCollection = computed(() => lexicalStorage.currentParams)
const totalDatasets = computed(() => lexicalStorage.totalDatasets)
const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const isDropdownColumns = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const parameters = ref<Record<string, paramConfig>>({})
const ParameterPosition = ['startswith', 'endswith', 'contains', 'equals', 'regex']

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const toggleDropdownParams = () => {
  isDropdownParams.value = !isDropdownParams.value
}

const toggleDropdownColumns = () => {
  isDropdownColumns.value = !isDropdownColumns.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
    isDropdownParams.value = false
    isDropdownColumns.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const updateSelectedDataset = () => {
  lexicalStorage.setSelectedDataset(selectedKeys.value)
}

const selectDataset = () => {
  updateSelectedDataset()
}

const updateData = () => {
  lexicalStorage.setParameters(parameters.value)
}

const updateColumns = () => {
  lexicalStorage.setSelectedColumns(selectedColumns.value)
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
</script>

<template>
  <div ref="dropdownContainer">
    <div class="data-selection">
      <span>Select Datasets</span>
      <div class="dropdown" :class="{ 'dropdown-open': isDropdownOpen }">
        <div class="dropdown-toggle" @click="toggleDropdown">
          {{ selectedKeys.length === 1 ? 'Dataset' : 'Datasets' }} selected ({{
            selectedKeys.length
          }}
          of {{ totalDatasets }})
        </div>
        <div class="dropdown-menu" v-if="isDropdownOpen">
          <label v-for="dataset in currentDatasets" :key="dataset" class="dropdown-item">
            <input
              type="checkbox"
              :value="dataset"
              v-model="selectedKeys"
              @change="selectDataset"
            />
            {{ lexicalStorage.lexicalLabels[dataset] }}
          </label>
        </div>
      </div>
    </div>
    <!-- <div class="search-container">
      <span>Search</span>
      <input type="text" v-model="searchQuery" placeholder="Search data..." class="search-input" />
    </div> -->
    <div class="dropdown" :class="{ 'dropdown-open': isDropdownParams }">
      <span>Select parameter/parameters</span>
      <div class="dropdown-toggle" @click="toggleDropdownParams">
        <span v-if="selectedParams.length === 0">No parameters selected</span>
        <span v-else>{{ selectedParams.join(', ') }}</span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownParams">
        <label v-for="param in paramsCollection" :key="param" class="dropdown-item">
          <input type="checkbox" :value="param" v-model="selectedParams" />
          {{ param }}
        </label>
      </div>
    </div>
    <div v-for="param in selectedParams" :key="param" class="search-container">
      <span :for="param">{{ param }}</span>
      <div class="input-group">
        <select v-model="parameters[param].position">
          <option value="" disabled>Select position</option>
          <option v-for="position in ParameterPosition" :key="position" :value="position">
            {{ position }}
          </option>
        </select>
        <input
          class="search-input"
          type="text"
          :id="param"
          v-model="parameters[param].value"
          placeholder="Enter value"
          @change="updateData"
        />
      </div>
    </div>
    <div
      class="dropdown"
      v-if="lexicalStorage.activeTab === 'statistics'"
      :class="{ 'dropdown-open': isDropdownColumns }"
    >
      <span>Select columns for Statistics</span>
      <div class="dropdown-toggle" @click="toggleDropdownColumns">
        <span v-if="selectedColumns.length === 0">No columns selected</span>
        <span v-else>{{ selectedColumns.join(', ') }}</span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownColumns">
        <label v-for="param in paramsCollection" :key="param" class="dropdown-item">
          <input type="checkbox" :value="param" v-model="selectedColumns" @change="updateColumns" />
          {{ param }}
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  border-color: var(--color-border-open);
}

.dropdown-toggle {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
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
