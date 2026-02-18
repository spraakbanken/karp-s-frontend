import { defineStore } from 'pinia'

import {
  type SelectedFieldConfig,
  type FieldConfig,
  type Config,
  type CountHeadersColumn,
  type Dataset,
  type DatasetDates,
  type DatasetResult,
  type TabRefSetup,
  entryWordField,
  type ColumnVisField,
} from '@/types/datasetConfig.ts'
import { ROWS_PER_PAGE, SORT_ORDER_ASCENDING, TABREFCOUNT_MAX } from '@/utils/constants'

interface SearchRedux {
  currentConfig: Config // all resources, tags, fields; set at HomeView > OnMounted()
  currentDatasets: string[] //  all datasets (id's)
  currentDatasetsSize: number // total number of entries
  grantedDatasets: string[] // restricted datasets that the user has been granted access to
  selectedDatasets: string[] // selected datasets (id's)
  selectedDatasetsSize: number // number of entries in selected datasets
  currentTags: string[] // all tags
  tagEntriesCount: Record<string, number> // total number of entries for tags
  selectedTags: string[] // currently selected tags
  fieldsInDatasets: Record<string, FieldConfig[]> // all fields in datasets; object with key: resurceId, value: FieldConfig-array
  currentFields: FieldConfig[] // available fields in selected datasets (union)
  currentCommonFields: FieldConfig[] // intersection of fields in selected datasets (intersection)
  selectedFields: SelectedFieldConfig[] // fields we are searching in
  selectedFieldsCount: number
  selectedCompileFields: string[] // statistics, fields we compile on
  selectedColumns: string[] // statistics, field we show totals on
  searchQuery: string
  searchExtendedOp: boolean
  tableResult: DatasetResult
  statisticsHeaders: CountHeadersColumn[]
  statisticsResult: Dataset[]
  statisticsTotals: number[]
  tabRefSetup: Record<number, TabRefSetup>
  tabRefSetupCounter: number
  activeSearchTab: string
  activeResultTab: string
  activeLocale: string
  tableSortField: string
  tableSortOrder: string
  statisticsSortField: string
  statisticsSortOrder: string
  datasetLabels: Record<string, string>
  datasetDates: DatasetDates[]
  abortController: AbortController | null
  tablePageRowStart: number
  tablePageSize: number
  statisticsPageStart: number
  statisticsPageSize: number
  columnVis: Record<string, ColumnVisField[]>
  isTableData: boolean
  isStatisticsData: boolean
  isTableSearch: boolean // trigger a search (call server)
  isStatisticsSearch: boolean // trigger a search (call server)
  isStart: boolean // is app in start mode? (do not show anything except dataselection/datasearch boxes)
  isTableLoading: number
  isStatisticsLoading: number
}

// currentParams = list of available fields in selected datasets
// selectedParams = list of selected fields
export const lexicalStore = defineStore('dataset', {
  state: (): SearchRedux => ({
    currentConfig: { resources: [], tags: {}, fields: {} },
    currentDatasets: [],
    currentDatasetsSize: 0,
    grantedDatasets: [],
    selectedDatasets: [],
    selectedDatasetsSize: 0,
    currentTags: [],
    tagEntriesCount: {},
    selectedTags: [],
    fieldsInDatasets: {},
    currentFields: [],
    currentCommonFields: [],
    selectedFields: [],
    selectedFieldsCount: 0,
    selectedCompileFields: [],
    selectedColumns: [],
    searchQuery: '',
    searchExtendedOp: true,
    tableResult: { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 },
    statisticsHeaders: [],
    statisticsResult: [],
    statisticsTotals: [],
    tabRefSetup: {},
    tabRefSetupCounter: 2,
    activeSearchTab: 'simple',
    activeResultTab: 'table',
    activeLocale: 'sv',
    tableSortField: '',
    tableSortOrder: SORT_ORDER_ASCENDING,
    statisticsSortField: '',
    statisticsSortOrder: SORT_ORDER_ASCENDING,
    datasetLabels: {},
    datasetDates: [],
    abortController: null,
    tablePageRowStart: 0,
    tablePageSize: ROWS_PER_PAGE,
    statisticsPageStart: 1,
    statisticsPageSize: ROWS_PER_PAGE,
    columnVis: {},
    //listLimit: 5,
    isTableData: false,
    isStatisticsData: false,
    isTableSearch: false,
    isStatisticsSearch: false,
    isStart: true,
    isTableLoading: 0,
    isStatisticsLoading: 0,
  }),
  actions: {
    setDefault(config: Config) {
      this.currentConfig = config

      // array of machine id of all datasets
      this.currentDatasets = config.resources.map((c) => c.resourceId)
      if (this.activeLocale == 'sv') {
        this.datasetLabels = config.resources
          .map((c) => ({
            [c.resourceId]: c.label.swe ? c.label.swe : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      } else {
        this.datasetLabels = config.resources
          .map((c) => ({
            [c.resourceId]: c.label.eng ? c.label.eng : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      }

      // all tags
      this.currentTags = [
        ...new Set(config.resources.flatMap((c) => (c.tags == undefined ? [] : c.tags))),
      ]
      //console.log('CurrentTags:', this.currentTags)
      this.datasetDates = config.resources.map((c) => ({
        resourceId: c.resourceId,
        label: this.datasetLabels[c.resourceId],
        updated: c.updated,
        resourceUrl: c.link,
      }))
      this.datasetDates.sort(function (a, b) {
        return parseInt(b.updated) - parseInt(a.updated)
      })

      // we want all fields that are in selected datasets
      // fieldsInDatasets: Record<string, FieldConfig[]>
      // object with key: resurceId, value: FieldConfig-array
      this.fieldsInDatasets = config.resources.reduce(
        (acc, c) => {
          // we want the FieldConfig for f, not f name (string)
          acc[c.resourceId] = c.fields.map((f) => config.fields[f.name])
          return acc
        },
        {} as Record<string, FieldConfig[]>,
      )

      // calculate total number of entries
      for (const ds in this.currentDatasets) {
        this.currentDatasetsSize += Number(this.currentConfig.resources[ds].size)
      }

      // count number of entries in each tagset
      this.currentTags.forEach((tag) => {
        if (!(tag in this.tagEntriesCount)) {
          this.tagEntriesCount[tag] = 0
        }
        for (const c of this.currentConfig.resources) {
          if (c.hasOwnProperty('tags')) {
            if (c.tags.includes(tag)) {
              this.tagEntriesCount[tag] += Number(c.size)
            }
          }
        }
      })

      // prepare column visibility fields
      this.columnVis = {}
      for (const ds of this.currentDatasets) {
        const result: ColumnVisField[] = this.fieldsInDatasets[ds].map((f) => ({
          columnField: f.name,
          vis: true,
        }))
        this.columnVis[ds] = [...result]
        this.columnVis[ds].unshift({ columnField: entryWordField, vis: true })
        const res = this.currentConfig.resources.find((item) => item.resourceId === ds)
        if (res !== undefined) {
          for (const fi of res.fields) {
            const colfi = this.columnVis[ds].find((item) => item.columnField === fi.name)
            if (colfi !== undefined) {
              colfi.vis = fi.primary
            }
          }
        }
      }

      // setup default datasets for first run:
      // select all except "Fula ordboken", "Flex" and restricted datasets/resources
      const startDatasets: string[] = []
      const unwantedDatasets: string[] = ['fulaord', 'flex']
      for (const c of this.currentConfig.resources) {
        // do not include unwanted
        if (!unwantedDatasets.includes(c.resourceId)) {
          // do not include restricted
          if (c.hasOwnProperty('limitedAccess')) {
            if (!c.limitedAccess) {
              startDatasets.push(c.resourceId)
            }
          } else {
            startDatasets.push(c.resourceId)
          }
        }
      }
      this.setSelectedDataset(startDatasets)

      // and select all tags (even if this is not 100% correct)
      this.setSelectedTags(this.currentTags)
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    setSelectedField(sfc: SelectedFieldConfig) {
      this.setSelectedFieldsClear()
      sfc.id = Date.now() + Math.floor(Math.random() * 1000) // unique value
      this.selectedFields[0] = sfc
      this.selectedFieldsCount = 1
    },
    setSelectedFieldsClear() {
      this.selectedFieldsCount = 0
      this.selectedFields = []
    },
    setSelectedFieldsAdd(sfc: SelectedFieldConfig) {
      sfc.id = Date.now() + Math.floor(Math.random() * 1000) // unique value
      this.selectedFields.push(sfc)
      this.selectedFieldsCount++
    },
    /*
    setSelectedFieldN(index: number, sfc: SelectedFieldConfig) {
      this.selectedFields[index] = sfc
    },
    */
    setSelectedFieldsRemove(fid: number) {
      const index = this.selectedFields.findIndex((f) => f.id === fid)
      if (index !== -1) {
        this.selectedFieldsCount--
        this.selectedFields.splice(index, 1)
      }
    },
    setSelectedFieldsCount(n: number) {
      this.selectedFieldsCount = n
    },
    setSearchExtendedOp(x: boolean) {
      this.searchExtendedOp = x
    },
    /*
    setSelectedParams(params: string[]) {
      // Not used
      this.selectedParams = params
    },*/
    setSelectedColumns(columns: string[]) {
      // console.log('selectedColumns', columns)
      this.selectedColumns = columns
    },
    setSelectedCompileFields(fields: string[]) {
      // console.log('selectedCompileParams', params)
      this.selectedCompileFields = fields
    },
    setSelectedTags(t: string[]) {
      // make copy
      this.selectedTags = [...t]
    },
    setActiveSearchTab(tab: string) {
      this.activeSearchTab = tab
    },
    setActiveResultTab(tab: string) {
      this.activeResultTab = tab
    },
    setSelectedDataset(keys: string[]) {
      //console.log('setSelectedDataset, keys:', keys)
      this.selectedDatasets = keys
      this.setUnionAndIntersectionFields(this.selectedDatasets)

      // so now we have all fields that are in all selected datasets, union and intersection
      // and add the "ingångsord"
      this.currentFields.unshift({
        name: entryWordField,
        type: 'text',
        collection: false,
        label: { swe: 'ingångsord', eng: 'word' },
      })
      this.currentCommonFields.unshift({
        name: entryWordField,
        type: 'text',
        collection: false,
        label: { swe: 'ingångsord', eng: 'word' },
      })
      if (this.currentFields.length > 0) {
        // if we have fields in selectedFields (from beforehand)
        // that are now not in currentFields
        // remove them from selectedFields
        const newSelectedFields: SelectedFieldConfig[] = []
        //for (const [k, v] of Object.entries(this.selectedFields)) {
        for (let i = 0; i < this.selectedFieldsCount; i++) {
          let bFound = false
          //console.log('k, v', k, v)
          if (this.currentFields.find((f) => f.name === this.selectedFields[i].name)) {
            bFound = true
          }
          if (bFound) {
            newSelectedFields.push(...this.selectedFields.slice(i, 1))
          }
        }
        this.selectedFields = newSelectedFields
        this.selectedFieldsCount = this.selectedFields.length
        // and set "ingångsord" to default, also for statistics
        // but if selectedFields exists in all selected datasets don't do this
        let isEmpty = true
        for (let i = 0; i < this.selectedFieldsCount; i++) {
          //console.log('k, v', k, v)
          if (this.selectedFields[i].value !== '') {
            isEmpty = false
          }
        }
        if (isEmpty) {
          this.setStartField()
        }

        // calculate size (# of entries) in selected datasets
        this.selectedDatasetsSize = 0
        for (const ds of this.selectedDatasets) {
          const elt = this.currentConfig.resources.find((x) => x.resourceId === ds)
          if (elt) {
            this.selectedDatasetsSize += Number(elt.size)
          }
        }
        //  console.log('Tot size=', selectedDatasetsSize.value, formatNumber(foo, 2))

        this.setIsTableData(false)
        this.setIsStatisticsData(false)
      } else {
        this.selectedDatasetsSize = 0
        return []
      }
      this.tableSortField = entryWordField
      this.tableSortOrder = SORT_ORDER_ASCENDING
      this.statisticsSortField = entryWordField
      this.tableSortOrder = SORT_ORDER_ASCENDING
      this.setSelectedCompileFields([entryWordField])
      this.setSelectedColumns([])

      // sync selectedTags with selectedDatasets
      // ie make sure only tags that have all their datasets selected
      // are selected
      this.selectedTags = []
      for (const t of this.currentTags) {
        //console.log('hasTags: ', t, rid)
        let includeTag = true
        for (const c of this.currentConfig.resources) {
          if (c.hasOwnProperty('tags')) {
            if (c.tags.includes(t)) {
              if (!this.selectedDatasets.includes(c.resourceId)) {
                includeTag = false
              }
            }
          }
        }
        if (includeTag) {
          this.selectedTags.push(t)
        }
      }
    },
    /*
    setSelectedTag(tags: string[]) {
      this.selectedTags = tags
      this.setSelectedDataset(this.selectedDatasets)
    },
    */
    setUnionAndIntersectionFields(keys: string[]) {
      // get union of fields in all selected datasets
      const fieldUnion: FieldConfig[] = []
      for (const k of keys) {
        if (k in this.fieldsInDatasets) {
          for (const fc of this.fieldsInDatasets[k]) {
            // check if it is already in
            let found: boolean = false
            for (let i = 0; i < fieldUnion.length; i++) {
              if (fieldUnion[i].name == fc.name && fieldUnion[i].type == fc.type) {
                found = true
                break
              }
            }
            if (!found) {
              fieldUnion.push(fc)
            }
          }
        }
      }
      this.currentFields = fieldUnion
      // now check that they are in all selected datasets
      const fieldIntersection: FieldConfig[] = []
      for (const fu of fieldUnion) {
        let foundInAll: boolean = true
        for (const k of keys) {
          let foundInDS: boolean = false
          for (const fc of this.fieldsInDatasets[k]) {
            if (fu.name == fc.name && fu.type == fc.type) {
              foundInDS = true
              break
            }
          }
          foundInAll = foundInAll && foundInDS
        }
        if (foundInAll) {
          fieldIntersection.push(fu)
        }
      }
      this.currentCommonFields = fieldIntersection
    },
    setLocale(locale: string) {
      this.activeLocale = locale
      if (this.activeLocale == 'sv') {
        this.datasetLabels = this.currentConfig.resources
          .map((c) => ({
            [c.resourceId]: c.label.swe ? c.label.swe : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      } else {
        this.datasetLabels = this.currentConfig.resources
          .map((c) => ({
            [c.resourceId]: c.label.eng ? c.label.eng : (c.label as unknown as string),
          }))
          .reduce((acc, obj) => {
            return { ...acc, ...obj }
          }, {})
      }
    },
    setCurrentFields(x: FieldConfig[]) {
      this.currentFields = x
    },
    setStartField(val: string = '') {
      // set "ingångsord" to default, also for statistics
      //console.log('setStartField()')
      const fields: SelectedFieldConfig = {
        id: 0,
        name: entryWordField,
        value: val,
        position: 'equals',
        positionInitial: false,
        positionMedial: false,
        positionFinal: false,
      }
      this.setSelectedField(fields)
      this.setSelectedCompileFields([entryWordField])
    },
    setSort(sf: string) {
      if (sf) {
        const sortParams: string[] = sf.split('|')
        if (sortParams.length > 1) {
          this.tableSortField = sortParams[0]
          if (sortParams.length > 2) {
            this.tableSortOrder = sortParams[1]
          }
        }
      }
    },
    setIsTableData(x: boolean) {
      this.isTableData = x
    },
    setIsStatisticsData(x: boolean) {
      this.isStatisticsData = x
    },
    setIsSearch(x: boolean, y: boolean) {
      this.isTableSearch = x
      this.isStatisticsSearch = y
    },
    setIsTableSearch(x: boolean) {
      this.isTableSearch = x
    },
    setIsStatisticsSearch(x: boolean) {
      this.isStatisticsSearch = x
    },
    setIsStart(x: boolean) {
      this.isStart = x
    },
    incIsTableLoading() {
      this.isTableLoading++
    },
    decIsTableLoading() {
      this.isTableLoading--
    },
    resetIsTableLoading() {
      this.isTableLoading = 0
    },
    incIsStatisticsLoading() {
      this.isStatisticsLoading++
    },
    decIsStatisticsLoading() {
      this.isStatisticsLoading--
    },
    resetIsStatisticsLoading() {
      this.isStatisticsLoading = 0
    },
    setEmpty() {
      this.selectedDatasets = []
      this.setActiveSearchTab('simple')
      this.setActiveResultTab('table')
    },
    localizeField(p: string): string {
      const pCamel = p //this.camelify(p)
      let label = p
      for (const c of this.currentFields) {
        if (c.name === pCamel) {
          if (this.activeLocale == 'sv') {
            label = c.label.swe ? c.label.swe : (c.label as unknown as string)
          } else {
            label = c.label.eng ? c.label.eng : (c.label as unknown as string)
          }
          break
        }
      }
      return label
    },
    isList(p: string): boolean {
      let value = false
      this.currentFields.every((item) => {
        if (p === item.name) {
          value = item.collection
          return false
        } else {
          return true
        }
      })

      return value
    },
    areDatasetsInConfig(keys: string[]): boolean {
      return keys.every((k) => this.currentDatasets.includes(k))
      /*
      let allIncluded: boolean = true
      for (const k of keys) {
        if (!this.currentDatasets.includes(k)) {
          //console.log('areDatasetsInConfig:', k, this.currentDatasets)
          allIncluded = false
          break
        }
      }
      return allIncluded
      */
    },
    addTabRef(aResourceId: string[], aColumnField: string, aColumnValue: string) {
      if (this.tabRefSetupCounter < TABREFCOUNT_MAX) {
        this.tabRefSetupCounter++
        this.tabRefSetup[this.tabRefSetupCounter] = {
          resourceId: aResourceId,
          columnField: aColumnField,
          columnValue: aColumnValue,
          tableResultGrpSorted: {},
          isLoading: false,
          tablePageRowStart: 0,
          tablePageSize: ROWS_PER_PAGE,
          tableTotal: 0,
          //tableResult: { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 },
        }
      }
    },
    delTabRef(id: number) {
      delete this.tabRefSetup[id]
    },
  },
})
