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

export interface Description {
  swe: string
  eng: string
}

export interface Resource {
  resourceId: string
  label: Label
  description: Description
  fields: string[] // WAS: FieldConfig[], but it isn't when we get it from the BE
  link: string
  size: string
  tags: string[]
  updated: string
  word: string
}

export interface ResourceLocalized {
  label: string
  description: string
  fields: string[] // WAS: FieldConfig[], but it isn't when we get it from the BE
  link: string
  size: string
  tags: string[]
  updated: string
  word: string
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

export type SelectedFieldConfig = {
  value: string
  position: string
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

export type Entry = {
  [key: string]: string
}

export type DatasetEntry = {
  entry: Entry
  resourceId: string
}

export type DatasetResult = {
  hits: DatasetEntry[]
  resourceHits: Record<string, number>
  resourceOrder: Record<number, string>
  total: number
}

export type DatasetResultGrp = {
  resourceId: string
  hits: DatasetEntry[]
}
// OLD - are they used?

export type Dataset = {
  [key: string]: string
}

/*
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
*/
