export type Dataset = {
  [key: string]: string
}

export type Entry = {
  entry: Dataset
}

export type DatasetConfig = {
  hits: Entry[]
  total: number
}

export type Datasets = {
  [key: string]: DatasetConfig
}
