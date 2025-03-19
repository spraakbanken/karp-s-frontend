import type { Datasets, Dataset } from '../types/datasetConfig'

export const processDatasets = (datasets: Datasets) => {
  const processedDatasets: Record<string, { entries: Dataset[]; total: number }> = {}
  for (const key in datasets) {
    const dataset = datasets[key]
    const entries = dataset.hits
    const total = dataset.total
    processedDatasets[key] = { entries: [], total }
    for (const entry of entries) {
      processedDatasets[key].entries.push(entry.entry)
    }
  }
  // console.log('Processed datasets:', processedDatasets);
  return processedDatasets
}

export const processSubDataset = (datasets: Datasets, focusDataset: string) => {
  const processedDatasets: Record<string, { entries: Dataset[]; total: number }> = {}
  for (const key in datasets) {
    const dataset = datasets[key]
    const entries = dataset.hits
    const total = dataset.total
    processedDatasets[key] = { entries: [], total }
    for (const entry of entries) {
      processedDatasets[key].entries.push(entry.entry)
    }
  }
  // console.log('Processed datasets:', processedDatasets);
  return processedDatasets[focusDataset].entries
}
