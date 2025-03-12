import type { Datasets, Dataset } from '../types/datasetConfig'

export const processDatasets = (datasets: Datasets) => {
  const processedDatasets: Record<string, Dataset[]> = {}
  for (const key in datasets) {
    const dataset = datasets[key]
    const entries = dataset.hits
    processedDatasets[key] = []
    for (const entry of entries) {
      processedDatasets[key].push(entry.entry)
    }
  }
  // console.log('Processed datasets:', processedDatasets)
  return processedDatasets
}
