import axios from 'axios'
//import { processDatasets, processSubDataset } from '@/utils/processDatasets'
import { lexicalStore } from '@/stores/store'
import { type SelectedFieldConfig, entryWordField } from '@/types/datasetConfig'
import { BEErrorCode, BEErrorMessage } from '@/utils/constants'
//import type { forEach } from 'es-toolkit/compat'

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
  const lexicalStorage = lexicalStore()
  try {
    lexicalStorage.incIsLoading()

    const datasets = lexicalStorage.selectedDatasets
    const params: Record<string, string> = {}

    // datasets
    const resources = datasets.join(',')
    params['resources'] = resources

    // query/field parameters
    if (
      lexicalStorage.activeSearchTab == 'simple' ||
      lexicalStorage.activeSearchTab == 'extended'
    ) {
      const queryParam = Object.entries(lexicalStorage.selectedFields)
        .map(([key, value]) => `${value.position}|${key}|"${value.value.replace(/"/g, '\\"')}"`)
        .join('||')
      console.log('queryParam: ', queryParam)
      if (queryParam) {
        if (!queryParam.endsWith('|') && !queryParam.endsWith('|""')) {
          if (Object.keys(lexicalStorage.selectedFields).length == 1) {
            params['q'] = queryParam
          } else {
            // more than one field, ie Extended search
            if (lexicalStorage.searchExtendedOp == true) {
              params['q'] = 'and(' + queryParam + ')'
            } else {
              params['q'] = 'or(' + queryParam + ')'
            }
            //console.log('gtd: ', lexicalStorage.searchExtendedOp, params['q'])
          }
        }
      }
    } else if (lexicalStorage.activeSearchTab == 'advanced') {
      params['q'] = lexicalStorage.searchQuery
    }

    // TODO: remove this if when it is working in the BE
    if (lexicalStorage.tableSortField != entryWordField) {
      params['sort'] = lexicalStorage.tableSortField + '|' + lexicalStorage.tableSortOrder
    }

    params['size'] = pageSize.toString()
    params['from'] = pageStart.toString()

    lexicalStorage.abortController = new AbortController()
    const signal = lexicalStorage.abortController.signal
    //console.log('getTableData: ', params)
    const response = await axiosInstance.get(`/search`, {
      params: params,
      signal: signal,
    })
    lexicalStorage.resetIsLoading()
    return response.data
  } catch (error) {
    let errMsg = ''
    lexicalStorage.decIsLoading()

    if (axios.isCancel(error)) {
      // request was cancelled "by user", no error, return empty data
      return {}
    } else {
      if (error.response?.data?.detail !== undefined) {
        const d = error.response.data.detail
        if (Array.isArray(d)) {
          d.forEach((obj) => {
            Object.keys(obj).forEach((key) => {
              errMsg += `${key}: ${obj[key]}` + '. '
            })
          })
        } else if (typeof d === 'object' && d !== null) {
          Object.keys(d).forEach((key) => {
            errMsg += `${key}: ${d[key]}` + '. '
          })
        }
      } else {
        errMsg = (error as Error).message
      }
      //console.log('Error catch:', errMsg)
      //throw error
      throw new Error(errMsg ? errMsg : 'unknown')
    }
  }
}

export const getStatisticsData = async (
  query: Record<string, SelectedFieldConfig>,
  compileParams: string[],
  columns: string[],
  columnCount: boolean,
): Promise<{ headers: []; table: []; totals: [] }> => {
  const lexicalStorage = lexicalStore()

  try {
    // request was cancelled "by user", no error, return empty data
    lexicalStorage.incIsLoading()
    const datasets = lexicalStorage.selectedDatasets
    const params: Record<string, string> = {}

    // datasets
    const resources = datasets.join(',')
    params['resources'] = resources

    // query/field parameters
    const queryParam = Object.entries(query)
      .map(([key, value]) => `${value.position}|${key}|"${value.value.replace(/"/g, '\\"')}"`)
      .join('||')
    if (queryParam) {
      if (!queryParam.endsWith('|') && !queryParam.endsWith('|""')) {
        if (Object.keys(lexicalStorage.selectedFields).length == 1) {
          params['q'] = queryParam
        } else {
          // more than one field, ie Extended search
          if (lexicalStorage.searchExtendedOp == true) {
            params['q'] = 'and(' + queryParam + ')'
          } else {
            params['q'] = 'or(' + queryParam + ')'
          }
        }
      }
    }

    // compile on
    if (compileParams.length > 0) {
      params['compile'] = compileParams.join(',')
    }

    // columns
    if (columns.length > 0) {
      //params['columns'] = 'resource_id=' + columns.join(',')
      if (columnCount) {
        params['columns'] = columns.map((item) => `${item}=_count`).join(',')
      } else {
        params['columns'] = columns.map((item) => `resource_id=${item}`).join(',')
      }
    }

    lexicalStorage.abortController = new AbortController()
    const signal = lexicalStorage.abortController.signal

    const response = await axiosInstance.get(`/count`, {
      params: params,
      signal: signal,
    })
    lexicalStorage.resetIsLoading()
    lexicalStorage.abortController = null

    return {
      headers: response.data.headers,
      table: response.data.table,
      totals: response.data.total,
    }
  } catch (error) {
    let errMsg = ''
    lexicalStorage.decIsLoading()

    //console.log(axios.isCancel(error), error)
    if (axios.isCancel(error)) {
      // request was cancelled "by user", no error, return empty data
      return { headers: [], table: [], totals: [] }
    } else {
      console.log('Error - message:', error.response.data.message)
      console.log('Error - code:', error.response.data.code)
      if (Number(error.response?.data?.code) > 0) {
        errMsg += BEErrorMessage(Number(error.response?.data?.code) as BEErrorCode) + '. '
      }
      if (error.response?.data?.detail !== undefined) {
        const d = error.response.data.detail
        if (Array.isArray(d)) {
          d.forEach((obj) => {
            Object.keys(obj).forEach((key) => {
              errMsg += `${key}: ${obj[key]}` + '. '
            })
          })
        } else if (typeof d === 'object' && d !== null) {
          Object.keys(d).forEach((key) => {
            errMsg += `${key}: ${d[key]}` + '. '
          })
        }
      } else {
        errMsg += (error as Error).message
      }
      throw new Error(errMsg ? errMsg : 'unknown')
    }
  }
}

// pageStart starts at 0 in this function
export const getTabRefData = async (
  resourceId: string[],
  columnField: string,
  columnValue: string,
  pageStart: number,
  pageSize: number,
) => {
  try {
    const params: Record<string, string> = {}

    // datasets
    params['resources'] = resourceId.join(',')

    // query/field parameters
    params['q'] = 'equals|' + columnField + '|"' + columnValue.replace(/"/g, '\\"') + '"'

    params['from'] = pageStart.toString()
    params['size'] = pageSize.toString()

    const response = await axiosInstance.get(`/search`, {
      params: params,
    })
    return response.data
  } catch (error) {
    console.log('Error catch:', error)
    //throw error
  }
}
