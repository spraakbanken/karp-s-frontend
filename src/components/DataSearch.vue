<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'
//import type { FieldConfig } from '@/types/datasetConfig'

const searchProps = defineProps<{
  searchExtended: boolean
}>()

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
const selectedParameters = computed({
  get: () => lexicalStorage.selectedParameters,
  set: (value) => lexicalStorage.setSelectedParameters(value),
})

const listLimit = computed({
  get: () => lexicalStorage.listLimit,
  set: (value) => lexicalStorage.setListLimit(value),
})

const currentParameters = computed(() => lexicalStorage.currentParameters)
//const totalDatasets = computed(() => lexicalStorage.totalDatasets)
/*
const selectedParametersArray = computed({
  get: () => Object.keys(lexicalStorage.selectedParameters),
  set: (value) => value,
})
  */
const selectedParametersArray = ref<string[]>([])
const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
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
const ParameterPositionEnabled = [true, true, false, true, false]
//const searchExtended = ref(false)

const localizeParam = (p: string) => {
  let label = p
  for (const c of currentParameters.value) {
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
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// update state from URL
const updateData = () => {
  lexicalStorage.setSelectedParameters(parameters.value)
}

watch(selectedParametersArray, (newParams) => {
  //console.log('WATCH: selectedParametersArray:', newParams)
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
})

watch(
  () => currentParameters.value,
  (newParams) => {
    //console.log('WATCH: currentParams.value', newParams)
    if (newParams.length === 0) {
      parameters.value = {}
      selectedParameters.value = {}
      //selectedColumns.value = []
      //selectedCompileParams.value = []
      updateData()
    }
  },
)

watch(
  () => lexicalStorage.selectedParameters,
  (newSelectedParameters) => {
    //console.log('WATCH: lexicalStorage.selectedParameters', newSelectedParameters)
    selectedParametersArray.value = Object.keys(newSelectedParameters)
    //console.log('-- parameters1', parameters, selectedParametersArray.value)
    Object.keys(newSelectedParameters).forEach((param) => {
      if (!parameters.value[param]) {
        parameters.value[param] = {
          value: newSelectedParameters[param].value,
          position: newSelectedParameters[param].position,
        }
      }
    })
    //console.log('-- parameters2', parameters)
  },
)
</script>

<template>
  <!-- Select Simple/Advanced search
  <div class="data-component">
    <input type="checkbox" id="advancedSearchCheckbox" v-model="searchExtended" />
    <label for="advancedSearchCheckbox" class="search-advanced-label">{{
      $t('dataselector.search.advanced')
    }}</label>
  </div>
  -->

  <p v-if="selectedDatasets.length == 0" style="padding: 1rem">
    {{ $t('message.nodatasetselected') }}
  </p>

  <!-- Simple search -->
  <div
    v-if="!searchProps.searchExtended && parameters.hasOwnProperty('word')"
    class="data-component"
  >
    <!-- Search-box -->
    <div class="search-container-simple">
      <!-- <span>{{ $t('dataselector.parameters.prefix') }}:</span> -->
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

  <!-- Advanced search -->
  <div v-if="searchProps.searchExtended" ref="dropdownContainer" class="data-component">
    <!-- Select field(s) for search -->
    <div
      class="dropdown"
      :class="{
        'dropdown-open': isDropdownParams,
        'dropdown-disabled': selectedDatasets.length === 0,
      }"
      :disabled="selectedDatasets.length === 0"
    >
      {{ $t('dataselector.parameters') }}
      <div class="dropdown-toggle" @click="toggleDropdownParams">
        <span v-if="selectedDatasets.length === 0">{{ $t('dataselector.noparameters') }}</span>
        <span v-else-if="currentParameters.length === 0">{{
          $t('dataselector.datasets.nocommon')
        }}</span>
        <span v-else-if="selectedParametersArray.length === 0">{{
          $t('dataselector.noparameters')
        }}</span>
        <span v-else>{{ selectedParametersArray.map((x) => localizeParam(x)).join(', ') }}</span>
      </div>
      <div class="dropdown-menu" v-if="isDropdownParams">
        <label v-for="param in currentParameters" :key="param.name" class="dropdown-item">
          <input type="checkbox" :value="param.name" v-model="selectedParametersArray" />
          <span v-if="param.name == 'word'" style="font-weight: bold">
            {{ localizeParam(param.name) }}
          </span>
          <span v-else>
            {{ localizeParam(param.name) }}
          </span>
        </label>
      </div>
    </div>
    <!-- Search-box -->
    <div v-for="param in selectedParametersArray" :key="param" class="search-container">
      <!-- Search-box

      <span :for="param"
        >{{ $t('dataselector.parameters.prefix') }}: {{ lexicalStorage.localizeParam(param) }}</span
      >
       -->
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
    <div class="graph-parameter">
      {{ $t('dataselector.list.limit') }}:

      <input type="number" size="5" min="1" v-model="listLimit" @change="updateData" />
    </div>
  </div>
</template>

<style scoped>
.data-component {
  padding-left: 1rem;
  padding-right: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.search-advanced-label {
  padding-left: 0.5rem;
}

.search-container-simple,
.search-container,
.graph-parameter {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  margin-right: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.dropdown {
  position: relative;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  margin-right: 1rem;
  min-width: 200px;
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
  display: inline;
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
