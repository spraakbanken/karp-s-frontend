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
  categoryLabels: Record<string, { swe: string; eng: string }>
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

// statistics - data

export type StatisticsValue = {
  value: string
  count: number
}

export type StatisticsCellObject = {
  count: number
  values?: StatisticsValue[]
}

export type StatisticsCell = string | number | string[] | StatisticsCellObject

export type StatisticsDataset = StatisticsCell[]

export type CountHeadersColumn = {
  type: string
  columnField: string
  headerField: string
  headerValue: string
}

/* help types */

export type TableResultGrpSorted = Record<string, { entry: EntryS[]; resourceId: string }[]>

export type TabRefSetup = {
  resourceId: string[]
  columnField: string
  columnValue: string
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

export const isStatisticsObjectCell = (cell: StatisticsCell): cell is StatisticsCellObject =>
  typeof cell === 'object' && cell !== null && !Array.isArray(cell)
