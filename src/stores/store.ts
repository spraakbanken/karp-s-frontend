import type { paramConfig } from '@/types/parameterPosition'
import { defineStore } from 'pinia'

import { type FieldConfig, type Config, type DatasetDates } from '@/types/datasetConfig.ts'
//import { isUndefined } from 'es-toolkit'

interface SearchRedux {
  //allParams: string[]
  currentConfig: Config
  currentDatasets: string[] // was - datasetKeys[]
  selectedDatasets: string[]
  currentTags: string[]
  //selectedTags: string[]
  //totalDatasets: number
  paramsInDatasets: Record<string, FieldConfig[]> // object with key: resurceId, value: FieldConfig-array
  currentParameters: FieldConfig[] // currentParams = available fields in selected datasets
  selectedParameters: Record<string, paramConfig>
  //selectedParams: string[]
  selectedColumns: string[]
  selectedCompileParams: string[]
  searchQuery: string
  activeSearchTab: string
  activeResultTab: string
  activeLocale: string
  listLimit: number
  datasetLabels: Record<string, string>
  datasetDates: DatasetDates[]
}

// currentParams = list of available fields in selected datasets
// selectedParams = list of selected fields
export const lexicalStore = defineStore('dataset', {
  state: (): SearchRedux => ({
    //allParams: [],
    currentConfig: { resources: [], tags: {}, fields: {} },
    currentDatasets: [],
    selectedDatasets: [],
    currentTags: [],
    //selectedTags: [],
    //totalDatasets: 0,
    paramsInDatasets: {},
    currentParameters: [],
    selectedParameters: {},
    //selectedParams: [],
    selectedColumns: [],
    selectedCompileParams: [],
    searchQuery: '',
    activeSearchTab: 'simple',
    activeResultTab: 'table',
    activeLocale: 'sv',
    listLimit: 5,
    datasetLabels: {},
    datasetDates: [],
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
      // paramsInDatasets: Record<string, FieldConfig[]>
      // object with key: resurceId, value: FieldConfig-array
      this.paramsInDatasets = config.resources.reduce(
        (acc, c) => {
          // we want the FieldConfig for f, not f name (string)
          acc[c.resourceId] = c.fields.map((f) => config.fields[f])
          return acc
        },
        {} as Record<string, FieldConfig[]>,
      )
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
    setSelectedCompileParams(params: string[]) {
      // console.log('selectedCompileParams', params)
      this.selectedCompileParams = params
    },
    setActiveSearchTab(tab: string) {
      this.activeSearchTab = tab
    },
    setActiveResultTab(tab: string) {
      this.activeResultTab = tab
    },
    setSelectedDataset(keys: string[]) {
      this.selectedDatasets = keys
      //      if (keys.length === 1) {
      //        this.currentParameters = keys.flatMap((k) => this.paramsInDatasets[k])
      //      } else {
      const allParamsArray = keys.map((key) => this.paramsInDatasets[key])
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
        this.currentParameters = [...intersection]
        // and add the "ingångsord"
        this.currentParameters.unshift({
          name: 'word',
          type: 'text',
          collection: false,
          label: { swe: 'ingångsord', eng: 'word' },
        })
        // and set "ingångsord" to default for statistics
        const parameters: Record<string, paramConfig> = {}
        parameters['word'] = { value: '', position: 'startswith' }
        this.setSelectedParameters(parameters)
        this.setSelectedCompileParams(['word'])
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
    setSelectedParameters(params: Record<string, paramConfig>) {
      this.selectedParameters = params
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
      for (const c of this.currentParameters) {
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
      this.currentParameters.every((item) => {
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
