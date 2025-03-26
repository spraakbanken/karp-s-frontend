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
  searchQuery: string
  selectedParams: string[]
  selectedColumns: string[]
  selectedCompileParams: string[]
  activeTab: string
  datasetKeys: string[]
  activeLocale: string
  selectedDatasets: string[]
  totalDatasets: number
  allParams: string[]
  paramsInDatasets: Record<string, string[]>
  currentParams: string[]
  activeParameters: Record<string, paramConfig>
  lexicalLabels: Record<string, string>
}

export const lexicalStore = defineStore('dataset', {
  state: (): SearchRedux => ({
    searchQuery: '',
    selectedParams: [],
    selectedColumns: [],
    selectedCompileParams: [],
    activeTab: 'table',
    datasetKeys: [],
    activeLocale: 'swe',
    selectedDatasets: [],
    totalDatasets: 0,
    allParams: [],
    paramsInDatasets: {},
    currentParams: [],
    activeParameters: {},
    lexicalLabels: {},
  }),
  actions: {
    setDefault(config: KarpsConfig[]) {
      this.datasetKeys = config.map((c) => c.resourceId)
      this.lexicalLabels = config
        .map((c) => ({ [c.resourceId]: c.label }))
        .reduce((acc, obj) => {
          return { ...acc, ...obj }
        }, {})
      // console.log('lexicalLabels', this.lexicalLabels)
      this.totalDatasets = config.length
      this.allParams = config.flatMap((c) => c.fields.map((f) => f.name))
      this.paramsInDatasets = config.reduce(
        (acc, c) => {
          acc[c.resourceId] = c.fields.map((f) => f.name)
          return acc
        },
        {} as Record<string, string[]>,
      )
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    setSelectedParams(params: string[]) {
      // Not used
      this.selectedParams = params
    },
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
      this.selectedDatasets = keys
      if (keys.length === 1) {
        this.currentParams = keys.flatMap((k) => this.paramsInDatasets[k])
      } else {
        const allParamsArray = keys.map((key) => this.paramsInDatasets[key])
        if (allParamsArray.length > 0) {
          this.currentParams = allParamsArray.reduce((acc, params) => {
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
      this.activeParameters = params
    },
    setEmpty() {
      this.selectedDatasets = []
      this.setActiveTab('table')
    },
  },
})
