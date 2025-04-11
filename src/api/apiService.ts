import axios from 'axios'
import { processDatasets, processSubDataset } from '@/utils/processDatasets'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'

export const apiUrl = import.meta.env.VITE_API_URL as string

const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getLexicalDatasets = async () => {
  try {
    const response = await axiosInstance.get('/config')
    console.log('AXIOS Fetched datasets:', response)
    return response.data //.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label),)
  } catch (error) {
    throw error
  }
}

export const getTableData = async () => {
  try {
    const lexicalStoreData = lexicalStore()
    const datasets = lexicalStoreData.selectedDatasets
    const resources = datasets.join(',')
    const queryParam = Object.entries(lexicalStoreData.selectedParameters)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',')

    const params: Record<string, string> = {}
    params['resources'] = resources
    if (queryParam) {
      params['q'] = queryParam
    }
    console.log('AXIOS getTableData: param:', params)
    const response = await axiosInstance.get(`/search`, {
      params: params,
    })
    console.log('AXIOS getTableData: hits:', response.data.hits)
    const processedData = processDatasets(response.data.hits)

    return processedData
  } catch (error) {
    throw error
  }
}

export const getSubTableData = async (compile: string, pageSize: number, dataset: string) => {
  try {
    const lexicalStoreData = lexicalStore()
    const datasets = lexicalStoreData.selectedDatasets
    const resources = datasets.join(',')
    const queryParam = Object.entries(lexicalStoreData.selectedParameters)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',')

    const params: Record<string, string> = {}
    params['resources'] = resources
    if (queryParam) {
      params['q'] = queryParam
    }
    if (compile) {
      params['compile'] = compile
    }
    if (pageSize > 10) {
      params['from'] = pageSize.toString()
    }
    // console.log('param:', params)
    const response = await axiosInstance.get(`/search`, {
      params: params,
    })
    // console.log('Fetched data:', response.data.hits)
    const processedData = processSubDataset(response.data.hits, dataset)
    return processedData
  } catch (error) {
    throw error
  }
}

export const getStatisticsData = async (
  query: Record<string, paramConfig>,
  compileParams: string[],
  columns: string[],
) => {
  try {
    // console.log('Fetching data for:', query, columns)
    const lexicalStoreData = lexicalStore()
    const datasets = lexicalStoreData.selectedDatasets
    const resources = datasets.join(',')
    const queryParam = Object.entries(query)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',')
    const params: Record<string, string> = {}
    params['resources'] = resources
    if (queryParam) {
      params['q'] = queryParam
    }
    if (compileParams.length > 0) {
      params['compile'] = compileParams.join(',')
    }
    if (columns.length > 0) {
      params['columns'] = 'resource_id=' + columns.join(',')
    }
    const response = await axiosInstance.get(`/count`, {
      params: params,
    })
    // console.log('Fetched data:', response.data.table)
    const tableData = response.data.table
    const headers = response.data.headers
    return { tableData, headers }
  } catch (error) {
    throw error
  }
}
