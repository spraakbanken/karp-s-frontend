<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { entryWordField } from '@/types/datasetConfig'
//import type { SelectedFieldConfig } from '@/types/datasetConfig'

/*
watch(
  () => [searchProps.searchExtended],
  ([newValue, newItemsPerPage]) => {
    console.log('searchProps.searchExtended', searchProps.searchExtended)
  },
  { immediate: true },
)
*/

const setActiveSearchTab = (tab: string) => {
  if (tab == 'simple') {
    // remove any additional fields we search on
    if (lexicalStorage.selectedFieldsArray[0] === entryWordField) {
      lexicalStorage.setStartField(lexicalStorage.selectedFields[entryWordField].value)
    } else {
      lexicalStorage.setStartField()
    }
  }
  lexicalStorage.setActiveSearchTab(tab)
}

const lexicalStorage = lexicalStore()
/*
const selectedDatasets = computed({
  get: () => lexicalStorage.selectedDatasets,
  set: (value) => lexicalStorage.setSelectedDataset(value),
})
*/

const selectedFields = computed({
  get: () => lexicalStorage.selectedFields,
  set: (value) => lexicalStorage.setSelectedFields(value),
})

const currentFields = computed({
  get: () => lexicalStorage.currentFields,
  set: (value) => lexicalStorage.setCurrentFields(value),
})

const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

//const selectedFieldsArray = ref<string[]>([])
const selectedFieldsArray = computed({
  get: () => lexicalStorage.selectedFieldsArray,
  set: (value) => lexicalStorage.setSelectedFieldsArray(value),
})

//const searchField = ref<Record<string, SelectedFieldConfig>>({})
const searchField = computed({
  get: () => lexicalStorage.searchField,
  set: (value) => lexicalStorage.setSearchField(value),
})

const searchFieldPosition = ['startswith', 'endswith', 'contains', 'equals', 'regex']

const searchFieldPositionText = [
  'dataselector.parameter.position.startswith',
  'dataselector.parameter.position.endswith',
  'dataselector.parameter.position.contains',
  'dataselector.parameter.position.equals',
  'dataselector.parameter.position.regex',
]

const searchExtendedOp = computed({
  get: () => lexicalStorage.searchExtendedOp,
  set: (x) => lexicalStorage.setSearchExtendedOp(x),
})

const searchQuery = computed({
  get: () => lexicalStorage.searchQuery,
  set: (x) => lexicalStorage.setSearchQuery(x),
})

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
  lexicalStorage.setStartField()

  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const fixPos = (f: string) => {
  if (
    searchField.value[f].positionInitial &&
    !searchField.value[f].positionMedial &&
    !searchField.value[f].positionFinal
  ) {
    // startswith
    searchField.value[f].position = searchFieldPosition[0]
  } else if (
    !searchField.value[f].positionInitial &&
    !searchField.value[f].positionMedial &&
    searchField.value[f].positionFinal
  ) {
    // endswidth
    searchField.value[f].position = searchFieldPosition[1]
  } else if (
    searchField.value[f].positionInitial &&
    searchField.value[f].positionMedial &&
    searchField.value[f].positionFinal
  ) {
    // contains
    searchField.value[f].position = searchFieldPosition[2]
  } else {
    // equals
    searchField.value[f].position = searchFieldPosition[3]
  }
}

const handlePos = (f: string, pos: number) => {
  if (pos == 0) {
    // clicked start
    // on
    if (!searchField.value[f].positionInitial) {
      if (searchField.value[f].positionFinal) {
        searchField.value[f].positionMedial = true
      }
    } else {
      // off
      searchField.value[f].positionMedial = false
    }
  } else if (pos == 2) {
    // clicked middle
    // on
    if (!searchField.value[f].positionMedial) {
      searchField.value[f].positionInitial = true
      searchField.value[f].positionFinal = true
    } else {
      // off
      searchField.value[f].positionInitial = false
      searchField.value[f].positionFinal = false
    }
  }
  if (pos == 1) {
    // clicked end
    // on
    if (!searchField.value[f].positionFinal) {
      if (searchField.value[f].positionInitial) {
        searchField.value[f].positionMedial = true
      }
    } else {
      // off
      searchField.value[f].positionMedial = false
    }
  }
  // now translate this to .position
  //console.log('P: ', searchField.value[f])
  //console.log('P2', JSON.parse(JSON.stringify(searchField.value[f])))

  // we need a tick so all searchField.value[f].position* values get truly set
  setTimeout(() => {
    fixPos(f)
  }, 0)
  //console.log('handlePos: ', searchField.value[f], searchFieldPosition)
}

// click search button
const updateData = () => {
  //if (currentFields.value.length > 0) {
  lexicalStorage.setSelectedFields(searchField.value)
  lexicalStorage.setIsSearch(true, true)
  lexicalStorage.setIsStart(false)
  lexicalStorage.tablePageRowStart = 0
  lexicalStorage.statisticsPageStart = 1
  //}
}

watch(selectedFieldsArray, (newFields) => {
  /*
  console.log(
    'WATCH: selectedFieldsArray:',
    newFields,
    JSON.parse(JSON.stringify(searchField.value)),
  )
  */
  // keep list of searchable fields synced with fields available
  newFields.forEach((fieldName) => {
    if (!searchField.value[fieldName]) {
      searchField.value[fieldName] = {
        value: '',
        position: 'equals',
        positionInitial: false,
        positionMedial: false,
        positionFinal: false,
      }
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
  (newFields) => {
    //console.log('WATCH: currentFields.value', newFields)
    if (newFields.length === 0) {
      searchField.value = {}
      selectedFields.value = {}
      updateData()
    }
  },
)

watch(
  () => lexicalStorage.selectedFields,
  (newSelectedFields) => {
    //console.log('WATCH: lexicalStorage.selectedFields', newSelectedFields)
    lexicalStorage.setSelectedFieldsArray(Object.keys(newSelectedFields))
    //console.log('-- WATCH: lexicalStorage.selectedFields', newSelectedFields, selectedFieldsArray.value,searchField,)
    Object.keys(newSelectedFields).forEach((param) => {
      //console.log('-- param', param)
      if (!searchField.value[param]) {
        // add
        searchField.value[param] = {
          value: newSelectedFields[param].value,
          position: newSelectedFields[param].position,
          positionInitial: newSelectedFields[param].positionInitial,
          positionMedial: newSelectedFields[param].positionMedial,
          positionFinal: newSelectedFields[param].positionFinal,
        }
      } else {
        // update
        searchField.value[param] = {
          value: newSelectedFields[param].value,
          position: newSelectedFields[param].position,
          positionInitial: newSelectedFields[param].positionInitial,
          positionMedial: newSelectedFields[param].positionMedial,
          positionFinal: newSelectedFields[param].positionFinal,
        }
      }
    })
  },
)

/*
watch(
  () => lexicalStorage.selectedDatasets,
  (newDatasets, oldDatasets) => {
    // do not search if we select a dataset (with none previously)
    // as we don't have anything to search for yet
    let notEmpty = false
    for (const [k, v] of Object.entries(searchField.value)) {
      console.log('k, v', k, v)
      if (v.value !== '') {
        notEmpty = true
      }
    }
    console.log(notEmpty, searchField.value)
    if (notEmpty) {
      setTimeout(function () {
        updateData()
      }, 1000)

      //updateData()
    }
  },
)
*/
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

  <div class="search-component">
    <!-- prev advanced search -->
    <div>
      <div class="searchTabs">
        <button
          :class="{ active: lexicalStorage.activeSearchTab === 'simple' }"
          @click="setActiveSearchTab('simple')"
        >
          {{ $t('tab.search.simple') }}
        </button>
        <button
          :class="{ active: lexicalStorage.activeSearchTab === 'extended' }"
          @click="setActiveSearchTab('extended')"
        >
          {{ $t('tab.search.extended') }}
        </button>
        <button
          :class="{ active: lexicalStorage.activeSearchTab === 'advanced' }"
          @click="setActiveSearchTab('advanced')"
        >
          {{ $t('tab.search.advanced') }}
        </button>
      </div>
    </div>
    <div class="search-container">
      <!-- Select field(s) for search-->
      <div
        v-if="
          lexicalStorage.activeSearchTab == 'simple' || lexicalStorage.activeSearchTab == 'extended'
        "
      >
        <div v-if="lexicalStorage.activeSearchTab == 'extended'">
          <div
            ref="dropdownContainer"
            class="dropdown"
            :class="{
              'dropdown-open': isDropdownParams,
              'dropdown-disabled': lexicalStorage.selectedDatasets.length === 0,
            }"
            :disabled="lexicalStorage.selectedDatasets.length === 0"
          >
            <div class="dropdown-toggle" @click="toggleDropdownParams">
              <span v-if="lexicalStorage.selectedDatasets.length === 0">{{
                $t('dataselector.noparameters')
              }}</span>
              <span v-else-if="currentFields.length === 0">{{
                $t('dataselector.datasets.nocommon')
              }}</span>
              <span v-else-if="selectedFieldsArray.length === 0"
                >{{ $t('dataselector.noparameters') }} <i class="arrow-down"></i>
              </span>
              <span v-else
                >{{ selectedFieldsArray.map((x) => lexicalStorage.localizeField(x)).join(', ') }}
                <i class="arrow-down"></i>
              </span>
            </div>

            <div class="dropdown-menu" v-if="isDropdownParams">
              <div v-for="param in currentFields" :key="param.name" class="dropdown-item">
                <label>
                  <input type="checkbox" :value="param.name" v-model="selectedFieldsArray" />
                  {{ lexicalStorage.localizeField(param.name) }}&nbsp;
                  <!-- common? -->
                  <span style="float: right">
                    <img
                      height="16px"
                      src="@/assets/sb_symbol_exclamation.svg"
                      class="datasets-icon"
                      v-if="
                        !lexicalStorage.currentCommonFields.find((item) => item.name === param.name)
                      "
                      :title="$t('search.field.notcommon')"
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div style="margin-top: 0.5rem">
            <span>{{ $t('search.operator.title') }}</span>
            <input
              class="operator-button"
              type="radio"
              id="searchExtendedOpAnd"
              value="true"
              v-model="searchExtendedOp"
            />
            <label class="operator-button" for="searchExtendedOpAnd">{{
              $t('search.operator.and')
            }}</label>
            <input
              class="operator-button"
              type="radio"
              id="searchExtendedOpOr"
              value="false"
              v-model="searchExtendedOp"
            />
            <label class="operator-button" for="searchExtendedOpOr">{{
              $t('search.operator.or')
            }}</label>
          </div>
        </div>
        <!-- Search a field -->
        <div v-for="param in selectedFieldsArray" :key="param" class="search-repeat">
          <!-- Search-box -->
          <hr v-if="lexicalStorage.activeSearchTab == 'extended'" class="search-repeat-hr" />
          <span :for="param">
            <span v-if="lexicalStorage.activeSearchTab == 'extended'">
              {{ lexicalStorage.localizeField(param) }}
              <i>{{
                lexicalStorage.currentCommonFields.find((item) => item.name === param)
                  ? ''
                  : '(' + $t('search.field.notcommon') + ')'
              }}</i>
            </span>
            <div class="input-group">
              <!--
        <input
          class="search-input"
          type="text"
          :id="param"
          v-model="parameters[param].value"
          :placeholder="$t('dataselector.parameters.placeholder')"
        />
        -->
              <div>
                <input
                  autofocus
                  @keyup.enter="updateData"
                  class="search-input"
                  type="text"
                  :id="param"
                  v-model="searchField[param].value"
                  :placeholder="
                    lexicalStorage.activeSearchTab == 'extended'
                      ? $t('dataselector.parameters.placeholder')
                      : $t('dataselector.simplesearch.placeholder')
                  "
                />
              </div>
              <!--
        <select v-model="searchField[param].position">
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
        -->
              <div class="position">
                <div class="group">
                  <label for="pos0">
                    <input
                      @click="handlePos(param, 0)"
                      type="checkbox"
                      id="pos0"
                      value="startswith"
                      v-model="searchField[param].positionInitial"
                    />
                    {{ $t(searchFieldPositionText[0]) }}
                  </label>
                  <label for="pos2">
                    <input
                      @click="handlePos(param, 2)"
                      type="checkbox"
                      id="pos2"
                      value="contains"
                      v-model="searchField[param].positionMedial"
                    />
                    {{ $t(searchFieldPositionText[2]) }}
                  </label>
                  <label for="pos1">
                    <input
                      @click="handlePos(param, 1)"
                      type="checkbox"
                      id="pos1"
                      value="endswith"
                      v-model="searchField[param].positionFinal"
                    />
                    {{ $t(searchFieldPositionText[1]) }}
                  </label>
                </div>
              </div>
            </div>
          </span>
        </div>
      </div>
      <div v-else-if="lexicalStorage.activeSearchTab == 'advanced'" class="search-advanced">
        <div class="label">
          {{ $t('search.advanced.label') }}
        </div>
        <div class="label">
          <a href="https://ws.spraakbanken.gu.se/docs/karp#tag/Searching">Karp Query Language</a>
        </div>
        <div>
          <input
            autofocus
            @keyup.enter="updateData"
            class="search-input"
            type="text"
            :id="searchQuery"
            v-model="searchQuery"
            :placeholder="$t('search.advanced.placeholder')"
          />
        </div>
      </div>
      <button @click="updateData" class="search-button">
        {{ $t('dataselector.datasearch') }}
      </button>
    </div>
  </div>

  <!--
  <p v-if="selectedDatasets.length == 0" style="padding: 1rem">
    {{ $t('message.nodatasetselected') }}
  </p>
  -->
</template>

<style scoped>
/*
input:focus {
  outline: 2px solid var(--color-complement);
}
*/

/* structure */
.search-component {
  color: black;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: flex-start;
  @media (width < 640px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

.search-container-simple {
  margin-top: 0.5rem;
}

.search-container {
  align-items: center;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 0rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  background-color: var(--color-search-area);
  width: 500px;
}

.search-repeat {
  padding: 0rem;
  border-radius: 0.5rem;
  margin-top: 0rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  background-color: var(--color-search-area);
}

.search-repeat-hr {
  background: black;
  height: 2px;
  border: 0px;
  width: 100%;
  margin: auto;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

/* simple and advanced search */

.searchTabs {
  display: flex;
  justify-content: flex-start;
  border-radius: 0;
  padding-left: 1rem;
}

.searchTabs button {
  padding: 0.5rem 1rem;
  margin-right: 0.25rem;
  border: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background-color: var(--sb-grey-light);
  cursor: pointer;
}

.searchTabs button.active {
  background-color: var(--color-search-area);
  font-weight: bold;
}

.search-advanced-label {
  padding-left: 0.5rem;
}

/* select field */

.dropdown {
  flex: auto;
  padding: 0.5rem;
  position: relative;
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
  /* display: inline; */
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

.input-group {
  display: flex;
  flex-direction: row;
  align-items: center;

  @media (width < 640px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

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

/*.input-group .search-input { */
.search-input {
  /* flex: 1;*/
  margin-right: 0.5rem;
  margin-left: 0.5rem;
  padding: 0.5rem;
  /* border: 2px solid var(--sb-orange); */
  border: none;
  border-radius: 4px;
  width: 300px;
  @media (width < 640px) {
    width: 300px;
  }
}

.search-input:focus {
  outline-color: var(--sb-orange);
  outline-style: solid;
  outline-width: 1px;
}

.operator-button {
  margin-left: 0.25rem;
}
/* search-button */

.search-advanced {
  width: 450px;
}

.search-advanced .search-input {
  width: 100%;
  margin-bottom: 1rem;
  margin-top: 1rem;
  margin-left: 0px;
  margin-right: 0px;
}

.search-advanced .label {
  margin-bottom: 0.25rem;
  margin-top: 0.25rem;
}

.search-advanced a {
  padding: 0px;
}

.search-button {
  background-color: var(--sb-orange);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  text-align: center;
  font-weight: bold;
  color: white;
  width: 30%;
  @media (width < 640px) {
    width: 100%;
  }
  cursor: pointer;
}

.search-button:hover {
  border: none;
  background-color: white;
  color: black;
}

.position {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  margin-left: 1rem;
  margin-right: 1rem;
}

.position .group {
  display: flex;
  flex-direction: column;
}

.position label {
  box-sizing: border-box;
}

.position input {
  display: table-cell;
  vertical-align: middle;
  padding: 2px;
  cursor: pointer;
}
</style>
