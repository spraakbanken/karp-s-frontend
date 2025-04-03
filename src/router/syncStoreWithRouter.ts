import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'
import type { paramConfig } from '@/types/parameterPosition'

export function syncStoreWithRouter(router: Router) {
  const lexicalStorage = lexicalStore()

  const updateRouterQuery = () => {
    const currentQuery = router.currentRoute.value.query
    const newQuery = {
      ...currentQuery,
      resources: lexicalStorage.selectedDatasets.join(','),
      q: Object.entries(lexicalStorage.selectedParameters)
        .map(([key, value]) => `${value.position}|${key}|${value.value}`)
        .join(','),
      compile: lexicalStorage.selectedCompileParams.join(','),
      columns: lexicalStorage.selectedColumns.join(','),
      tab: lexicalStorage.activeTab,
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
      q: lexicalStorage.selectedParameters,
      compile: lexicalStorage.selectedCompileParams,
      columns: lexicalStorage.selectedColumns,
      tab: lexicalStorage.activeTab,
    }),
    updateRouterQuery,
    { deep: true },
  )

  const initializeStoreFromQuery = () => {
    const query = new URLSearchParams(window.location.search)
    if (query.has('resources')) {
      lexicalStorage.setSelectedDataset(query.get('resources')!.split(','))
    }
    if (query.has('q')) {
      const activeParams = query.get('q')!.split(',')
      //const keys = []
      const parameters: Record<string, paramConfig> = {}
      for (const param of activeParams) {
        const [position, key, value] = param.split('|')
        //lexicalStorage.selectedParameters[key] = { value, position }
        //keys.push(key)
        //const rec: Record<string, paramConfig> = {}
        parameters[key] = { value: value, position: position }
        //activeP.push(rec)
      }
      //lexicalStorage.setParameters(activeP)
      lexicalStorage.setParameters(parameters)
    }
    if (query.has('compile')) {
      const selectedCompileParams = query.get('compile')!.split(',')
      console.log('initializeStoreFromQuery: selectedCompileParams=', selectedCompileParams)
      lexicalStorage.setSelectedCompileParams(selectedCompileParams)
      lexicalStorage.selectedCompileParams = selectedCompileParams
    }
    if (query.has('columns')) {
      const selectedColumns = query.get('columns')!.split(',')
      console.log('initializeStoreFromQuery: selectedColumns=', selectedColumns)
      lexicalStorage.setSelectedColumns(selectedColumns)
      lexicalStorage.selectedColumns = selectedColumns
    }
    if (query.has('tab')) {
      lexicalStorage.setActiveTab(query.get('tab')!)
    }
  }

  initializeStoreFromQuery()
  window.addEventListener('popstate', initializeStoreFromQuery)
}
