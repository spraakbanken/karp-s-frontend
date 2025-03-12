export type Dataset = {
  [key: string]: unknown
}

export type Entry = {
  entry: Dataset
}

export type DatasetConfig = {
  hits: Entry[]
}

export type Datasets = {
  [key: string]: DatasetConfig
}
