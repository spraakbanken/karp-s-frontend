<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, onUnmounted } from 'vue'
import { lexicalStore } from '@/stores/store'
import { entryWordField, type SelectedFieldConfig } from '@/types/datasetConfig'
import {
  POSITION_CONTAINS,
  POSITION_ENDSWITH,
  POSITION_EQUALS,
  POSITION_REGEX,
  POSITION_STARTSWITH,
  TAB_RESULT_REF,
  TAB_RESULT_TABLE,
  TAB_SEARCH_ADVANCED,
  TAB_SEARCH_EXTENDED,
  TAB_SEARCH_SIMPLE,
} from '@/utils/constants'
import { randomId } from '@/utils/utils'

const lexicalStorage = lexicalStore()

const setActiveSearchTab = (tab: string) => {
  if (tab == TAB_SEARCH_SIMPLE) {
    const val = lexicalStorage.selectedFieldsMain[0].selectedFieldsSub[0].value
    const sfc: SelectedFieldConfig = {
      id: randomId(),
      name: entryWordField,
      value: val,
      position: POSITION_EQUALS,
      positionInitial: false,
      positionMedial: false,
      positionFinal: false,
      isNot: false,
    }
    lexicalStorage.resetSelectedFieldsMain(sfc)
  }
  lexicalStorage.setActiveSearchTab(tab)
}

const currentFields = computed({
  get: () => lexicalStorage.currentFields,
  set: (value) => lexicalStorage.setCurrentFields(value),
})

//const isDropdownOpen = ref(false)
//const isDropdownParams = ref(false)
//const dropdownContainer = ref<HTMLElement | null>(null)
const isDDMain = ref(-1)
const isDDSub = ref(-1)
const toggleDD = (mainId: number, subId: number) => {
  //console.log('toggleDD', mainId, subId)
  if (isDDMain.value === -1) {
    isDDMain.value = mainId
    isDDSub.value = subId
  } else {
    isDDMain.value = -1
    isDDSub.value = -1
  }
}
const isDD = (mainId: number, subId: number): boolean => {
  //console.log('isDD', mainId, subId, mainId === isDDMain.value && subId === isDDSub.value)
  if (isDDMain.value === -1) {
    return false
  } else {
    return mainId === isDDMain.value && subId === isDDSub.value
  }
}

const dropdownRefs = ref<HTMLElement[]>([])

const handleClickOutside = (event: MouseEvent) => {
  let inside = false
  dropdownRefs.value.forEach((dropdownEl) => {
    if (dropdownEl && dropdownEl.contains(event.target as Node)) {
      inside = true
    }
  })
  // if not inside any dropdown, close'em
  if (!inside) {
    isDDMain.value = -1
    isDDSub.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

//const selectedFieldsArray = ref<string[]>([])
//const searchField = ref<Record<string, SelectedFieldConfig>>({})
/*
const selectedFields = computed({
  get: () => lexicalStorage.selectedFields,
  set: (value) => lexicalStorage.setSearchField(value),
})
*/

const searchFieldPosition = [
  POSITION_STARTSWITH,
  POSITION_ENDSWITH,
  POSITION_CONTAINS,
  POSITION_EQUALS,
  POSITION_REGEX,
]

const searchFieldPositionText = [
  'dataselector.parameter.position.startswith',
  'dataselector.parameter.position.endswith',
  'dataselector.parameter.position.contains',
  'dataselector.parameter.position.equals',
  'dataselector.parameter.position.regex',
]

/*
const searchExtendedOp = computed({
  get: () => lexicalStorage.searchExtendedOp,
  set: (x) => lexicalStorage.setSearchExtendedOp(x),
})
*/
const searchQuery = computed({
  get: () => lexicalStorage.searchQuery,
  set: (x) => lexicalStorage.setSearchQuery(x),
})

/*
const toggleDropdownParams = () => {
  isDropdownParams.value = !isDropdownParams.value
  isDropdownOpen.value = false
}
*/

/*
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
    isDropdownParams.value = false
  }
}
*/
onMounted(() => {
  // set "ingångsord" to default, also for statistics
  lexicalStorage.setStartField()

  //document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  //document.removeEventListener('click', handleClickOutside)
})

/* TODO move into lexicalStorage */
const fixPos = (mainIndex: number, subIndex: number) => {
  if (
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial &&
    !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionMedial &&
    !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal
  ) {
    // startswith
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].position =
      searchFieldPosition[0]
  } else if (
    !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial &&
    !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionMedial &&
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal
  ) {
    // endswidth
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].position =
      searchFieldPosition[1]
  } else if (
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial &&
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionMedial &&
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal
  ) {
    // contains
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].position =
      searchFieldPosition[2]
  } else {
    // equals
    lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].position =
      searchFieldPosition[3]
  }
}

/* TODO move into lexicalStorage */
const handlePos = (mainId: number, subId: number, pos: number) => {
  // lookup field with fid id
  const mainIndex = lexicalStorage.selectedFieldsMain.findIndex((f) => f.id === mainId)
  if (mainIndex >= 0) {
    const subIndex = lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub.findIndex(
      (f) => f.id === subId,
    )
    if (subIndex >= 0) {
      if (pos == 0) {
        // clicked start
        // on
        if (
          !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial
        ) {
          if (
            lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal
          ) {
            lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[
              subIndex
            ].positionMedial = true
          }
        } else {
          // off
          lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionMedial =
            false
        }
      } else if (pos == 2) {
        // clicked middle
        // on
        if (
          !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionMedial
        ) {
          lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial =
            true
          lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal =
            true
        } else {
          // off
          lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial =
            false
          lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal =
            false
        }
      }
      if (pos == 1) {
        // clicked end
        // on
        if (
          !lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionFinal
        ) {
          if (
            lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionInitial
          ) {
            lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[
              subIndex
            ].positionMedial = true
          }
        } else {
          // off
          lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].positionMedial =
            false
        }
      }
      // now translate this to .position

      // we need a tick so all searchField.value[f].position* values get truly set
      setTimeout(() => {
        fixPos(mainIndex, subIndex)
      }, 0)
      //console.log('handlePos: ', searchField.value[f], searchFieldPosition)
    }
  }
}

// click search button
const updateData = () => {
  lexicalStorage.setIsSearch(true, true)
  lexicalStorage.setIsStart(false)
  lexicalStorage.tablePageRowStart = 0
  lexicalStorage.statisticsPageStart = 1
  if (lexicalStorage.activeResultTab.slice(0, 3) === TAB_RESULT_REF) {
    lexicalStorage.setActiveResultTab(TAB_RESULT_TABLE)
  }
}

const selectedFieldsAddSub = (mainId: number) => {
  lexicalStorage.addSelectedFieldsSub(mainId)
}

const selectedFieldsAddMain = () => {
  lexicalStorage.addSelectedFieldsMain()
}

const selectedFieldAdd = (fieldName: string, mainId: number, subId: number) => {
  const mainIndex = lexicalStorage.selectedFieldsMain.findIndex((f) => f.id === mainId)
  if (mainIndex >= 0) {
    const subIndex = lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub.findIndex(
      (f) => f.id === subId,
    )
    if (subIndex >= 0) {
      lexicalStorage.selectedFieldsMain[mainIndex].selectedFieldsSub[subIndex].name = fieldName
      isDDMain.value = -1
      isDDSub.value = -1
    }
  }
}

const fieldHasCategories = (f: string): boolean => {
  if (lexicalStorage.currentConfig.fields[f]) {
    return 'categories' in lexicalStorage.currentConfig.fields[f]
  }
  return false
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
          :class="{ active: lexicalStorage.activeSearchTab === TAB_SEARCH_SIMPLE }"
          @click="setActiveSearchTab(TAB_SEARCH_SIMPLE)"
        >
          {{ $t('tab.search.simple') }}
        </button>
        <button
          :class="{ active: lexicalStorage.activeSearchTab === TAB_SEARCH_EXTENDED }"
          @click="setActiveSearchTab(TAB_SEARCH_EXTENDED)"
        >
          {{ $t('tab.search.extended') }}
        </button>
        <button
          :class="{ active: lexicalStorage.activeSearchTab === TAB_SEARCH_ADVANCED }"
          @click="setActiveSearchTab(TAB_SEARCH_ADVANCED)"
        >
          {{ $t('tab.search.advanced') }}
        </button>
      </div>
    </div>
    <div class="search-container">
      <!-- simple and extended search -->
      <div
        v-if="
          lexicalStorage.activeSearchTab == TAB_SEARCH_SIMPLE ||
          lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED
        "
        class="search-container-content"
      >
        <!-- extended search, select fields to search -->
        <!--
        <div v-if="lexicalStorage.activeSearchTab == 'extended'">
          <div v-if="lexicalStorage.getSelectedFieldsMainCount() > 0" style="margin-top: 0.5rem">
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
        -->
        <!-- Search a field -->
        <div
          v-for="(mainExpression, mainIndex) in lexicalStorage.selectedFieldsMain"
          :key="mainExpression.id"
        >
          <div class="fields-main-item">
            <div
              v-for="(subExpression, subIndex) in mainExpression.selectedFieldsSub"
              :key="subExpression.id"
              class="search-repeat"
            >
              <!-- Search-box -->

              <span :for="subExpression" class="fields-sub-item">
                <!--
              {{ lexicalStorage.localizeField(subExpression.name) }}
              -->
                <div
                  class="dropdown-wrapper"
                  v-if="lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED"
                >
                  <!-- field dropdown start -->
                  <div
                    class="dropdown"
                    :key="mainExpression.id + subExpression.id + 'dropdownContainer'"
                    :class="{
                      'dropdown-open': isDD(mainExpression.id, subExpression.id),
                      'dropdown-disabled': lexicalStorage.selectedDatasets.length === 0,
                    }"
                    :disabled="lexicalStorage.selectedDatasets.length === 0"
                    ref="dropdownRefs"
                  >
                    <div
                      class="dropdown-toggle"
                      @click="toggleDD(mainExpression.id, subExpression.id)"
                    >
                      <span v-if="lexicalStorage.selectedDatasets.length === 0">{{
                        $t('dataselector.noparameters')
                      }}</span>
                      <span v-else-if="currentFields.length === 0">{{
                        $t('dataselector.datasets.nocommon')
                      }}</span>
                      <span v-else-if="lexicalStorage.getSelectedFieldsTotalCount() === 0"
                        >{{ $t('dataselector.noparameters') }} <i class="arrow-down"></i>
                      </span>
                      <span v-else>
                        {{ lexicalStorage.localizeField(subExpression.name) }}
                        <i class="arrow-down"></i>
                      </span>
                    </div>

                    <div class="dropdown-menu" v-if="isDD(mainExpression.id, subExpression.id)">
                      <div
                        v-for="param in currentFields"
                        :key="mainExpression.id + subExpression.id + param.name"
                        class="dropdown-item"
                        @click="selectedFieldAdd(param.name, mainExpression.id, subExpression.id)"
                      >
                        <label>
                          <!--
                          <button
                            class="action-button"
                            @click="
                              selectedFieldAdd(param.name, mainExpression.id, subExpression.id)
                            "
                          >
                            {{ $t('search.button.add') }}
                          </button>
                          -->
                          <!--<input type="checkbox" :value="param.name" v-model="selectedFieldsArray" />-->
                          {{ lexicalStorage.localizeField(param.name) }}&nbsp;
                          <!-- if this field a common field? -->
                          <span style="float: right">
                            <img
                              height="16px"
                              src="@/assets/sb_symbol_exclamation.svg"
                              class="datasets-icon"
                              v-if="
                                !lexicalStorage.currentCommonFields.find(
                                  (item) => item.name === param.name,
                                )
                              "
                              :title="$t('search.field.notcommon')"
                            />
                          </span>
                        </label>
                      </div>
                    </div>
                    <!-- field dropdown end -->
                  </div>
                  <button
                    @click="lexicalStorage.delSelectedField(mainExpression.id, subExpression.id)"
                    class="action-button dropdown-button"
                    v-if="lexicalStorage.getSelectedFieldsTotalCount() > 1"
                  >
                    X<!--{{ $t('search.button.remove') }}-->
                  </button>
                </div>
                <span class="search-input-message">{{
                  lexicalStorage.currentCommonFields.find(
                    (item) => item.name === subExpression.name,
                  )
                    ? ''
                    : '(' + $t('search.field.notcommon') + ')'
                }}</span>

                <div class="input-group">
                  <!-- input group, one per selected field -->
                  <div v-if="lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED">
                    <label class="search-label">
                      <input type="checkbox" id="isNot" v-model="subExpression.isNot" />
                      {{ $t('search.field.isnot') }}
                    </label>
                  </div>
                  <div class="search-input-wrapper">
                    <input
                      v-focus
                      autofocus
                      tabindex="0"
                      @keyup.enter="updateData"
                      class="search-input"
                      :list="'categories-list' + subExpression.name"
                      type="text"
                      :id="String(subExpression.id)"
                      v-model.trim="subExpression.value"
                      :placeholder="
                        fieldHasCategories(subExpression.name)
                          ? $t('search.input.list')
                          : lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED
                            ? $t('dataselector.parameters.placeholder')
                            : $t('dataselector.simplesearch.placeholder')
                      "
                    />
                    <template v-if="fieldHasCategories(subExpression.name)">
                      <!-- <span class="search-input-message">{{ $t('search.input.list') }}</span>-->
                      <datalist :id="'categories-list' + subExpression.name">
                        <option
                          v-for="x in lexicalStorage.currentConfig.fields[subExpression.name]
                            .categories"
                          :key="x"
                          :value="x"
                        ></option>
                      </datalist>
                    </template>
                  </div>
                  <div class="position">
                    <div class="group">
                      <label
                        :for="'pos0' + mainExpression.id + subExpression.id"
                        class="search-label"
                      >
                        <input
                          @click="handlePos(mainExpression.id, subExpression.id, 0)"
                          type="checkbox"
                          :id="'pos0' + mainExpression.id + subExpression.id"
                          value="startswith"
                          v-model="subExpression.positionInitial"
                        />
                        {{ $t(searchFieldPositionText[0]) }}
                      </label>
                      <label
                        :for="'pos2' + mainExpression.id + subExpression.id"
                        class="search-label"
                      >
                        <input
                          @click="handlePos(mainExpression.id, subExpression.id, 2)"
                          type="checkbox"
                          :id="'pos2' + mainExpression.id + subExpression.id"
                          value="contains"
                          v-model="subExpression.positionMedial"
                        />
                        {{ $t(searchFieldPositionText[2]) }}
                      </label>
                      <label
                        :for="'pos1' + mainExpression.id + subExpression.id"
                        class="search-label"
                      >
                        <input
                          @click="handlePos(mainExpression.id, subExpression.id, 1)"
                          type="checkbox"
                          :id="'pos1' + mainExpression.id + subExpression.id"
                          value="endswith"
                          v-model="subExpression.positionFinal"
                        />
                        {{ $t(searchFieldPositionText[1]) }}
                      </label>
                    </div>
                  </div>
                </div>
              </span>
              <div
                v-if="subIndex < lexicalStorage.getSelectedFieldsSubCount(mainExpression.id) - 1"
                class="search-separator"
              >
                {{ $t('search.separator.or') }}
              </div>
            </div>
            <!-- ^ end sub -->
            <div
              class="field-button-center"
              v-if="lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED"
            >
              <button class="action-button" @click="selectedFieldsAddSub(mainExpression.id)">
                +&nbsp;{{ $t('search.separator.or') }}
              </button>
            </div>
          </div>
          <div
            v-if="mainIndex < lexicalStorage.getSelectedFieldsMainCount() - 1"
            class="search-separator"
          >
            {{ $t('search.separator.and') }}
          </div>
        </div>
        <div
          class="field-button-center"
          v-if="lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED"
        >
          <button class="action-button" @click="selectedFieldsAddMain()">
            +&nbsp;{{ $t('search.separator.and') }}
          </button>
        </div>
        <!-- ^ end main -->
      </div>
      <!-- advanced search -->
      <div
        v-else-if="lexicalStorage.activeSearchTab == TAB_SEARCH_ADVANCED"
        class="search-advanced"
      >
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
  padding: 0.5rem;
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
  /* background-color: var(--color-search-area); */
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

.fields-main-item {
  /* border: 1px solid var(--color-border); */
  background-color: var(--color-background-alt2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.fields-sub-item {
  width: 100%;
}

.field-button-center {
  width: 100%;
  text-align: center;
}

.search-separator {
  width: 100%;
  text-align: center;
  margin-bottom: 0.5rem;
  background-color: var(--color-search-area);
  border-radius: 0.5rem;
}

.dropdown-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.dropdown {
  flex: 1;
  padding: 0.25rem;
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

.dropdown-button {
  flex-shrink: 0;
  white-space: nowrap;
  max-height: 1.5rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}

/* search position and search field */

.input-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

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

.search-input-wrapper {
  display: flex;
  flex-direction: column;
  margin-right: 0.5rem;
  margin-left: 0.5rem;
}

.search-input {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  width: 260px;
  @media (width < 640px) {
    width: 260px;
  }
  color: var(--color-text);
  background-color: var(--color-background);
  /*
    display: table-cell;
  vertical-align: middle;
  padding: 2px;
  cursor: pointer;
  accent-color: var(--sb-orange);
  */
}

.search-input:focus {
  outline-color: var(--sb-orange);
  outline-style: solid;
  outline-width: 1px;
}

.search-label {
  white-space: nowrap;
  display: inline-block;
}

.search-input-message {
  font-style: italic;
  font-size: 0.75rem;
}

/*
.operator-button {
  margin-left: 0.25rem;
  accent-color: var(--sb-orange);
}
*/

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
.position input {
  display: table-cell;
  vertical-align: middle;
  padding: 2px;
  cursor: pointer;
  accent-color: var(--sb-orange);
}

.position {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
  background-color: var(--button-action-bg-color);
  /*
  color: var(--button-action-text-color);
  border: 0;
  */
  border: 1px solid;
  border-color: var(--sb-orange);
  color: black;
  margin-right: 0.5rem;
  padding: 0.5;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.action-button:hover {
  background-color: var(--button-action-bg-hover-color);
  color: var(--button-action-text-hover-color);
}
</style>
