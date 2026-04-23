import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'
import {
  entryWordField,
  type SelectedFieldConfig,
  type SelectedFieldsMain,
} from '@/types/datasetConfig'
import {
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
  DEFAULT_STATISTICS_COLUMNS,
  DEFAULT_STATISTICS_COMPILE,
  DEFAULT_STATISTICS_PAGE_SIZE,
  DEFAULT_STATISTICS_PAGE_START,
  DEFAULT_TAB_RESULT,
  DEFAULT_TAB_SEARCH,
  DEFAULT_TABLE_PAGE_ROW_START,
  DEFAULT_TABLE_PAGE_SIZE,
  POSITION_EQUALS,
  TAB_RESULT_STATISTICS,
  TAB_RESULT_TABLE,
} from '@/utils/constants'

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
    const newQuery: Record<string, string | number> = {
      ...currentQuery,
      resources: lexicalStorage.selectedDatasets.join(','),
    }
    // query string (search field)
    if (
      queryString !== POSITION_EQUALS + '|' + entryWordField &&
      queryString !== POSITION_EQUALS + '|' + entryWordField + '|'
    ) {
      newQuery.q = queryString
    }
    // search tab
    if (lexicalStorage.activeSearchTab !== DEFAULT_TAB_SEARCH) {
      newQuery.searchTab = lexicalStorage.activeSearchTab
    }
    // result tab
    if (lexicalStorage.activeResultTab !== DEFAULT_TAB_RESULT) {
      newQuery.tab = [TAB_RESULT_TABLE, TAB_RESULT_STATISTICS].includes(
        lexicalStorage.activeResultTab,
      )
        ? lexicalStorage.activeResultTab
        : TAB_RESULT_STATISTICS
    }
    // sort
    if (
      lexicalStorage.tableSortField !== DEFAULT_SORT_FIELD ||
      lexicalStorage.tableSortOrder !== DEFAULT_SORT_ORDER
    ) {
      newQuery.sort = lexicalStorage.tableSortField + '|' + lexicalStorage.tableSortOrder
    }
    // compile
    if (lexicalStorage.selectedCompileFields.length !== 0) {
      if (
        !(
          lexicalStorage.selectedCompileFields.length === 1 &&
          lexicalStorage.selectedCompileFields[0] === entryWordField
        )
      ) {
        newQuery.compile = lexicalStorage.selectedCompileFields.join(',')
      }
    }
    // columns
    if (lexicalStorage.selectedColumns.length > 0) {
      newQuery.columns = lexicalStorage.selectedColumns.join(',')
    }
    // page start and sizes
    if (lexicalStorage.tablePageRowStart !== DEFAULT_TABLE_PAGE_ROW_START) {
      newQuery.tablePageRowStart = lexicalStorage.tablePageRowStart
    }
    if (lexicalStorage.tablePageSize !== DEFAULT_TABLE_PAGE_SIZE) {
      newQuery.tablePageSize = lexicalStorage.tablePageSize
    }
    if (lexicalStorage.statisticsPageStart !== DEFAULT_STATISTICS_PAGE_START) {
      newQuery.statisticsPageStart = lexicalStorage.statisticsPageStart
    }
    if (lexicalStorage.statisticsPageSize !== DEFAULT_STATISTICS_PAGE_SIZE) {
      newQuery.statisticsPageSize = lexicalStorage.statisticsPageSize
    }

    //console.log('Adv, newqs=', newQuery)

    const filteredQuery = Object.fromEntries(
      Object.entries(newQuery).filter(
        ([, value]) => value !== '' && value !== null && value !== undefined,
      ),
    )
    //console.log('Adv, filtqs=', filteredQuery)

    if (JSON.stringify(currentQuery) !== JSON.stringify(filteredQuery)) {
      router.push({ query: filteredQuery })
    }
  }

  //console.log('Setup watch!')

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
      //console.log('WATCH FIRED updateRouterQuery')
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
      // search tab
      if (query.has('searchtab')) {
        lexicalStorage.setActiveSearchTab(query.get('searchtab')!)
      } else {
        lexicalStorage.setActiveSearchTab(DEFAULT_TAB_SEARCH)
      }
      // query
      if (query.has('q')) {
        if (lexicalStorage.activeSearchTab == 'advanced') {
          lexicalStorage.setSearchQuery(query.get('q')!)
        } else {
          const queryString = query.get('q')!
          //console.log('initializeStoreFromQuery:', parseQuery(queryString))
          lexicalStorage.selectedFieldsMain = parseQuery(queryString)
        }
      }
      // sort
      if (query.has('sort')) {
        lexicalStorage.setSort(query.get('sort')!)
      } else {
        lexicalStorage.setSort(DEFAULT_SORT_FIELD + '|' + DEFAULT_SORT_ORDER)
      }
      // statistics - compile
      if (query.has('compile')) {
        const selectedCompileParams = query.get('compile')!.split(',')
        lexicalStorage.setSelectedCompileFields(selectedCompileParams)
      } else {
        lexicalStorage.setSelectedCompileFields(DEFAULT_STATISTICS_COMPILE)
      }
      // statistics - columns
      if (query.has('columns')) {
        const selectedColumns = query.get('columns')!.split(',')
        lexicalStorage.setSelectedColumns(selectedColumns)
      } else {
        lexicalStorage.setSelectedColumns(DEFAULT_STATISTICS_COLUMNS)
      }
      // result tab
      if (query.has('tab')) {
        lexicalStorage.setActiveResultTab(query.get('tab')!)
      } else {
        lexicalStorage.setActiveResultTab(DEFAULT_TAB_RESULT)
      }
      // table row start
      if (query.has('tablePageRowStart')) {
        lexicalStorage.tablePageRowStart = Number(query.get('tablePageRowStart'))
      } else {
        lexicalStorage.tablePageRowStart = DEFAULT_TABLE_PAGE_ROW_START
      }
      // table page size
      if (query.has('tablePageSize')) {
        lexicalStorage.tablePageSize = Number(query.get('tablePageSize'))
      } else {
        lexicalStorage.tablePageSize = DEFAULT_TABLE_PAGE_SIZE
      }
      // statistics page start
      if (query.has('statisticsPageStart')) {
        lexicalStorage.statisticsPageStart = Number(query.get('statisticsPageStart'))
      } else {
        lexicalStorage.statisticsPageStart = DEFAULT_STATISTICS_PAGE_START
      }
      // statistics page size
      if (query.has('statisticsPageSize')) {
        lexicalStorage.statisticsPageSize = Number(query.get('statisticsPageSize'))
      } else {
        {
          lexicalStorage.statisticsPageSize = DEFAULT_STATISTICS_PAGE_SIZE
        }
      }

      //if (syncResult === SyncResult.SYNC_RESULT_SYNCED) {
      lexicalStorage.setIsSearch(true, true)
      //}
    }

    return syncResult
  }

  //console.log('sync!')

  const syncResult = initializeStoreFromQuery()
  window.addEventListener('popstate', initializeStoreFromQuery)
  return syncResult
}
