export const entryWordField = 'entry_word'
export const entryWordFieldCamel = 'entryWord'
export const entryWordProperty = 'entryWord'
export const entryWordDescriptionProperty = 'entryWordDescription'

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

export interface EntryWord {
  field: string
  description: string | Description
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
  [entryWordProperty]: EntryWord
}

// localized version of Resource
export interface ResourceLocalized {
  label: string
  description: string
  fields: string[]
  link: string
  size: string
  tags: string[]
  updated: string
  [entryWordProperty]: string
  entryWordDescription: string
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
  positionInitial: boolean
  positionMedial: boolean
  positionFinal: boolean
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
  resourceUrl: string
}

export type Entry = {
  [key: string]: string
}

export type EntryS = {
  name: string
  value: string
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

export type CountHeadersColumn = {
  type: string
  columnField: string
  headerField: string
  headerValue: string
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

export type TableResultGrpSorted = Record<string, { entry: EntryS[]; resourceId: string }[]>

export type TabRefSetup = {
  resourceId: string[]
  columnField: string
  columnValue: string
  /*  tableResult: DatasetResult */
  tableResultGrpSorted: TableResultGrpSorted
  isLoading: boolean
}
