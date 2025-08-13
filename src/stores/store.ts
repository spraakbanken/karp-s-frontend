import type { SelectedFieldConfig } from '@/types/datasetConfig'
import { defineStore } from 'pinia'

import { type FieldConfig, type Config, type DatasetDates } from '@/types/datasetConfig.ts'
//import { isUndefined } from 'es-toolkit'

interface SearchRedux {
  //allParams: string[]
  currentConfig: Config // all resources, tags, fields; set at HomeView > OnMounted()
  currentDatasets: string[] //  all datasets (id's)
  selectedDatasets: string[] // selected datasets (id's)
  currentTags: string[] // all tags
  //selectedTags: string[]
  //totalDatasets: number
  fieldsInDatasets: Record<string, FieldConfig[]> // all fields in datasets; object with key: resurceId, value: FieldConfig-array
  currentFields: FieldConfig[] // available fields in selected datasets
  selectedFields: Record<string, SelectedFieldConfig>
  //searchField: Record<string, SelectedFieldConfig>
  selectedColumns: string[]
  selectedCompileFields: string[]
  searchQuery: string
  activeSearchTab: string
  activeResultTab: string
  activeLocale: string
  datasetLabels: Record<string, string>
  datasetDates: DatasetDates[]
  listLimit: number
  isData: boolean
  isSearch: boolean
  isStart: boolean
}

// currentParams = list of available fields in selected datasets
// selectedParams = list of selected fields
export const lexicalStore = defineStore('dataset', {
  state: (): SearchRedux => ({
    currentConfig: { resources: [], tags: {}, fields: {} },
    currentDatasets: [],
    selectedDatasets: [],
    currentTags: [],
    fieldsInDatasets: {},
    currentFields: [],
    selectedFields: {},
    //searchField: {},
    selectedColumns: [],
    selectedCompileFields: [],
    searchQuery: '',
    activeSearchTab: 'simple',
    activeResultTab: 'table',
    activeLocale: 'sv',
    datasetLabels: {},
    datasetDates: [],
    listLimit: 5,
    isData: false,
    isSearch: false,
    isStart: true,
  }),
  actions: {
    setDefault(config: Config) {
      this.currentConfig = config
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

      // sort datasetLabels
      /*
      this.datasetLabels = Object.keys(this.datasetLabels)
        .sort(function (a, b) {
          return a.localeCompare(b, 'sv', { numeric: true })
        })
        .reduce((acc, key) => {
          acc[key] = this.datasetLabels[key]
          return acc
        }, {})
      console.log('SORTED', this.datasetLabels)
      */

      this.currentTags = [
        ...new Set(config.resources.flatMap((c) => (c.tags == undefined ? [] : c.tags))),
      ]
      // .filter((elt) => elt !== undefined))
      console.log('CurrentTags:', this.currentTags)
      this.datasetDates = config.resources.map((c) => ({
        resourceId: c.resourceId,
        label: this.datasetLabels[c.resourceId],
        updated: c.updated,
      }))
      /*
        .reduce((acc, obj) => {
          return { ...acc, ...obj }
        }, {})
        */
      this.datasetDates.sort(function (a, b) {
        return parseInt(b.updated) - parseInt(a.updated)
      })

      console.log('datasetDates', this.datasetDates)
      //this.allParams = config.flatMap((c) => c.fields.map((f) => f.name))

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

      // setup default datasets for first run
      this.setSelectedDataset(['saol14', 'so2009'])
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
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
    setActiveSearchTab(tab: string) {
      this.activeSearchTab = tab
    },
    setActiveResultTab(tab: string) {
      this.activeResultTab = tab
    },
    setSelectedDataset(keys: string[]) {
      console.log('setSelectedDataset')
      this.selectedDatasets = keys
      //      if (keys.length === 1) {
      //        this.currentParameters = keys.flatMap((k) => this.paramsInDatasets[k])
      //      } else {
      const allParamsArray = keys.map((key) => this.fieldsInDatasets[key])
      if (allParamsArray.length > 0) {
        // keep only fields that exist in all datasets = find the intersection
        let intersection = allParamsArray[0]
        for (let i = 1; i < allParamsArray.length; i++) {
          intersection = intersection.filter((param) =>
            allParamsArray[i].some(
              (otherParam) => otherParam.name === param.name && otherParam.type === param.type,
            ),
          )
        }
        // make a copy
        this.currentFields = [...intersection]
        // and add the "ingångsord"
        this.currentFields.unshift({
          name: 'word',
          type: 'text',
          collection: false,
          label: { swe: 'ingångsord', eng: 'word' },
        })

        // if we have fields in selectedFields (from beforehand)
        // that are now not in currentFields
        // remove them from selectedFields
        console.log('setSelectedDataset: cleaning up copies')
        const newSelectedFields: Record<string, SelectedFieldConfig> = {}
        for (const [k, v] of Object.entries(this.selectedFields)) {
          let bFound = false
          console.log('k, v', k, v)
          if (this.currentFields.find((f) => f.name === k)) {
            bFound = true
          }
          if (bFound) {
            newSelectedFields[k] = v
          }
        }
        this.selectedFields = newSelectedFields
        // and set "ingångsord" to default, also for statistics
        // TODO if selectedFields exists in all selected datasets
        // don't do this:
        console.log('in setSelectedDataset', this.selectedFields)
        let isEmpty = true
        for (const [k, v] of Object.entries(this.selectedFields)) {
          console.log('k, v', k, v)
          if (v.value !== '') {
            isEmpty = false
          }
        }
        if (isEmpty) {
          const fields: Record<string, SelectedFieldConfig> = {}
          fields['word'] = { value: '', position: 'equals' }
          this.setSelectedFields(fields)
          this.setSelectedCompileFields(['word'])
        }
        this.isData = false
      } else {
        return []
      }
      //}
    },
    /*
    setSelectedTag(tags: string[]) {
      this.selectedTags = tags
      this.setSelectedDataset(this.selectedDatasets)
    },
    */
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
      console.log('setSelectedFields', fields)
      this.selectedFields = fields
    },
    setStartField() {
      // set "ingångsord" to default, also for statistics
      console.log('setStartField()')
      const fields: Record<string, SelectedFieldConfig> = {}
      fields['word'] = { value: '', position: 'equals' }
      this.setSelectedFields(fields)
      this.setSelectedCompileFields(['word'])
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
    setEmpty() {
      this.selectedDatasets = []
      this.setActiveSearchTab('simple')
      this.setActiveResultTab('table')
    },
    setListLimit(x: number) {
      this.listLimit = x
    },
    localizeParam(p: string): string {
      let label = p
      for (const c of this.currentFields) {
        if (c.name === p) {
          if (this.activeLocale == 'sv') {
            label = c.label.swe ? c.label.swe : (c.label as unknown as string)
          } else {
            label = c.label.eng ? c.label.eng : (c.label as unknown as string)
          }
        }
      }
      return label
    },
    isList(p: string): boolean {
      let value = false
      this.currentFields.every((item) => {
        if (p == item.name) {
          value = item.collection
          return false
        } else {
          return true
        }
      })
      return value
    },
    formatCell(x: string | string[]): string {
      let value = ''
      //Array.isArray(x) ? x.join(', ') : x
      if (Array.isArray(x)) {
        x.every((item, index) => {
          if (index > 0) {
            value = value + '<br>' + item
          } else {
            value = item
          }
          if (index == this.listLimit - 1) {
            if (index + 1 < x.length) {
              value = value + '<br>' + '(' + x.length + ')'
            }
            return false
          } else {
            return true
          }
        })
      } else {
        value = x
      }
      return value
    },
  },
})
