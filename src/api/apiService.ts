import axios from 'axios'
//import { processDatasets, processSubDataset } from '@/utils/processDatasets'
import { lexicalStore } from '@/stores/store'
import { type SelectedFieldConfig, entryWordField } from '@/types/datasetConfig'

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
    return response.data
  } catch (error) {
    throw error
  }
}

export const getTableData = async (pageStart: number, pageSize: number) => {
  try {
    const lexicalStorage = lexicalStore()
    const datasets = lexicalStorage.selectedDatasets
    const resources = datasets.join(',')
    const queryParam = Object.entries(lexicalStorage.selectedFields)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',')

    const params: Record<string, string> = {}
    params['resources'] = resources
    if (queryParam) {
      if (!queryParam.endsWith('|')) {
        params['q'] = queryParam
      }
    }

    // TODO: remove this if when it is working in the BE
    if (lexicalStorage.sortField != entryWordField) {
      params['sort'] = lexicalStorage.sortField + '|' + lexicalStorage.sortOrder
    }

    params['size'] = pageSize.toString()
    //    }
    //    if (pageSize > 10) {
    params['from'] = ((pageStart - 1) * pageSize).toString()

    //console.log('AXIOS getTableData: param:', params)
    const response = await axiosInstance.get(`/search`, {
      params: params,
    })
    // console.log('AXIOS getTableData: hits:', response.data.hits)
    //const processedData = processDatasets(response.data.hits)

    return response.data
  } catch (error) {
    throw error
  }
}

export const getStatisticsData = async (
  query: Record<string, SelectedFieldConfig>,
  compileParams: string[],
  columns: string[],
  columnCount: boolean,
) => {
  try {
    // console.log('Fetching data for:', query, columns)
    const lexicalStorage = lexicalStore()
    const datasets = lexicalStorage.selectedDatasets
    const resources = datasets.join(',')
    /*
    const queryParam = Object.entries(query)
      .map(
        ([key, value]) =>
          `${value.position}|${encodeURIComponent(key)}|${encodeURIComponent(value.value)}`,
      )
      .join(',')
    */

    const queryParam = Object.entries(query)
      .map(([key, value]) => `${value.position}|${key}|${value.value}`)
      .join(',')

    const params: Record<string, string> = {}
    params['resources'] = resources
    if (queryParam) {
      if (!queryParam.endsWith('|')) {
        params['q'] = queryParam
      }
    }
    if (compileParams.length > 0) {
      params['compile'] = compileParams.join(',')
    }
    if (columns.length > 0) {
      //params['columns'] = 'resource_id=' + columns.join(',')
      if (columnCount) {
        params['columns'] = columns.map((item) => `${item}=_count`).join(',')
      } else {
        params['columns'] = columns.map((item) => `resource_id=${item}`).join(',')
      }
    }
    //console.log('AXIOS call:', queryParam, params)
    const response = await axiosInstance.get(`/count`, {
      params: params,
    })
    const tableData = response.data.table
    const headers = response.data.headers
    return { tableData, headers }
  } catch (error) {
    throw error
  }
}
