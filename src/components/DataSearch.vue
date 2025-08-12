<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { SelectedFieldConfig } from '@/types/datasetConfig'

/*
watch(
  () => [searchProps.searchExtended],
  ([newValue, newItemsPerPage]) => {
    console.log('searchProps.searchExtended', searchProps.searchExtended)
  },
  { immediate: true },
)
*/

const lexicalStorage = lexicalStore()

const selectedDatasets = computed({
  get: () => lexicalStorage.selectedDatasets,
  set: (value) => lexicalStorage.setSelectedDataset(value),
})
const selectedFields = computed({
  get: () => lexicalStorage.selectedFields,
  set: (value) => lexicalStorage.setSelectedFields(value),
})

const currentFields = computed(() => lexicalStorage.currentFields)

const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

const selectedFieldsArray = ref<string[]>([])

const searchField = ref<Record<string, SelectedFieldConfig>>({})
const searchFieldPosition = ['startswith', 'endswith', 'contains', 'equals', 'regex']
const searchFieldPositionText = [
  'dataselector.parameter.position.startswith',
  'dataselector.parameter.position.endswith',
  'dataselector.parameter.position.contains',
  'dataselector.parameter.position.equals',
  'dataselector.parameter.position.regex',
]
const searchFieldPositionEnabled = [true, true, false, true, false]

const localizeField = (p: string) => {
  let label = p
  for (const c of currentFields.value) {
    if (c.name === p) {
      if (lexicalStorage.activeLocale == 'sv') {
        label = c.label.swe ? c.label.swe : (c.label as unknown as string)
      } else {
        label = c.label.eng ? c.label.eng : (c.label as unknown as string)
      }
    }
  }
  return label
}

const toggleDropdownParams = () => {
  isDropdownParams.value = !isDropdownParams.value
  isDropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
    isDropdownParams.value = false
  }
}

onMounted(() => {
  // set "ingångsord" to default, also for statistics
  const fields: Record<string, SelectedFieldConfig> = {}
  fields['word'] = { value: '', position: 'equals' }
  lexicalStorage.setSelectedFields(fields)
  lexicalStorage.setSelectedCompileFields(['word'])

  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// click search button
const updateData = () => {
  console.log('Button!', searchField.value)
  lexicalStorage.setSelectedFields(searchField.value)
  lexicalStorage.setIsSearch(true)
}

watch(selectedFieldsArray, (newFields) => {
  console.log('WATCH: selectedFieldsArray:', newFields)
  // keep list of searchable fields synced with fields available
  newFields.forEach((fieldName) => {
    if (!searchField.value[fieldName]) {
      searchField.value[fieldName] = { value: '', position: 'equals' }
    }
  })
  Object.keys(searchField.value).forEach((fieldName) => {
    if (!newFields.includes(fieldName)) {
      delete searchField.value[fieldName]
    }
  })
})

watch(
  () => currentFields.value,
  (newParams) => {
    console.log('WATCH: currentFields.value', newParams)
    if (newParams.length === 0) {
      searchField.value = {}
      selectedFields.value = {}
      updateData()
    }
  },
)

watch(
  () => lexicalStorage.selectedFields,
  (newSelectedFields) => {
    console.log('WATCH: lexicalStorage.selectedFields', newSelectedFields)
    selectedFieldsArray.value = Object.keys(newSelectedFields)
    //console.log('-- WATCH: lexicalStorage.selectedFields', newSelectedFields, selectedFieldsArray.value,searchField,)
    Object.keys(newSelectedFields).forEach((param) => {
      //console.log('-- param', param)
      if (!searchField.value[param]) {
        searchField.value[param] = {
          value: newSelectedFields[param].value,
          position: newSelectedFields[param].position,
        }
      }
    })
  },
)
</script>

<template>
  <!-- Select Simple/Advanced search
  <div class="search-component">
    <input type="checkbox" id="advancedSearchCheckbox" v-model="searchExtended" />
    <label for="advancedSearchCheckbox" class="search-advanced-label">{{
      $t('dataselector.search.advanced')
    }}</label>
  </div>
  -->

  <!-- Simple search
  <div
    v-if="activeSearchTab === 'simple' && parameters.hasOwnProperty('word')"
    class="search-component"
  >
    <div class="search-container-simple">
      <div class="input-group">
        <input
          class="search-input"
          type="text"
          id="word"
          v-model="parameters['word'].value"
          :placeholder="$t('dataselector.simplesearch.placeholder')"
          @change="updateData"
        />
      </div>
    </div>
  </div>
  -->

  <!-- prev advanced search -->
  <div ref="dropdownContainer" class="search-component">
    <!-- Select field(s) for search -->
    <div
      class="dropdown"
      :class="{
        'dropdown-open': isDropdownParams,
        'dropdown-disabled': selectedDatasets.length === 0,
      }"
      :disabled="selectedDatasets.length === 0"
    >
      <!-- {{ $t('dataselector.parameters') }} -->
      <div class="dropdown-toggle" @click="toggleDropdownParams">
        <span v-if="selectedDatasets.length === 0">{{ $t('dataselector.noparameters') }}</span>
        <span v-else-if="currentFields.length === 0">{{
          $t('dataselector.datasets.nocommon')
        }}</span>
        <span v-else-if="selectedFieldsArray.length === 0">{{
          $t('dataselector.noparameters')
        }}</span>
        <span v-else
          >{{ selectedFieldsArray.map((x) => localizeField(x)).join(', ') }}
          <i class="arrow-down"></i>
        </span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownParams">
        <label v-for="param in currentFields" :key="param.name" class="dropdown-item">
          <input type="checkbox" :value="param.name" v-model="selectedFieldsArray" />
          <span v-if="param.name == 'word'" style="font-weight: bold">
            {{ localizeField(param.name) }}
          </span>
          <span v-else>
            {{ localizeField(param.name) }}
          </span>
        </label>
      </div>
    </div>
    <!-- Search-box -->
    <div v-for="param in selectedFieldsArray" :key="param" class="search-container">
      <!-- Search-box

      <span :for="param"
        >{{ $t('dataselector.parameters.prefix') }}: {{ lexicalStorage.localizeField(param) }}</span
      >
       -->
      <div class="input-group">
        <select v-model="searchField[param].position">
          <!--<option value="" disabled>{{ $t('dataselector.parameters.position') }}</option> -->
          <option
            v-for="(position, index) in searchFieldPosition"
            :key="position"
            :value="position"
            :hidden="!searchFieldPositionEnabled[index]"
            :disabled="!searchFieldPositionEnabled[index]"
          >
            {{ $t(searchFieldPositionText[index]) }}
          </option>
        </select>
        <!--
        <input
          class="search-input"
          type="text"
          :id="param"
          v-model="parameters[param].value"
          :placeholder="$t('dataselector.parameters.placeholder')"
        />
        -->
        <input
          @keyup.enter="updateData"
          class="search-input"
          type="text"
          :id="param"
          v-model="searchField[param].value"
          :placeholder="$t('dataselector.parameters.placeholder')"
        />
      </div>
    </div>
    <button @click="updateData">
      {{ $t('dataselector.datasearch') }}
    </button>
  </div>

  <!--
  <p v-if="selectedDatasets.length == 0" style="padding: 1rem">
    {{ $t('message.nodatasetselected') }}
  </p>
  -->

  <!--
  <div class="searchTabs">
    <button :class="{ active: activeSearchTab === 'simple' }" @click="setActiveSearchTab('simple')">
      {{ $t('tab.search.simple') }}
    </button>
    <button
      :class="{ active: activeSearchTab === 'extended' }"
      @click="setActiveSearchTab('extended')"
    >
      {{ $t('tab.search.extended') }}
    </button>
  </div>
  -->
</template>

<style scoped>
/*
input:focus {
  outline: 2px solid var(--color-complement);
}
*/

.search-component {
  background-color: var(--sb-orange-light);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
}

/* simple and advanced search */

.searchTabs {
  display: flex;
  justify-content: flex-start;
}

.searchTabs button {
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  border: 1px solid var(--color-complement);
  border-radius: 32px;
  background-color: var(--color-complement);
  cursor: pointer;
  font-size: var(--font-size);
  font-weight: bold;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.searchTabs button:hover {
  background-color: var(--color-color-background-hover);
}

.searchTabs button.active {
  background-color: none;
  font-weight: bold;
  background-color: white;
}

.search-advanced-label {
  padding-left: 0.5rem;
}

.search-container-simple {
  margin-top: 0.5rem;
}

/*
.search-container {
  margin-top: 0rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
}
*/

/* select field */

.dropdown {
  flex: auto;
  padding: 0.5rem;
  position: relative;
  margin-right: 0.5rem;
  background-color: var(--sb-grey-light);
  border-radius: 0.5rem;
  color: black;
}

.dropdown-open {
  /*border-color: var(--sb-orange);*/
}

/*
.dropdown-group {
  background-color: var(--sb-grey-light);
  padding-left: 0.5rem;
}
*/

.dropdown-disabled {
  pointer-events: none;
  color: var(--sb-grey-medium);
  cursor: not-allowed;
}

.dropdown-toggle {
  display: inline;
  /* border: 1px solid var(--color-border); */
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
  max-height: 400px;
  overflow-y: auto;
  width: fit-content;
  z-index: 1000;
}

.dropdown-open .dropdown-menu {
  border-color: var(--color-border-open);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
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

.dropdown:hover {
  background-color: white;
}
/*
.input-group {
  display: flex;
  align-items: center;
}
*/

/* search position and search field */

.input-group select {
  background-color: var(--sb-grey-light);
  margin-right: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 15px;
}

.input-group select:hover {
  background-color: white;
}
.input-group input {
  flex: 1;
  margin-right: 0.5rem;
  padding: 0.5rem;
  /* border: 2px solid var(--sb-orange); */
  border: none;
  border-radius: 4px;
  width: 300px;
}

/* search-button */

.search-component button {
  background-color: var(--sb-orange);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  text-align: center;
  font-weight: bold;
  color: white;
}

.search-component button:hover {
  background-color: white;
  color: black;
}
</style>
