export const entryWordField = 'entry_word'
export const entryWordFieldCamel = 'entryWord'
export const entryWordProperty = 'entryWord'
export const entryWordDescriptionProperty = 'entryWordDescription'

export interface FieldConfig {
  name: string
  type: string
  collection: boolean
  label: Label | string
  categories: string[]
  categoryLabel: Record<string, { swe: string; eng: string }>
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

export interface FieldInfo {
  name: string
  primary: boolean
}

export interface Resource {
  resourceId: string
  label: Label
  description: Description
  fields: FieldInfo[] // was string[] before BE v16
  link: string
  size: string
  tags: string[]
  updated: string
  limitedAccess: boolean
  protectedMetadata: boolean
  [entryWordProperty]: EntryWord
}

// localized version of Resource
export interface ResourceLocalized {
  label: string
  description: string
  fields: FieldInfo[] // was string[] before BE v16
  link: string
  size: string
  tags: string[]
  updated: string
  limitedAccess: boolean
  protectedMetadata: boolean
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

/*
export interface FieldConfigArray {
  [key: string]: FieldConfig
}
*/

export type SelectedFieldConfig = {
  id: number
  name: string
  value: string
  position: string
  positionInitial: boolean
  positionMedial: boolean
  positionFinal: boolean
  isNot: boolean
}

export type SelectedFieldsMain = {
  id: number
  selectedFieldsSub: SelectedFieldConfig[]
  operator: string
}

export interface Config {
  resources: Resource[]
  tags: Tag
  fields: Record<string, FieldConfig>
}

export interface DatasetDates {
  resourceId: string
  label: string
  updated: string
  resourceUrl: string
  limitedAccess: boolean
  protectedMetadata: boolean
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
  tablePageRowStart: number
  tablePageSize: number
  tableTotal: number
}

export type ColumnVisField = {
  columnField: string
  vis: boolean
}
