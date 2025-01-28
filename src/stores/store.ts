import { ref } from 'vue'
import { datasets as demoDatasets, type Dataset, type Datasets } from '../demo_datasets/datasets'

export const selectedDataset = ref<Dataset[]>([])
export const datasets: Datasets = demoDatasets
export const searchQuery = ref<string>('')
export const selectedParams = ref<string[]>([])
export const activeTab = ref('table')
export const datasetKeys = ref<string[]>([])
