import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'
import type { SelectedFieldConfig } from '@/types/datasetConfig'

export function syncStoreWithRouter(router: Router): boolean {
  let synced: boolean = false
  const lexicalStorage = lexicalStore()

  const updateRouterQuery = () => {
    //console.log('updateRouterQuery.')
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
      tab: lexicalStorage.activeResultTab,
      searchtab: lexicalStorage.activeSearchTab,
      sort: lexicalStorage.sortField + '|' + lexicalStorage.sortOrder,
      //pagestart: lexicalStorage.pageStart,
      //pagesize: lexicalStorage.pageSize,
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
      sortField: lexicalStorage.sortField,
      sortOrder: lexicalStorage.sortOrder,
      //pagestart: lexicalStorage.pageStart,
      //pagesize: lexicalStorage.pageSize,
    }),
    updateRouterQuery,
    { deep: true },
  )

  const initializeStoreFromQuery = (): boolean => {
    const query = new URLSearchParams(window.location.search)
    console.log('initializeStoreFromQuery: query=', query, query.get('tab'))
    let gotQuery: boolean = false
    if (query.has('resources')) {
      lexicalStorage.setSelectedDataset(query.get('resources')!.split(','))
      gotQuery = true
    }
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
      //console.log('initializeStoreFromQuery: selectedCompileParams=', selectedCompileParams)
      lexicalStorage.setSelectedCompileFields(selectedCompileParams)
      //lexicalStorage.selectedCompileFields = selectedCompileParams
    }
    if (query.has('columns')) {
      const selectedColumns = query.get('columns')!.split(',')
      //console.log('initializeStoreFromQuery: selectedColumns=', selectedColumns)
      lexicalStorage.setSelectedColumns(selectedColumns)
      //lexicalStorage.selectedColumns = selectedColumns
    }
    if (query.has('tab')) {
      //console.log('initializeStoreFromQuery: tab=', query.get('tab'))
      lexicalStorage.setActiveResultTab(query.get('tab')!)
    }
    if (query.has('sort')) {
      //console.log('initializeStoreFromQuery: tab=', query.get('tab'))
      lexicalStorage.setSort(query.get('sort')!)
    }
    /*
    if (query.has('pagestart')) {
      lexicalStorage.pageStart = Number(query.get('pagestart'))
      console.log('iSFQ: ', lexicalStorage.pageStart)
    }
    if (query.has('pagesize')) {
      lexicalStorage.pageSize = Number(query.get('pagesize'))
    }
    */
    return gotQuery
  }

  synced = initializeStoreFromQuery()
  window.addEventListener('popstate', initializeStoreFromQuery)
  return synced
}
