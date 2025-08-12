import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'
import type { SelectedFieldConfig } from '@/types/datasetConfig'

export function syncStoreWithRouter(router: Router) {
  const lexicalStorage = lexicalStore()

  const updateRouterQuery = () => {
    const currentQuery = router.currentRoute.value.query
    const newQuery = {
      ...currentQuery,
      resources: lexicalStorage.selectedDatasets.join(','),
      q: Object.entries(lexicalStorage.selectedFields)
        .map(([key, value]) => `${value.position}|${key}|${value.value}`)
        .join(','),
      compile: lexicalStorage.selectedCompileFields.join(','),
      columns: lexicalStorage.selectedColumns.join(','),
      tab: lexicalStorage.activeResultTab,
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
    }),
    updateRouterQuery,
    { deep: true },
  )

  const initializeStoreFromQuery = () => {
    const query = new URLSearchParams(window.location.search)
    //console.log('initializeStoreFromQuery: query=', query, query.get('tab'))

    if (query.has('resources')) {
      lexicalStorage.setSelectedDataset(query.get('resources')!.split(','))
    }
    if (query.has('q')) {
      const activeFields = query.get('q')!.split(',')
      console.log('initializeStoreFromQuery: activeParams=', activeFields)
      const selectedFields: Record<string, SelectedFieldConfig> = {}
      for (const field of activeFields) {
        const [position, key, value] = field.split('|')
        selectedFields[key] = { value: value, position: position }
      }
      lexicalStorage.setSelectedFields(selectedFields)
    }
    if (query.has('compile')) {
      const selectedCompileParams = query.get('compile')!.split(',')
      console.log('initializeStoreFromQuery: selectedCompileParams=', selectedCompileParams)
      lexicalStorage.setSelectedCompileFields(selectedCompileParams)
      //lexicalStorage.selectedCompileFields = selectedCompileParams
    }
    if (query.has('columns')) {
      const selectedColumns = query.get('columns')!.split(',')
      console.log('initializeStoreFromQuery: selectedColumns=', selectedColumns)
      lexicalStorage.setSelectedColumns(selectedColumns)
      //lexicalStorage.selectedColumns = selectedColumns
    }
    if (query.has('tab')) {
      console.log('initializeStoreFromQuery: tab=', query.get('tab'))
      lexicalStorage.setActiveResultTab(query.get('tab')!)
    }
  }

  initializeStoreFromQuery()
  window.addEventListener('popstate', initializeStoreFromQuery)
}
