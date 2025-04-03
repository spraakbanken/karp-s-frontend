import type { paramConfig } from '@/types/parameterPosition'
import { defineStore } from 'pinia'

interface FieldConfig {
  name: string
  type: string
  collection: boolean
}

interface KarpsConfig {
  resourceId: string
  label: string
  fields: FieldConfig[]
}

interface SearchRedux {
  //allParams: string[]
  currentDatasets: string[] // was - datasetKeys[]
  selectedDatasets: string[]
  //totalDatasets: number
  paramsInDatasets: Record<string, FieldConfig[]> // resurceId - field names
  currentParameters: FieldConfig[] // currentParams = available fields in selected datasets
  selectedParameters: Record<string, paramConfig>
  //selectedParams: string[]

  selectedColumns: string[]
  selectedCompileParams: string[]
  searchQuery: string
  activeTab: string
  activeLocale: string
  lexicalLabels: Record<string, string>
}

// currentParams = list of available fields in selected datasets
// selectedParams = list of selected fields
// activeParameters
export const lexicalStore = defineStore('dataset', {
  state: (): SearchRedux => ({
    //allParams: [],
    currentDatasets: [],
    selectedDatasets: [],
    //totalDatasets: 0,
    paramsInDatasets: {},
    currentParameters: [],
    selectedParameters: {},
    //selectedParams: [],
    selectedColumns: [],
    selectedCompileParams: [],
    searchQuery: '',
    activeTab: 'table',
    activeLocale: 'swe',
    lexicalLabels: {},
  }),
  actions: {
    setDefault(config: KarpsConfig[]) {
      console.log('--setDefault', config)

      this.currentDatasets = config.map((c) => c.resourceId)
      this.lexicalLabels = config
        .map((c) => ({ [c.resourceId]: c.label }))
        .reduce((acc, obj) => {
          return { ...acc, ...obj }
        }, {})
      //this.totalDatasets = config.length
      //this.allParams = config.flatMap((c) => c.fields.map((f) => f.name))
      this.paramsInDatasets = config.reduce(
        (acc, c) => {
          acc[c.resourceId] = c.fields.map((f) => f)
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
    setActiveTab(tab: string) {
      this.activeTab = tab
    },
    setSelectedDataset(keys: string[]) {
      console.log('setSelectedDataset', keys)
      this.selectedDatasets = keys
      if (keys.length === 1) {
        this.currentParameters = keys.flatMap((k) => this.paramsInDatasets[k])
      } else {
        const allParamsArray = keys.map((key) => this.paramsInDatasets[key])
        if (allParamsArray.length > 0) {
          this.currentParameters = allParamsArray.reduce((acc, params) => {
            return acc.filter((param) => params.includes(param))
          })
        } else {
          return []
        }
      }
      // console.log('currentParams', this.currentParams)
    },
    setLocale(locale: string) {
      this.activeLocale = locale
    },
    setParameters(params: Record<string, paramConfig>) {
      this.selectedParameters = params
    },
    setEmpty() {
      this.selectedDatasets = []
      this.setActiveTab('table')
    },
  },
})
