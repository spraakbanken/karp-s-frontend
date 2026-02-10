import axios, { AxiosError } from 'axios'
//import { processDatasets, processSubDataset } from '@/utils/processDatasets'
import { lexicalStore } from '@/stores/store'
//import { type SelectedFieldConfig, entryWordField } from '@/types/datasetConfig'
import { BEErrorCode, BEErrorMessage } from '@/utils/constants'
//import type { forEach } from 'es-toolkit/compat'

export const apiUrl = import.meta.env.VITE_API_URL as string

export const axiosInstance = axios.create({
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
      /*
      const queryParam = Object.entries(lexicalStorage.selectedFields)
        .map(([key, value]) => `${value.position}|${key}|"${value.value.replace(/"/g, '\\"')}"`)
        .join('||')
        */
      let queryParam = ''
      for (let i = 0; i < lexicalStorage.selectedFieldsCount; i++) {
        const sf = lexicalStorage.selectedFields[i]
        const q = sf.position + '|' + sf.name + '|' + sf.value.replace(/"/g, '\\"')
        queryParam = queryParam === '' ? q : queryParam + '||' + q
      }
      if (queryParam) {
        if (!queryParam.endsWith('|') && !queryParam.endsWith('|""')) {
          if (lexicalStorage.selectedFieldsCount == 1) {
            params['q'] = queryParam
          } else {
            // more than one field, ie Extended search
            if (lexicalStorage.searchExtendedOp) {
              params['q'] = 'and(' + queryParam + ')'
            } else {
              params['q'] = 'or(' + queryParam + ')'
            }
          }
        }
      }
    } else if (lexicalStorage.activeSearchTab == 'advanced') {
      params['q'] = lexicalStorage.searchQuery
    }

    params['sort'] = lexicalStorage.tableSortField + '|' + lexicalStorage.tableSortOrder
    params['size'] = pageSize.toString()
    params['from'] = pageStart.toString()

    lexicalStorage.abortController = new AbortController()
    const signal = lexicalStorage.abortController.signal

    //console.log('params:', params)

    const response = await axiosInstance.get(`/search`, {
      params: params,
      signal: signal,
      /*      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`, // Use Bearer token authentication
      },*/
    })
    lexicalStorage.resetIsLoading()
    lexicalStorage.abortController = null

    return response.data
  } catch (error) {
    lexicalStorage.decIsLoading()

    if (axios.isCancel(error)) {
      // request was cancelled "by user", no error, return empty data
      return {}
    } else {
      const errMsg = handleError(error)
      throw new Error(errMsg ? errMsg : 'unknown')
    }
  }
}

export const getStatisticsData = async (
  compileParams: string[],
  columns: string[],
  columnCount: boolean,
): Promise<{ headers: []; table: []; totals: [] }> => {
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
      let queryParam = ''
      for (let i = 0; i < lexicalStorage.selectedFieldsCount; i++) {
        const sf = lexicalStorage.selectedFields[i]
        const q = sf.position + '|' + sf.name + '|' + sf.value.replace(/"/g, '\\"')
        queryParam = queryParam === '' ? q : queryParam + '||' + q
      }
      if (queryParam) {
        if (!queryParam.endsWith('|') && !queryParam.endsWith('|""')) {
          if (lexicalStorage.selectedFieldsCount == 1) {
            params['q'] = queryParam
          } else {
            // more than one field, ie Extended search
            if (lexicalStorage.searchExtendedOp) {
              params['q'] = 'and(' + queryParam + ')'
            } else {
              params['q'] = 'or(' + queryParam + ')'
            }
          }
        }
      }
    } else if (lexicalStorage.activeSearchTab == 'advanced') {
      params['q'] = lexicalStorage.searchQuery
    }

    // compile on
    if (compileParams.length > 0) {
      params['compile'] = compileParams.join(',')
    }

    // columns
    if (columns.length > 0) {
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
  } catch (error: unknown) {
    lexicalStorage.decIsLoading()

    if (axios.isCancel(error)) {
      // request was cancelled "by user", no error, return empty data
      return { headers: [], table: [], totals: [] }
    } else {
      const errMsg = handleError(error)
      throw new Error(errMsg ? errMsg : 'unknown')
    }
  }
}

const handleError = (error: unknown): string => {
  let errMsg = ''

  if (error instanceof AxiosError) {
    // const axiosError = error as AxiosError

    if (Number(error.response?.data?.code) > 0) {
      errMsg += BEErrorMessage(Number(error.response?.data?.code) as BEErrorCode) + ' '
    } else if (error.response?.data?.detail !== undefined) {
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
  } else {
    errMsg += (error as Error).message
  }

  return errMsg
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
    // TODO throw error
  }
}
