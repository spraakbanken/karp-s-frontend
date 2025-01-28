<template>
  <div  ref="dropdownContainer">
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
          <label v-for="(dataset, key, index) in datasets" :key="key + index" class="dropdown-item">
            <input type="checkbox" :value="key" v-model="selectedKeys" @change="selectDataset" />
            {{ key }}
          </label>
        </div>
      </div>
    </div>
    <div class="search-container">
      <span>Search</span>
      <input type="text" v-model="searchQuery" placeholder="Search data..." class="search-input" />
    </div>
    <div class="dropdown" :class="{ 'dropdown-open': isDropdownKeysOpen }">
      <span>Select parameter for Statistics</span>
      <div class="dropdown-toggle" @click="toggleDropdownKeys">
        <span v-if="selectedParams.length === 0">No parameters selected</span>
        <span v-else>{{ selectedParams.join(', ') }}</span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownKeysOpen">
        <label v-for="(value, key) in selectedDataset[0]" :key="key" class="dropdown-item">
          <input type="checkbox" :value="key" v-model="selectedParams" />
          {{ key }}
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { selectedDataset, datasets, searchQuery, selectedParams, datasetKeys } from '../stores/store'

const selectedKeys = ref<(keyof typeof datasets)[]>([])
const isDropdownOpen = ref(false)
const isDropdownKeysOpen = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const toggleDropdownKeys = () => {
  isDropdownKeysOpen.value = !isDropdownKeysOpen.value
}

const totalDatasets = computed(() => Object.keys(datasets).length)

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
    isDropdownKeysOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(selectedKeys, () => {
  updateSelectedDataset()
})

const updateSelectedDataset = () => {
  datasetKeys.value = selectedKeys.value
  selectedDataset.value = selectedKeys.value.flatMap((key) => datasets[key])
}

const selectDataset = () => {
  updateSelectedDataset()
}
</script>

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
</style>
