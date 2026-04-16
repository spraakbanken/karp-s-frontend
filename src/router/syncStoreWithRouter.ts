import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'
import type { SelectedFieldConfig, SelectedFieldsMain } from '@/types/datasetConfig'
import { TAB_RESULT_STATISTICS, TAB_RESULT_TABLE } from '@/utils/constants'

export enum SyncResult {
  SYNC_RESULT_NOT_SYNCED = 0,
  SYNC_RESULT_SYNCED = 1,
  SYNC_RESULT_DATASET_UNKNOWN = 2,
}

// parsing code written by Copilot 20260415

let mainId = 1
let subId = 1

function parseClause(raw: string, isNot: boolean): SelectedFieldConfig {
  const cleaned = raw.endsWith('|') ? raw.slice(0, -1) : raw
  const [position, name, value] = cleaned.split('|')

  return {
    id: subId++,
    name,
    value,
    position,
    positionInitial: position == 'startswith',
    positionMedial: position == 'contains',
    positionFinal: position == 'endswith',
    isNot,
  }
}

function parseGroup(input: string): SelectedFieldsMain {
  let operator = 'or'
  let isNot = false
  let inner = input

  if (input.startsWith('not(')) {
    operator = 'not'
    isNot = true
    inner = input.slice(4, -1)
  } else if (input.startsWith('or(')) {
    inner = input.slice(3, -1)
  }

  const clauses = inner.split('||')

  return {
    id: mainId++,
    operator,
    selectedFieldsSub: clauses.map((c) => parseClause(c, isNot)),
  }
}

function isSingleClause(q: string): boolean {
  return !/^(and|or|not)\(/.test(q)
}

function splitTopLevel(input: string): string[] {
  const result: string[] = []
  let depth = 0
  let start = 0

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '(') depth++
    if (input[i] === ')') depth--

    if (input.slice(i, i + 2) === '||' && depth === 0) {
      result.push(input.slice(start, i))
      start = i + 2
    }
  }

  result.push(input.slice(start))
  return result
}

export function parseQuery(q: string): SelectedFieldsMain[] {
  // ✅ Case 1: single clause
  if (isSingleClause(q)) {
    return [
      {
        id: mainId++,
        operator: 'or',
        selectedFieldsSub: [parseClause(q, false)],
      },
    ]
  }

  // ✅ Case 2: wrapped expression
  if (q.startsWith('and(')) {
    const inner = q.slice(4, -1)
    const groups = splitTopLevel(inner)
    return groups.map(parseGroup)
  }

  // ✅ Case 3: single or(...) / not(...)
  return [parseGroup(q)]
}

// end of parsing code

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
      lexicalStorage.getSelectedFieldsTotalCount() > 1
    ) {
      queryString = lexicalStorage.getQuery()
    } else if (lexicalStorage.getSelectedFieldsTotalCount() >= 1) {
      // simple search
      queryString = lexicalStorage.getQuery()
    }
    const newQuery = {
      ...currentQuery,
      resources: lexicalStorage.selectedDatasets.join(','),
      q: queryString,
      compile: lexicalStorage.selectedCompileFields.join(','),
      columns: lexicalStorage.selectedColumns.join(','),
      tab: [TAB_RESULT_TABLE, TAB_RESULT_STATISTICS].includes(lexicalStorage.activeResultTab)
        ? lexicalStorage.activeResultTab
        : TAB_RESULT_STATISTICS,
      searchtab: lexicalStorage.activeSearchTab,
      sort: lexicalStorage.tableSortField + '|' + lexicalStorage.tableSortOrder,
      tablePageRowStart: lexicalStorage.tablePageRowStart,
      tablePageSize: lexicalStorage.tablePageSize,
      statisticsPageStart: lexicalStorage.statisticsPageStart,
      statisticsPageSize: lexicalStorage.statisticsPageSize,
    }
    //console.log('Adv, newqs=', newQuery)

    const filteredQuery = Object.fromEntries(
      Object.entries(newQuery).filter(
        ([key, value]) => value !== '' && value !== null && value !== undefined,
      ),
    )
    //console.log('Adv, filtqs=', filteredQuery)

    if (JSON.stringify(currentQuery) !== JSON.stringify(filteredQuery)) {
      //console.log('Adv, push')
      router.push({ query: filteredQuery })
    }
  }

  watch(
    () => ({
      resources: lexicalStorage.selectedDatasets,
      q: [
        lexicalStorage.selectedFieldsMain,
        lexicalStorage.searchExtendedOp,
        lexicalStorage.searchQuery,
      ],
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
      //if (router.currentRoute.value.path !== '/img') {
      updateRouterQuery()
      //}
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
          // console.log('initializeStoreFromQuery:', parseQuery(queryString))
          lexicalStorage.selectedFieldsMain = parseQuery(queryString)
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
