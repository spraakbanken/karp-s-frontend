export interface FieldConfig {
  name: string
  type: string
  collection: boolean
  label: Label | string // TODO
}

export interface Label {
  swe: string
  eng: string
}

export interface Resource {
  resourceId: string
  label: Label
  fields: string[] // WAS: FieldConfig[], but it isn't when we get it from the BE
  updated: string
}

export interface TagLabel {
  label: string
  description: Label
}

export interface Tag {
  [key: string]: TagLabel
}

export interface FieldConfigArray {
  [key: string]: FieldConfig
}

export interface Config {
  resources: Resource[]
  tags: Tag
  fields: FieldConfigArray
}

export interface DatasetDates {
  resourceId: string
  label: string
  updated: string
}

// OLD - are they used?

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
