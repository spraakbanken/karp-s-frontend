<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import { entryWordField } from '@/types/datasetConfig'
import { TAB_RESULT_REF, TAB_RESULT_TABLE } from '@/utils/constants'

const lexicalStorage = lexicalStore()

const setActiveSearchTab = (tab: string) => {
  if (tab == 'simple') {
    if (lexicalStorage.selectedFieldsCount > 0) {
      // remove any additional fields we search on
      if (lexicalStorage.selectedFields[0].name === entryWordField) {
        lexicalStorage.setStartField(lexicalStorage.selectedFields[0].value)
      } else {
        lexicalStorage.setStartField()
      }
    } else {
      lexicalStorage.setStartField()
    }
  }
  lexicalStorage.setActiveSearchTab(tab)
}

const currentFields = computed({
  get: () => lexicalStorage.currentFields,
  set: (value) => lexicalStorage.setCurrentFields(value),
})

const isDropdownOpen = ref(false)
const isDropdownParams = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

//const selectedFieldsArray = ref<string[]>([])
//const searchField = ref<Record<string, SelectedFieldConfig>>({})
/*
const selectedFields = computed({
  get: () => lexicalStorage.selectedFields,
  set: (value) => lexicalStorage.setSearchField(value),
})
*/

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

const fixPos = (index: number) => {
  if (
    lexicalStorage.selectedFields[index].positionInitial &&
    !lexicalStorage.selectedFields[index].positionMedial &&
    !lexicalStorage.selectedFields[index].positionFinal
  ) {
    // startswith
    lexicalStorage.selectedFields[index].position = searchFieldPosition[0]
  } else if (
    !lexicalStorage.selectedFields[index].positionInitial &&
    !lexicalStorage.selectedFields[index].positionMedial &&
    lexicalStorage.selectedFields[index].positionFinal
  ) {
    // endswidth
    lexicalStorage.selectedFields[index].position = searchFieldPosition[1]
  } else if (
    lexicalStorage.selectedFields[index].positionInitial &&
    lexicalStorage.selectedFields[index].positionMedial &&
    lexicalStorage.selectedFields[index].positionFinal
  ) {
    // contains
    lexicalStorage.selectedFields[index].position = searchFieldPosition[2]
  } else {
    // equals
    lexicalStorage.selectedFields[index].position = searchFieldPosition[3]
  }
}

const handlePos = (fid: number, pos: number) => {
  // lookup field with fid id
  const index = lexicalStorage.selectedFields.findIndex((f) => f.id === fid)
  if (index !== -1) {
    if (pos == 0) {
      // clicked start
      // on
      if (!lexicalStorage.selectedFields[index].positionInitial) {
        if (lexicalStorage.selectedFields[index].positionFinal) {
          lexicalStorage.selectedFields[index].positionMedial = true
        }
      } else {
        // off
        lexicalStorage.selectedFields[index].positionMedial = false
      }
    } else if (pos == 2) {
      // clicked middle
      // on
      if (!lexicalStorage.selectedFields[index].positionMedial) {
        lexicalStorage.selectedFields[index].positionInitial = true
        lexicalStorage.selectedFields[index].positionFinal = true
      } else {
        // off
        lexicalStorage.selectedFields[index].positionInitial = false
        lexicalStorage.selectedFields[index].positionFinal = false
      }
    }
    if (pos == 1) {
      // clicked end
      // on
      if (!lexicalStorage.selectedFields[index].positionFinal) {
        if (lexicalStorage.selectedFields[index].positionInitial) {
          lexicalStorage.selectedFields[index].positionMedial = true
        }
      } else {
        // off
        lexicalStorage.selectedFields[index].positionMedial = false
      }
    }
    // now translate this to .position
    //console.log('P: ', searchField.value[f])
    //console.log('P2', JSON.parse(JSON.stringify(searchField.value[f])))

    // we need a tick so all searchField.value[f].position* values get truly set
    setTimeout(() => {
      fixPos(index)
    }, 0)
    //console.log('handlePos: ', searchField.value[f], searchFieldPosition)
  }
}

// click search button
const updateData = () => {
  //if (currentFields.value.length > 0) {
  //lexicalStorage.setSelectedFields(searchField.value)
  lexicalStorage.setIsSearch(true, true)
  lexicalStorage.setIsStart(false)
  lexicalStorage.tablePageRowStart = 0
  lexicalStorage.statisticsPageStart = 1
  if (lexicalStorage.activeResultTab.slice(0, 3) === TAB_RESULT_REF) {
    lexicalStorage.setActiveResultTab(TAB_RESULT_TABLE)
  }
  //}
}

const selectedFieldAdd = (fieldName: string) => {
  /*
  lexicalStorage.selectedFields[lexicalStorage.selectedFieldsCount] = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: fieldName,
    value: '',
    position: 'equals',
    positionInitial: false,
    positionMedial: false,
    positionFinal: false,
  }
  lexicalStorage.selectedFieldsCount++
  */
  console.log('selectedFieldAdd()', fieldName)
  lexicalStorage.setSelectedFieldsAdd({
    id: 0,
    name: fieldName,
    value: '',
    position: 'equals',
    positionInitial: false,
    positionMedial: false,
    positionFinal: false,
  })
}

const selectedFieldRemove = (fid: number) => {
  /*
  const index = lexicalStorage.selectedFields.findIndex((f) => f.id === fid)
  if (index !== -1) {
    lexicalStorage.selectedFieldsCount--
    lexicalStorage.selectedFields.splice(index, 1)
  }
  */
  lexicalStorage.setSelectedFieldsRemove(fid)
}

watch(
  () => currentFields.value,
  (newFields) => {
    //console.log('WATCH: currentFields.value', newFields)
    if (newFields.length === 0) {
      //searchField.value = {}
      //selectedFields.value = {}
      updateData()
    }
  },
)
</script>

<template>
  <div class="search-component">
    <!-- search tabs -->
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
      <!-- simple and extended search -->
      <div
        v-if="
          lexicalStorage.activeSearchTab == 'simple' || lexicalStorage.activeSearchTab == 'extended'
        "
        class="search-container-content"
      >
        <!-- extended search, select fields to search -->
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
              <span v-else-if="lexicalStorage.selectedFieldsCount === 0"
                >{{ $t('dataselector.noparameters') }} <i class="arrow-down"></i>
              </span>
              <span v-else
                >{{ $t('search.field.add') }}
                <i class="arrow-down"></i>
              </span>
            </div>

            <div class="dropdown-menu" v-if="isDropdownParams">
              <div v-for="param in currentFields" :key="param.name" class="dropdown-item">
                <label>
                  <button class="action-button" @click="selectedFieldAdd(param.name)">
                    {{ $t('search.button.add') }}
                  </button>
                  <!--<input type="checkbox" :value="param.name" v-model="selectedFieldsArray" />-->
                  {{ lexicalStorage.localizeField(param.name) }}&nbsp;
                  <!-- if this field a common field? -->
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
          <div v-if="lexicalStorage.selectedFieldsCount > 0" style="margin-top: 0.5rem">
            <span>{{ $t('search.operator.title') }}</span>
            <input
              class="operator-button"
              type="radio"
              id="searchExtendedOpAnd"
              :value="true"
              v-model="searchExtendedOp"
            />
            <label class="operator-button" for="searchExtendedOpAnd">{{
              $t('search.operator.and')
            }}</label>
            <input
              class="operator-button"
              type="radio"
              id="searchExtendedOpOr"
              :value="false"
              v-model="searchExtendedOp"
            />
            <label class="operator-button" for="searchExtendedOpOr">{{
              $t('search.operator.or')
            }}</label>
          </div>
        </div>
        <!-- Search a field -->
        <div v-for="param in lexicalStorage.selectedFields" :key="param.id" class="search-repeat">
          <!-- Search-box -->
          <hr v-if="lexicalStorage.activeSearchTab == 'extended'" class="search-repeat-hr" />
          <span :for="param">
            <span v-if="lexicalStorage.activeSearchTab == 'extended'">
              <button @click="selectedFieldRemove(param.id)" class="action-button">
                {{ $t('search.button.remove') }}
              </button>
              {{ lexicalStorage.localizeField(param.name) }}
              <i>{{
                lexicalStorage.currentCommonFields.find((item) => item.name === param.name)
                  ? ''
                  : '(' + $t('search.field.notcommon') + ')'
              }}</i>
            </span>
            <div class="input-group">
              <!-- input group, one per selected field -->
              <div>
                <input
                  v-focus
                  autofocus
                  tabindex="0"
                  @keyup.enter="updateData"
                  class="search-input"
                  type="text"
                  :id="String(param.id)"
                  v-model="param.value"
                  :placeholder="
                    lexicalStorage.activeSearchTab == 'extended'
                      ? $t('dataselector.parameters.placeholder')
                      : $t('dataselector.simplesearch.placeholder')
                  "
                />
              </div>
              <div class="position">
                <div class="group">
                  <label for="pos0">
                    <input
                      @click="handlePos(param.id, 0)"
                      type="checkbox"
                      id="pos0"
                      value="startswith"
                      v-model="param.positionInitial"
                    />
                    {{ $t(searchFieldPositionText[0]) }}
                  </label>
                  <label for="pos2">
                    <input
                      @click="handlePos(param.id, 2)"
                      type="checkbox"
                      id="pos2"
                      value="contains"
                      v-model="param.positionMedial"
                    />
                    {{ $t(searchFieldPositionText[2]) }}
                  </label>
                  <label for="pos1">
                    <input
                      @click="handlePos(param.id, 1)"
                      type="checkbox"
                      id="pos1"
                      value="endswith"
                      v-model="param.positionFinal"
                    />
                    {{ $t(searchFieldPositionText[1]) }}
                  </label>
                </div>
              </div>
            </div>
          </span>
        </div>
      </div>
      <!-- advanced search -->
      <div v-else-if="lexicalStorage.activeSearchTab == 'advanced'" class="search-advanced">
        <div class="label">
          {{ $t('search.advanced.label') }}
        </div>
        <div class="label">
          <a href="https://ws.spraakbanken.gu.se/docs/karp#tag/Searching">Karp Query Language</a>
        </div>
        <div>
          <input
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
  color: var(--color-text);
  margin-bottom: 1rem;
  margin-top: 1rem;
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

.search-container-content {
  width: 100%;
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
  color: var(--color-text);
  background-color: var(--color-background-alt2);
  padding: 0.5rem 1rem;
  margin-right: 0.25rem;
  border: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  cursor: pointer;
}

.searchTabs button.active {
  background-color: var(--color-background-alt);
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
  color: var(--color-text);
  background-color: var(--color-background-alt2);
  border-radius: 0.5rem;
  border: 1px solid var(--button-border);
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
  background-color: var(--color-background-alt2);
  border: 1px solid var(--color-border);
  max-height: 400px;
  overflow-y: auto;
  width: 100%; /* fit-content; */
  z-index: 1000;
}

.dropdown-open .dropdown-menu {
  border-color: var(--color-border-open);
}

.dropdown-item {
  padding: 0.1rem 0.5rem;
  color: var(--color-text);
}

.dropdown-item input {
  margin-right: 0.5rem;
}

.dropdown-item:hover {
  background-color: var(--color-background-hover);
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
  color: var(--color-text);
  background-color: var(--color-background);
}

.search-input:focus {
  outline-color: var(--sb-orange);
  outline-style: solid;
  outline-width: 1px;
}

.operator-button {
  margin-left: 0.25rem;
  accent-color: var(--sb-orange);
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
  margin-top: 1rem;
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
  background-color: var(--button-action-bg-hover-color);
  color: var(--button-action-text-hover-color);
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
  accent-color: var(--sb-orange);
}

.action-button {
  margin: 0 0.5rem 0.5rem 0rem;
  padding: 0.5;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 0;
  font-weight: bold;
  cursor: pointer;
}

.action-button:hover {
  background-color: var(--button-action-bg-hover-color);
  color: var(--button-action-text-hover-color);
}
</style>
