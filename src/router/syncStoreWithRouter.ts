import { watch } from 'vue'
import type { Router } from 'vue-router'
import { lexicalStore } from '@/stores/store'

export function syncStoreWithRouter(router: Router) {
  const lexicalStorage = lexicalStore()
  // const defaultStore = {
  //   resources: '',
  //   q: '',
  //   compile: '',
  // };

  const updateRouterQuery = () => {
    const currentQuery = router.currentRoute.value.query
    const newQuery = {
      ...currentQuery,
      resources: lexicalStorage.selectedDatasets.join(','),
      q: Object.entries(lexicalStorage.activeParameters)
        .map(([key, value]) => `${value.position}|${key}|${value.value}`)
        .join(','),
      compile: lexicalStorage.selectedColumns.join(','),
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
      q: lexicalStorage.activeParameters,
      compile: lexicalStorage.selectedColumns,
    }),
    updateRouterQuery,
    { deep: true },
  )

  const initializeStoreFromQuery = () => {
    const query = new URLSearchParams(window.location.search)
    if (query.has('resources')) {
      lexicalStorage.selectedDatasets = query.get('resources')!.split(',')
    }
    if (query.has('q')) {
      const activeParams = query.get('q')!.split(',')
      for (const param of activeParams) {
        const [position, key, value] = param.split('|')
        lexicalStorage.activeParameters[key] = { value, position }
      }
    }
    if (query.has('compile')) {
      lexicalStorage.selectedColumns = query.get('compile')!.split(',')
    }
  }
  initializeStoreFromQuery()
  window.addEventListener('popstate', initializeStoreFromQuery)
}
