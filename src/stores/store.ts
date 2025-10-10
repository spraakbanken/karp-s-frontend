import type { SelectedFieldConfig } from '@/types/datasetConfig'
import { defineStore } from 'pinia'

import {
  type FieldConfig,
  type Config,
  type DatasetDates,
  entryWordField,
} from '@/types/datasetConfig.ts'

interface SearchRedux {
  currentConfig: Config // all resources, tags, fields; set at HomeView > OnMounted()
  currentDatasets: string[] //  all datasets (id's)
  currentDatasetsSize: number // total number of entries
  selectedDatasets: string[] // selected datasets (id's)
  selectedDatasetsSize: number // number of entries in selected datasets
  currentTags: string[] // all tags
  tagEntriesCount: Record<string, number> // total number of entries for tags
  selectedTags: string[] // currently selected tags
  fieldsInDatasets: Record<string, FieldConfig[]> // all fields in datasets; object with key: resurceId, value: FieldConfig-array
  currentFields: FieldConfig[] // available fields in selected datasets (union)
  currentCommonFields: FieldConfig[] // intersection of fields in selected datasets (intersection)
  selectedFields: Record<string, SelectedFieldConfig> // fields we are searching in
  selectedCompileFields: string[] // statistics, fields we compile on
  selectedColumns: string[] // statistics, field we show totals on
  searchQuery: string
  searchExtendedOp: boolean
  activeSearchTab: string
  activeResultTab: string
  activeLocale: string
  sortField: string
  sortOrder: string
  datasetLabels: Record<string, string>
  datasetDates: DatasetDates[]
  abortController: AbortController
  pageStart: number
  pageSize: number
  isData: boolean
  isSearch: boolean // trigger a search (call server)
  isStart: boolean // is app in start mode? (do not show anything except dataselection/datasearch boxes)
  isLoading: number
}

// currentParams = list of available fields in selected datasets
// selectedParams = list of selected fields
export const lexicalStore = defineStore('dataset', {
  state: (): SearchRedux => ({
    currentConfig: { resources: [], tags: {}, fields: {} },
    currentDatasets: [],
    currentDatasetsSize: 0,
    selectedDatasets: [],
    selectedDatasetsSize: 0,
    currentTags: [],
    tagEntriesCount: {},
    selectedTags: [],
    fieldsInDatasets: {},
    currentFields: [],
    currentCommonFields: [],
    selectedFields: {},
    selectedCompileFields: [],
    selectedColumns: [],
    searchQuery: '',
    searchExtendedOp: true,
    activeSearchTab: 'simple',
    activeResultTab: 'table',
    activeLocale: 'sv',
    sortField: '',
    sortOrder: 'asc',
    datasetLabels: {},
    datasetDates: [],
    abortController: new AbortController(),
    pageStart: 1,
    pageSize: 25,
    //listLimit: 5,
    isData: false,
    isSearch: false,
    isStart: true,
    isLoading: 0,
  }),
  actions: {
    setDefault(config: Config) {
      this.currentConfig = config

      // array of machine id of all datasets
      this.currentDatasets = config.resources.map((c) => c.resourceId)
      if (this.activeLocale == 'sv') {
        this.datasetLabels = config.resources
          .map((c) => ({
            [c.resourceId]: c.label.swe ? c.label.swe : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      } else {
        this.datasetLabels = config.resources
          .map((c) => ({
            [c.resourceId]: c.label.eng ? c.label.eng : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      }

      // all tags
      this.currentTags = [
        ...new Set(config.resources.flatMap((c) => (c.tags == undefined ? [] : c.tags))),
      ]
      //console.log('CurrentTags:', this.currentTags)
      this.datasetDates = config.resources.map((c) => ({
        resourceId: c.resourceId,
        label: this.datasetLabels[c.resourceId],
        updated: c.updated,
      }))
      this.datasetDates.sort(function (a, b) {
        return parseInt(b.updated) - parseInt(a.updated)
      })

      // we want all fields that are in selected datasets
      // fieldsInDatasets: Record<string, FieldConfig[]>
      // object with key: resurceId, value: FieldConfig-array
      this.fieldsInDatasets = config.resources.reduce(
        (acc, c) => {
          // we want the FieldConfig for f, not f name (string)
          acc[c.resourceId] = c.fields.map((f) => config.fields[f])
          return acc
        },
        {} as Record<string, FieldConfig[]>,
      )

      // calculate total number of entries
      for (const ds in this.currentDatasets) {
        this.currentDatasetsSize += Number(this.currentConfig.resources[ds].size)
      }

      // count number of entries in each tagset
      this.currentTags.forEach((tag) => {
        if (!(tag in this.tagEntriesCount)) {
          this.tagEntriesCount[tag] = 0
        }
        for (const c of this.currentConfig.resources) {
          if (c.hasOwnProperty('tags')) {
            if (c.tags.includes(tag)) {
              this.tagEntriesCount[tag] += Number(c.size)
            }
          }
        }
      })
      // setup default datasets for first run = select all
      this.setSelectedDataset(this.currentDatasets)
      // and select all tags
      this.setSelectedTags(this.currentTags)
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    setSearchExtendedOp(x: boolean) {
      this.searchExtendedOp = x
    },
    /*
    setSelectedParams(params: string[]) {
      // Not used
      this.selectedParams = params
    },*/
    setSelectedColumns(columns: string[]) {
      // console.log('selectedColumns', columns)
      this.selectedColumns = columns
    },
    setSelectedCompileFields(fields: string[]) {
      // console.log('selectedCompileParams', params)
      this.selectedCompileFields = fields
    },
    setSelectedTags(t: string[]) {
      // make copy
      this.selectedTags = [...t]
    },
    setActiveSearchTab(tab: string) {
      this.activeSearchTab = tab
    },
    setActiveResultTab(tab: string) {
      this.activeResultTab = tab
    },
    setSelectedDataset(keys: string[]) {
      //console.log('setSelectedDataset, keys:', keys)
      this.selectedDatasets = keys
      this.setUnionAndIntersectionFields(this.selectedDatasets)
      // so now we have all fields that are in all selected datasets, union and intersection
      // and add the "ingångsord"
      this.currentFields.unshift({
        name: entryWordField,
        type: 'text',
        collection: false,
        label: { swe: 'ingångsord', eng: 'word' },
      })
      this.currentCommonFields.unshift({
        name: entryWordField,
        type: 'text',
        collection: false,
        label: { swe: 'ingångsord', eng: 'word' },
      })
      if (this.currentFields.length > 0) {
        // if we have fields in selectedFields (from beforehand)
        // that are now not in currentFields
        // remove them from selectedFields
        const newSelectedFields: Record<string, SelectedFieldConfig> = {}
        for (const [k, v] of Object.entries(this.selectedFields)) {
          let bFound = false
          //console.log('k, v', k, v)
          if (this.currentFields.find((f) => f.name === k)) {
            bFound = true
          }
          if (bFound) {
            newSelectedFields[k] = v
          }
        }
        this.selectedFields = newSelectedFields
        // and set "ingångsord" to default, also for statistics
        // but if selectedFields exists in all selected datasets don't do this
        let isEmpty = true
        for (const [k, v] of Object.entries(this.selectedFields)) {
          //console.log('k, v', k, v)
          if (v.value !== '') {
            isEmpty = false
          }
        }
        if (isEmpty) {
          this.setStartField()
        }

        // calculate size (# of entries) in selected datasets
        this.selectedDatasetsSize = 0
        for (const ds of this.selectedDatasets) {
          const elt = this.currentConfig.resources.find((x) => x.resourceId === ds)
          if (elt) {
            this.selectedDatasetsSize += Number(elt.size)
          }
        }
        //  console.log('Tot size=', selectedDatasetsSize.value, formatNumber(foo, 2))

        this.isData = false
      } else {
        this.selectedDatasetsSize = 0
        return []
      }
      this.sortField = entryWordField
      this.sortOrder = 'asc'
      this.setSelectedCompileFields([entryWordField])
      this.setSelectedColumns([])

      //}
    },
    /*
    setSelectedTag(tags: string[]) {
      this.selectedTags = tags
      this.setSelectedDataset(this.selectedDatasets)
    },
    */
    setUnionAndIntersectionFields(keys: string[]) {
      // get union of fields in all selected datasets
      const fieldUnion: FieldConfig[] = []
      for (const k of keys) {
        if (k in this.fieldsInDatasets) {
          for (const fc of this.fieldsInDatasets[k]) {
            // check if it is already in
            let found: boolean = false
            for (let i = 0; i < fieldUnion.length; i++) {
              if (fieldUnion[i].name == fc.name && fieldUnion[i].type == fc.type) {
                found = true
                break
              }
            }
            if (!found) {
              fieldUnion.push(fc)
            }
          }
        }
      }
      this.currentFields = fieldUnion
      // now check that they are in all selected datasets
      const fieldIntersection: FieldConfig[] = []
      for (const fu of fieldUnion) {
        let foundInAll: boolean = true
        for (const k of keys) {
          let foundInDS: boolean = false
          for (const fc of this.fieldsInDatasets[k]) {
            if (fu.name == fc.name && fu.type == fc.type) {
              foundInDS = true
              break
            }
          }
          foundInAll = foundInAll && foundInDS
        }
        if (foundInAll) {
          fieldIntersection.push(fu)
        }
      }
      this.currentCommonFields = fieldIntersection
    },
    setLocale(locale: string) {
      this.activeLocale = locale
      if (this.activeLocale == 'sv') {
        this.datasetLabels = this.currentConfig.resources
          .map((c) => ({
            [c.resourceId]: c.label.swe ? c.label.swe : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      } else {
        this.datasetLabels = this.currentConfig.resources
          .map((c) => ({
            [c.resourceId]: c.label.eng ? c.label.eng : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      }
    },
    setSelectedFields(fields: Record<string, SelectedFieldConfig>) {
      // console.log('setSelectedFields: ', JSON.parse(JSON.stringify(fields)))
      this.selectedFields = fields
    },
    setStartField() {
      // set "ingångsord" to default, also for statistics
      //console.log('setStartField()')
      const fields: Record<string, SelectedFieldConfig> = {}
      fields[entryWordField] = {
        value: '',
        position: 'equals',
        positionInitial: false,
        positionMedial: false,
        positionFinal: false,
      }
      this.setSelectedFields(fields)
      this.setSelectedCompileFields([entryWordField])
    },
    setSort(sf: string) {
      if (sf) {
        const sortParams: string[] = sf.split('|')
        if (sortParams.length > 1) {
          this.sortField = sortParams[0]
          if (sortParams.length > 2) {
            this.sortOrder = sortParams[1]
          }
        }
      }
    },
    setIsData(x: boolean) {
      this.isData = x
    },
    setIsSearch(x: boolean) {
      this.isSearch = x
    },
    setIsStart(x: boolean) {
      this.isStart = x
    },
    incIsLoading() {
      this.isLoading++
    },
    decIsLoading() {
      this.isLoading--
    },
    resetIsLoading() {
      this.isLoading = 0
    },
    setEmpty() {
      this.selectedDatasets = []
      this.setActiveSearchTab('simple')
      this.setActiveResultTab('table')
    },
    localizeField(p: string): string {
      const pCamel = p //this.camelify(p)
      let label = p
      for (const c of this.currentFields) {
        if (c.name === pCamel) {
          if (this.activeLocale == 'sv') {
            label = c.label.swe ? c.label.swe : (c.label as unknown as string)
          } else {
            label = c.label.eng ? c.label.eng : (c.label as unknown as string)
          }
          break
        }
      }
      return label
    },
    isList(p: string): boolean {
      let value = false
      this.currentFields.every((item) => {
        if (p === item.name) {
          value = item.collection
          return false
        } else {
          return true
        }
      })

      return value
    },
  },
})
