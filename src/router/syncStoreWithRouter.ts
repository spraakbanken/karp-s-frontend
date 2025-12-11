import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'
import type { SelectedFieldConfig } from '@/types/datasetConfig'

export enum SyncResult {
  SYNC_RESULT_NOT_SYNCED = 0,
  SYNC_RESULT_SYNCED = 1,
  SYNC_RESULT_DATASET_UNKNOWN = 2,
}

export function syncStoreWithRouter(router: Router): SyncResult {
  const lexicalStorage = lexicalStore()

  const updateRouterQuery = () => {
    //console.log('updateRouterQuery, lexicalStorage.pageStart:', lexicalStorage.pageStart)
    const currentQuery = router.currentRoute.value.query
    let queryString = ''
    if (lexicalStorage.activeSearchTab == 'advanced') {
      queryString = lexicalStorage.searchQuery
    } else if (
      lexicalStorage.activeSearchTab == 'extended' &&
      Object.keys(lexicalStorage.selectedFields).length > 1
    ) {
      if (lexicalStorage.searchExtendedOp == true) {
        queryString = 'and'
      } else {
        queryString = 'or'
      }
      queryString +=
        '(' +
        Object.entries(lexicalStorage.selectedFields)
          .map(([key, value]) => `${value.position}|${key}|${value.value}`)
          .join('||') +
        ')'
    } else {
      // simple search
      // TODO not necessary as simple search only has one field
      queryString = Object.entries(lexicalStorage.selectedFields)
        .map(([key, value]) => `${value.position}|${key}|${value.value}`)
        .join(',')
    }
    const newQuery = {
      ...currentQuery,
      resources: lexicalStorage.selectedDatasets.join(','),
      q: queryString,
      compile: lexicalStorage.selectedCompileFields.join(','),
      columns: lexicalStorage.selectedColumns.join(','),
      tab: ['table', 'statistics'].includes(lexicalStorage.activeResultTab)
        ? lexicalStorage.activeResultTab
        : 'statistics',
      searchtab: lexicalStorage.activeSearchTab,
      sort: lexicalStorage.tableSortField + '|' + lexicalStorage.tableSortOrder,
      tablePageRowStart: lexicalStorage.tablePageRowStart,
      tablePageSize: lexicalStorage.tablePageSize,
      statisticsPageStart: lexicalStorage.statisticsPageStart,
      statisticsPageSize: lexicalStorage.statisticsPageSize,
    }

    const filteredQuery = Object.fromEntries(
      Object.entries(newQuery).filter(
        ([key, value]) => value !== '' && value !== null && value !== undefined,
      ),
    )

    if (JSON.stringify(currentQuery) !== JSON.stringify(filteredQuery)) {
      router.push({ query: filteredQuery })
    }
  }

  watch(
    () => ({
      resources: lexicalStorage.selectedDatasets,
      q: lexicalStorage.selectedFields,
      compile: lexicalStorage.selectedCompileFields,
      columns: lexicalStorage.selectedColumns,
      tab: lexicalStorage.activeResultTab,
      searchTab: lexicalStorage.activeSearchTab,
      sortField: lexicalStorage.tableSortField,
      sortOrder: lexicalStorage.tableSortOrder,
      tablePageRowStart: lexicalStorage.tablePageRowStart,
      tablePageSize: lexicalStorage.tablePageSize,
      statisticsPageStart: lexicalStorage.statisticsPageStart,
      statisticsPageSize: lexicalStorage.statisticsPageSize,
    }),
    () => {
      updateRouterQuery()
    },
    { deep: true },
  )

  const initializeStoreFromQuery = (): SyncResult => {
    const query = new URLSearchParams(window.location.search)
    //console.log('initializeStoreFromQuery: query=', query)
    let syncResult: SyncResult = SyncResult.SYNC_RESULT_NOT_SYNCED

    if (query.has('resources')) {
      const datasetsInURL: string[] = query.get('resources')!.split(',')
      // check that the dataset(s) in the URL exists
      if (lexicalStorage.areDatasetsInConfig(datasetsInURL)) {
        lexicalStorage.setSelectedDataset(datasetsInURL)
        syncResult = SyncResult.SYNC_RESULT_SYNCED
      } else {
        syncResult = SyncResult.SYNC_RESULT_DATASET_UNKNOWN
      }
    }
    if (syncResult === SyncResult.SYNC_RESULT_SYNCED) {
      if (query.has('searchtab')) {
        lexicalStorage.setActiveSearchTab(query.get('searchtab')!)
      }
      if (query.has('q')) {
        if (lexicalStorage.activeSearchTab == 'advanced') {
          lexicalStorage.setSearchQuery(query.get('q')!)
        } else {
          const queryString = query.get('q')!
          if (queryString.startsWith('and') || queryString.startsWith('or')) {
            // eg and(op1, op2, ...), or(op1, op2, ...)
            const regex = /\(([^)]+)\)/
            const match = queryString.match(regex)
            if (match) {
              const activeFields = match[1].split('||').map((value) => value.trim())
              //console.log('ISfQ:', activeFields) // Output: ['a', 'b', 'c']
              const selectedFields: Record<string, SelectedFieldConfig> = {}
              for (const field of activeFields) {
                const [position, key, value] = field.split('|')
                //console.log('ISfQ: activeParams=', activeFields, position, key, value)
                selectedFields[key] = {
                  value: value,
                  position: position,
                  positionInitial: position == 'startswith',
                  positionMedial: position == 'contains',
                  positionFinal: position == 'endswith',
                }
              }
              lexicalStorage.setSearchExtendedOp(queryString.startsWith('and'))
              lexicalStorage.setSelectedFields(selectedFields)
            }
          } else {
            // TODO no split should be necessary as this is simple search = only one field
            const activeFields = query.get('q')!.split(',')
            const selectedFields: Record<string, SelectedFieldConfig> = {}
            for (const field of activeFields) {
              const [position, key, value] = field.split('|')
              //console.log('initializeStoreFromQuery: activeParams=', activeFields, position, key, value)
              selectedFields[key] = {
                value: value,
                position: position,
                positionInitial: position == 'startswith',
                positionMedial: position == 'contains',
                positionFinal: position == 'endswith',
              }
              //console.log('iSFQ: ', JSON.parse(JSON.stringify(selectedFields)))
            }
            lexicalStorage.setSelectedFields(selectedFields)
          }
        }
      }
      if (query.has('compile')) {
        const selectedCompileParams = query.get('compile')!.split(',')
        lexicalStorage.setSelectedCompileFields(selectedCompileParams)
      }
      if (query.has('columns')) {
        const selectedColumns = query.get('columns')!.split(',')
        lexicalStorage.setSelectedColumns(selectedColumns)
      }
      if (query.has('tab')) {
        lexicalStorage.setActiveResultTab(query.get('tab')!)
      }
      if (query.has('sort')) {
        lexicalStorage.setSort(query.get('sort')!)
      }
      if (query.has('tablePageRowStart')) {
        lexicalStorage.tablePageRowStart = Number(query.get('tablePageRowStart'))
      }
      if (query.has('tablePageSize')) {
        lexicalStorage.tablePageSize = Number(query.get('tablePageSize'))
      }
      if (query.has('statisticsPageStart')) {
        lexicalStorage.statisticsPageStart = Number(query.get('statisticsPageStart'))
      }
      if (query.has('statisticsPageSize')) {
        lexicalStorage.statisticsPageSize = Number(query.get('statisticsPageSize'))
      }

      //if (syncResult === SyncResult.SYNC_RESULT_SYNCED) {
      lexicalStorage.setIsSearch(true, true)
      //}
    }

    return syncResult
  }

  const syncResult = initializeStoreFromQuery()
  window.addEventListener('popstate', initializeStoreFromQuery)
  return syncResult
}
