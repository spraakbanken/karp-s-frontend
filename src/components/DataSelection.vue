<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { lexicalStore } from '@/stores/store'
import {
  type SelectedFieldConfig,
  entryWordProperty,
  entryWordDescriptionProperty,
} from '@/types/datasetConfig'
import { secondsToDate, formatNumber } from '@/utils/utils'
import type { ResourceLocalized } from '@/types/datasetConfig'
import { th } from '@/utils/utils'

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
const filteredDatasets = ref<string[]>([])
const selectedTags = computed({
  get: () => lexicalStorage.selectedTags,
  set: (value) => lexicalStorage.setSelectedTags(value),
})

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

const previousDataset = ref('')
const listExcludedDatasets = ref<boolean>(false)
const listSortSelectedFirst = ref<boolean>(true)
const listShowSelectedOnly = ref<boolean>(false)

const datasetInfoFill = (dataset: string) => {
  //console.log('DSI: ', dataset, previousDataset.value)
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
  if (!isDropdownOpen.value) {
    doFilterDatasets()
  }
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
  //console.log('selectDataset:', selectedDatasets.value.length)
  lexicalStorage.setSelectedDataset(selectedDatasets.value)
  /* save filtering/sorting until next time we open dropdown
  if (listSortSelectedFirst.value) {
    doFilterDatasets()
  }
  */
}

// INFO: doesn't trigger the watch (because selectedDatasets is "computed")
const selectTags = (tag: string) => {
  const tagIndex = selectedTags.value.indexOf(tag)
  if (tagIndex == -1) {
    selectedTags.value.push(tag)
  } else {
    // remove it
    selectedTags.value.splice(tagIndex, 1)
  }

  const selDS: string[] = []
  const currentConfig = lexicalStorage.currentConfig
  for (const c of currentConfig.resources) {
    //if (!selectedDatasets.value.includes(c.resourceId)) {
    if (hasTags(c.resourceId)) {
      selDS.push(c.resourceId)
    }
    //}
  }
  selectedDatasets.value = selDS

  //doFilterDatasets()
}

const unselectAll = () => {
  selectedTags.value = []
  selectedDatasets.value = []
}

const unselectTags = () => {
  //if (selectedDatasets.value.length > 0) {
  selectedTags.value = []
  //}
  searchDatasets.value = ''
  doFilterDatasets()
}

const hasTags = (rid: string): boolean => {
  let includeRes = false
  for (const c of lexicalStorage.currentConfig.resources) {
    if (c.resourceId == rid) {
      for (const t of selectedTags.value) {
        //console.log('hasTags: ', t, rid)
        if ('tags' in c) {
          if (c.tags.includes(t)) {
            includeRes = true
          }
        }
      }
    }
  }
  return includeRes
}

const doFilterDatasets = () => {
  let label: string = ''
  let arr: string[] = []

  listExcludedDatasets.value = false

  const currentConfig = lexicalStorage.currentConfig
  for (const c of currentConfig.resources) {
    if (lexicalStorage.activeLocale == 'sv') {
      label = c.label.swe ? c.label.swe : (c.label as unknown as string)
    } else {
      label = c.label.eng ? c.label.eng : (c.label as unknown as string)
    }
    if (listShowSelectedOnly.value) {
      if (selectedDatasets.value.includes(c.resourceId)) {
        arr.push(c.resourceId)
      }
    } else if (
      (!searchDatasets.value ||
        label.toLowerCase().indexOf(searchDatasets.value.toLowerCase()) !== -1) &&
      true
      //      (selectedTags.value.length == 0 || hasTags(c.resourceId))
    ) {
      arr.push(c.resourceId)
    } else {
      if (selectedDatasets.value.includes(c.resourceId)) {
        listExcludedDatasets.value = true
      }
    }
  }

  if (listSortSelectedFirst.value) {
    // sort selected first, then alphabetically
    arr = arr.sort(function (a, b) {
      return selectedDatasets.value.includes(a) && selectedDatasets.value.includes(b)
        ? lexicalStorage.datasetLabels[a].localeCompare(
            lexicalStorage.datasetLabels[b],
            lexicalStorage.activeLocale,
            { numeric: true },
          )
        : selectedDatasets.value.includes(a)
          ? -1
          : selectedDatasets.value.includes(b)
            ? 1
            : lexicalStorage.datasetLabels[a].localeCompare(
                lexicalStorage.datasetLabels[b],
                lexicalStorage.activeLocale,
                { numeric: true },
              )
    })
  } else {
    // sort alphabetically
    arr = arr.sort(function (a, b) {
      return lexicalStorage.datasetLabels[a].localeCompare(
        lexicalStorage.datasetLabels[b],
        lexicalStorage.activeLocale,
        { numeric: true },
      )
    })
  }

  //console.log('doFilterDatasets:', searchDatasets.value, selectedTags.value.length, arr)
  filteredDatasets.value = arr
}

watch(searchDatasets, (newFilter) => {
  doFilterDatasets()
})

// select all datasets that we have filtered
const selectAllFiltered = () => {
  lexicalStorage.setSelectedDataset(filteredDatasets.value)
}

/*
const filterDatasets = computed(() => {
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
      (!searchDatasets.value ||
        label.toLowerCase().indexOf(searchDatasets.value.toLowerCase()) !== -1) &&
      true
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
*/

// TODO doesnt trigger, change start of watch
watch(
  () => selectedDatasets,
  (newDatasets, oldDatasets) => {
    console.log('WATCH: DataSelection selectedDatasets', newDatasets)

    if (oldDatasets.value.length === 0) {
      // set "ingångsord" to default, also for statistics
      lexicalStorage.setStartField()
    }
    //console.log('--DataSelection/watch 2', newDatasets, oldDatasets)
    if (newDatasets.value.length === 0) {
      fields.value = {}
      selectedFields.value = {}
      selectedColumns.value = []
      selectedCompileParams.value = []
      lexicalStorage.setIsSearch(true, true)
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
        <br />({{ formatNumber(lexicalStorage.selectedDatasetsSize, 2) }}
        {{ $t('dataselector.entries.of') }}
        {{ formatNumber(lexicalStorage.currentDatasetsSize, 2) }} {{ $t('dataselector.entries') }})
        <i class="arrow-down"></i>
      </div>

      <!-- dropdown -->
      <div class="dropdown-menu" v-if="isDropdownOpen">
        <div class="dropdown-group">
          {{ $t('dataselector.tags.title') }}
          <!-- show tags -->
          <div class="dropdown-tags">
            <div v-for="tag in currentTags" :key="tag">
              <button
                @click="selectTags(tag)"
                :class="{ 'tags-button-selected': selectedTags.indexOf(tag) !== -1 }"
                class="tags-button datasets-tooltip"
              >
                {{ th(lexicalStorage.currentConfig.tags[tag].label) }}&nbsp; ({{
                  formatNumber(lexicalStorage.tagEntriesCount[tag], 2)
                }})
                <span class="datasets-tooltiptext">{{
                  th(lexicalStorage.currentConfig.tags[tag].description)
                    ? th(lexicalStorage.currentConfig.tags[tag].description)
                    : $t('dataselector.tags.missingdescription')
                }}</span>
              </button>
              <!-- show tags
          <input type="checkbox" :value="tag" v-model="selectedTags" @change="selectTags" />
            {{ lexicalStorage.currentConfig.tags[tag].label }} -->
            </div>
          </div>
          <!-- dataset list -->
          <!--
        <div class="dropdown-group">{{ $t('dataselector.datasets.title') }}</div>
        -->
          <!-- filter -->
          <div class="dropdown-filter">
            {{ $t('dataselector.datasets.filter') }}:
            <input type="text" v-model="searchDatasets" />
            <button
              @click="unselectTags()"
              class="tags-button-action"
              style="margin-left: 0.5rem"
              :disabled="selectedTags.length == 0 && searchDatasets == ''"
            >
              {{ $t('dataselector.tags.reset') }}
            </button>
          </div>
          <!--
          <div>
            <input
              type="checkbox"
              :value="true"
              v-model="listShowSelectedOnly"
              @change="doFilterDatasets"
            />
            {{ $t('dataselector.datasets.showselected') }}
          </div>
          -->
        </div>
        <!--
        <div class="dropdown-selectedfirst">


          <div>
            <input
              type="checkbox"
              :value="true"
              v-model="listSortSelectedFirst"
              @change="doFilterDatasets"
            />
            {{ $t('dataselector.datasets.selectedfirst') }}
          </div>
          -->
        <div v-if="listExcludedDatasets" class="datasets-excluded">
          {{ $t('dataselector.datasets.excluded') }}
        </div>
        <!--
        </div>
        -->
        <div class="dropdown-selectors">
          <button @click="selectAllFiltered()" class="tags-button-action">
            {{ $t('dataselector.tags.select') }}
          </button>
          <button
            @click="unselectAll()"
            class="tags-button-action"
            :disabled="lexicalStorage.selectedDatasets.length == 0"
          >
            {{ $t('dataselector.tags.unselect') }}
          </button>
        </div>
        <!-- list datasets -->
        <div class="datasets-group">
          <div class="datasets-list">
            <div v-for="dataset in filteredDatasets" :key="dataset" class="dropdown-item">
              <div class="datasets-list-item">
                <span class="datasets-icon material-icons" @click="datasetInfoFill(dataset)">
                  {{ previousDataset === dataset ? 'arrow_drop_down' : 'arrow_right' }}
                </span>
                <!--
                <img
                  src="@/assets/sb_symbol_info.svg"
                  @click="datasetInfoFill(dataset)"
                  class="datasets-icon"
                />
-->
                <label>
                  <input
                    type="checkbox"
                    :value="dataset"
                    v-model="selectedDatasets"
                    @change="selectDataset"
                  />
                  {{ lexicalStorage.datasetLabels[dataset] }}
                </label>
                <div v-if="dataset !== '' && previousDataset === dataset">
                  <div class="datasets-info" v-if="datasetInfo['label'] !== ''">
                    <div class="datasets-info-label">{{ datasetInfo.label }}</div>
                    <!-- 'description' can contain HTML -->
                    <div class="" v-html="datasetInfo.description"></div>
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
                        {{ lexicalStorage.localizeField(item.name) }}
                      </div>
                    </div>
                  </div>
                </div>
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
  width: 480px;
}

.dropdown {
  border-radius: 0.5rem;
  background-color: var(--color-search-area);
  margin-bottom: 0rem;
  position: relative;
  color: var(--color-text);
}

.dropdown-open {
  border-color: var(--sb-orange);
  border-radius: 0.5rem 0.5rem 0 0;
}

.dropdown-group {
  background-color: var(--color-background-alt);
  color: var(--color-text);
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

/*
.dropdown:hover {
  background-color: white;
}
*/

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0rem;
  right: 0rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  max-height: 600px;
  overflow-y: visible;
  z-index: 1000;
  /*
    scrollbar-width: 0;
*/
}

.dropdown-open .dropdown-menu {
  border-color: var(--color-border-open);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0rem 0.5rem 0 0;
  color: var(--color-text);
}

.dropdown-item img {
  height: 20px;
}

.dropdown-item input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.dropdown-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0rem 0rem;
  color: var(--color-text);
}

.dropdown-selectors {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0rem 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.dropdown-selectors .tags-button-action {
  margin-right: 0.5rem;
  margin-top: 0.5rem;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 0;
  font-weight: bold;
  cursor: pointer;
}

.dropdown-selectors .tags-button-action:disabled {
  background-color: black;
  color: var(--sb-grey-medium);
}

.dropdown-tags input {
  margin-right: 0.5rem;
}

.dropdown-group .tags-button {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  border: 0;
  font-weight: bold;
}

.tags-button-action {
  margin: 0 0.5rem 0.5rem 0rem;
  padding: 0.5;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 0;
  font-weight: bold;
}

.dropdown-tags .tags-button-selected {
  background-color: var(--sb-orange);
  color: white;
}

.dropdown-group .tags-button-action:disabled {
  background-color: black;
  color: var(--sb-grey-medium);
}

.dropdown-filter input {
  background-color: var(--color-background);
  color: var(--color-text);
}

.dropdown-filter input:focus {
  outline-color: var(--sb-orange);
  outline-style: solid;
  outline-width: 1px;
}

.dropdown-filter button {
  cursor: pointer;
}

.dropdown-selectedfirst {
  margin-top: 0.5rem;
  margin-left: 1rem;
}

.datasets-excluded {
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  font-style: italic;
}

.datasets-group {
  /*
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  width: 390px;
  color: var(--color-text);
  */
  overflow-y: scroll;
  max-height: 400px;
}

.datasets-list {
  /*
  max-height: 100%;
  background-color: var(--color-background);
  overflow-y: auto;
  */
}

.datasets-list-item {
  accent-color: var(--sb-orange);
  width: 100%;
}

.datasets-icon {
  /*
  float: right;
  margin-left: auto;
  display: block;
  padding: 0.5rem;
  width: 2rem;
  */
  vertical-align: bottom;
  cursor: pointer;
}

.datasets-info {
  /*
  background-color: var(--color-background);
  width: 300px;
  white-space: pre-line;
  overflow-y: auto;
  */
  background-color: var(--color-background-alt);
  margin: 0 1.5rem 1rem 1.5rem;
  padding: 0.5rem;
}

.datasets-info-label {
  font-weight: bold;
}

.datasets-info-description {
  font-style: italic;
}

.datasets-tooltip {
  position: relative;
}

.datasets-tooltip .datasets-tooltiptext {
  width: 160px;
  bottom: 100%;
  left: 50%;
  margin-left: -80px; /* Use half of the width to center the tooltip */

  visibility: hidden;
  background-color: var(--sb-orange);
  color: #fff;
  text-align: center;
  font-weight: bold;
  border-radius: 6px;
  padding: 5px 0;
  /* Position the tooltip */
  position: absolute;
  z-index: 1;
}

.datasets-tooltip .datasets-tooltiptext::after {
  content: ' ';
  position: absolute;
  top: 100%; /* At the bottom of the tooltip */
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--sb-orange) transparent transparent transparent;
}

.datasets-tooltip:hover .datasets-tooltiptext {
  visibility: visible;
  white-space: normal;
}
</style>
