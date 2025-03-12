import axios from 'axios'
import { processDatasets } from '@/utils/processDatasets'
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
    // console.log('Fetched datasets:', response)
    return response.data
  } catch (error) {
    throw error
  }
}

export const getTableData = async (compile: string) => {
  try {
    const lexicalStoreData = lexicalStore()
    const datasets = lexicalStoreData.selectedDatasets
    const resources = datasets.join(',')
    const queryParam = Object.entries(lexicalStoreData.activeParameters)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',');

    const params : Record<string, string> = {}
    params['resources'] = resources
    if (queryParam) {
      params['q'] = queryParam
    }
    if (compile) {
      params['compile'] = compile
    }
    // console.log('param:', params)
    const response = await axiosInstance.get(`/search`, {
      params:
        params
    });
    // console.log('Fetched data:', response.data.hits)
    return processDatasets(response.data.hits)
  } catch (error) {
    throw error
  }
}

export const getStatisticsData = async (query: Record<string, paramConfig>, columns: string[]) => {
  try {
    console.log('Fetching data for:', query, columns)
    const lexicalStoreData = lexicalStore()
    const datasets = lexicalStoreData.selectedDatasets
    const resources = datasets.join(',')
    const queryParam = Object.entries(query)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',');

    const response = await axiosInstance.get(`/count`, {
      params: {
        resources: resources,
        q: queryParam,
        compile: 'baseform',
        columns: 'partOfSpeech=resource_id'
      },
    });
    // console.log('Fetched data:', response.data.table)
    return response.data.table
  } catch (error) {
    throw error
  }
}
