import type { paramConfig } from '@/types/parameterPosition'
import { defineStore } from 'pinia'

import {
  type FieldConfig,
  type Label,
  type Resource,
  type TagLabel,
  type Tag,
  type FieldConfigArray,
  type Config,
  type DatasetDates,
} from '@/types/datasetConfig.ts'

interface SearchRedux {
  //allParams: string[]
  currentDatasets: string[] // was - datasetKeys[]
  selectedDatasets: string[]
  //totalDatasets: number
  paramsInDatasets: Record<string, FieldConfig[]> // object with key: resurceId, value: FieldConfig-array
  currentParameters: FieldConfig[] // currentParams = available fields in selected datasets
  selectedParameters: Record<string, paramConfig>
  //selectedParams: string[]
  selectedColumns: string[]
  selectedCompileParams: string[]
  searchQuery: string
  activeTab: string
  activeLocale: string
  datasetLabels: Record<string, string>
  datasetDates: DatasetDates[]
}

// currentParams = list of available fields in selected datasets
// selectedParams = list of selected fields
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
    datasetLabels: {},
    datasetDates: [],
  }),
  actions: {
    setDefault(config: Config) {
      console.log('--setDefault', config)

      this.currentDatasets = config.resources.map((c) => c.resourceId)
      this.datasetLabels = config.resources
        .map((c) => ({ [c.resourceId]: c.label.eng ? c.label.eng : c.label })) // TODO
        .reduce((acc, obj) => {
          return { ...acc, ...obj }
        }, {})
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
    setActiveTab(tab: string) {
      this.activeTab = tab
    },
    setSelectedDataset(keys: string[]) {
      this.selectedDatasets = keys
      if (keys.length === 1) {
        this.currentParameters = keys.flatMap((k) => this.paramsInDatasets[k])
      } else {
        const allParamsArray = keys.map((key) => this.paramsInDatasets[key])
        if (allParamsArray.length > 0) {
          // remove duplicates
          let intersection = allParamsArray[0]

          // Find the intersection with the rest of the datasets
          for (let i = 1; i < allParamsArray.length; i++) {
            intersection = intersection.filter((param) =>
              allParamsArray[i].some(
                (otherParam) => otherParam.name === param.name && otherParam.type === param.type,
              ),
            )
          }
          this.currentParameters = intersection

          /*
          this.currentParameters = allParamsArray.filter(
            (obj1, i, arr) => arr.findIndex((obj2) => obj2.name === obj1.name) === i,
          )
            */
          //return acc.filter((param) => params.includes(param))
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
