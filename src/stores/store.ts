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
  type SelectedFieldsMain,
} from '@/types/datasetConfig.ts'
import {
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
  DEFAULT_STATISTICS_COLUMNS,
  DEFAULT_STATISTICS_COMPILE,
  DEFAULT_STATISTICS_PAGE_SIZE,
  DEFAULT_STATISTICS_PAGE_START,
  DEFAULT_TAB_RESULT,
  DEFAULT_TAB_SEARCH,
  DEFAULT_TABLE_PAGE_ROW_START,
  DEFAULT_TABLE_PAGE_SIZE,
  POSITION_EQUALS,
  ROWS_PER_PAGE,
  SORT_ORDER_ASCENDING,
  TAB_RESULT_TABLE,
  TAB_SEARCH_EXTENDED,
  TAB_SEARCH_SIMPLE,
  TABREFCOUNT_MAX,
} from '@/utils/constants'
import { randomId } from '@/utils/utils'
import { escapeInnerQuotes } from '@/api/apiService'

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
  selectedFieldsMain: SelectedFieldsMain[] // fields we are searching in
  //selectedFieldsCount: number
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
    selectedFieldsMain: [{ id: randomId(), selectedFieldsSub: [], operator: 'and' }],
    //selectedFieldsCount: 0,
    selectedCompileFields: DEFAULT_STATISTICS_COMPILE,
    selectedColumns: DEFAULT_STATISTICS_COLUMNS,
    searchQuery: '',
    searchExtendedOp: true,
    tableResult: { hits: [], resourceHits: {}, resourceOrder: {}, total: 0 },
    statisticsHeaders: [],
    statisticsResult: [],
    statisticsTotals: [],
    tabRefSetup: {},
    tabRefSetupCounter: 2,
    activeSearchTab: DEFAULT_TAB_SEARCH,
    activeResultTab: DEFAULT_TAB_RESULT,
    activeLocale: 'sv',
    tableSortField: DEFAULT_SORT_FIELD,
    tableSortOrder: DEFAULT_SORT_ORDER,
    statisticsSortField: '',
    statisticsSortOrder: SORT_ORDER_ASCENDING,
    datasetLabels: {},
    datasetDates: [],
    abortController: null,
    tablePageRowStart: DEFAULT_TABLE_PAGE_ROW_START,
    tablePageSize: DEFAULT_TABLE_PAGE_SIZE,
    statisticsPageStart: DEFAULT_STATISTICS_PAGE_START,
    statisticsPageSize: DEFAULT_STATISTICS_PAGE_SIZE,
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
        limitedAccess: c.limitedAccess,
        protectedMetadata: c.protectedMetadata,
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
      const unwantedDatasets: string[] = ['fulaord', 'flex', 'kubord2-stats', 'kubord2-lex']
      for (const c of this.currentConfig.resources) {
        // do not include unwanted
        if (!unwantedDatasets.includes(c.resourceId)) {
          // do not include restricted
          if (c.hasOwnProperty('limitedAccess')) {
            if (!c.limitedAccess) {
              startDatasets.push(c.resourceId)
            } else if (this.grantedDatasets.includes(c.resourceId)) {
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
    /*
    setSelectedFieldMain(sfc: SelectedFieldConfig) {
      this.clearSelectedFieldMain()
      this.addSelectedFieldMain(sfc)
    },
*/
    resetSelectedFieldsMain(sfc: SelectedFieldConfig) {
      // minimum one field
      this.selectedFieldsMain = [
        {
          id: randomId(),
          selectedFieldsSub: [sfc],
          operator: 'AND',
        },
      ]
    },
    getSelectedFieldsMainCount() {
      return this.selectedFieldsMain.length
    },
    getSelectedFieldsTotalCount(): number {
      let total = 0
      for (const mainItem of this.selectedFieldsMain) {
        total += mainItem.selectedFieldsSub.length
      }
      return total
    },
    getSelectedFieldsSubCount(mainId: number) {
      const mainIndex = this.selectedFieldsMain.findIndex((f) => f.id === mainId)
      if (mainIndex >= 0) {
        return this.selectedFieldsMain[mainIndex].selectedFieldsSub.length
      } else {
        return 0
      }
    },
    addSelectedFieldsMain() {
      const sfc: SelectedFieldConfig = {
        id: randomId(),
        name: entryWordField,
        value: '',
        position: POSITION_EQUALS,
        positionInitial: false,
        positionMedial: false,
        positionFinal: false,
        isNot: false,
      }

      this.selectedFieldsMain.push({
        id: randomId(),
        selectedFieldsSub: [sfc],
        operator: 'AND',
      })
    },
    addSelectedFieldsSub(mainId: number) {
      const mainIndex = this.selectedFieldsMain.findIndex((f) => f.id === mainId)
      if (mainIndex >= 0) {
        const sfc: SelectedFieldConfig = {
          id: randomId(),
          name: entryWordField,
          value: '',
          position: POSITION_EQUALS,
          positionInitial: false,
          positionMedial: false,
          positionFinal: false,
          isNot: false,
        }

        this.selectedFieldsMain[mainIndex].selectedFieldsSub.push(sfc)
      }
    },
    delSelectedField(mainId: number, subId: number) {
      const mainIndex = this.selectedFieldsMain.findIndex((f) => f.id === mainId)
      if (mainIndex >= 0) {
        const subIndex = this.selectedFieldsMain[mainIndex].selectedFieldsSub.findIndex(
          (f) => f.id === subId,
        )
        if (subIndex >= 0) {
          this.selectedFieldsMain[mainIndex].selectedFieldsSub.splice(subIndex, 1)
          if (this.selectedFieldsMain[mainIndex].selectedFieldsSub.length === 0) {
            this.selectedFieldsMain.splice(mainIndex, 1)
          }
        }
      }
    },
    getQuery() {
      const lexicalStorage = lexicalStore()
      let mainQuery = ''

      if (
        lexicalStorage.activeSearchTab == TAB_SEARCH_SIMPLE ||
        lexicalStorage.activeSearchTab == TAB_SEARCH_EXTENDED
      ) {
        let mainQueryCount = 0
        for (const mainItem of lexicalStorage.selectedFieldsMain) {
          let subQuery = ''
          let subQueryCount = 0
          for (const subItem of mainItem.selectedFieldsSub) {
            // ignore empty string
            if (subItem.value !== '') {
              if (subItem.isNot) {
                const q =
                  'not(' +
                  subItem.position +
                  '|' +
                  subItem.name +
                  '|' +
                  escapeInnerQuotes(subItem.value) +
                  ')'
                subQuery = subQuery === '' ? q : subQuery + '||' + q
              } else {
                let q = ''
                if (subItem.value) {
                  q = subItem.position + '|' + subItem.name + '|' + escapeInnerQuotes(subItem.value)
                }
                subQuery = subQuery === '' ? q : subQuery + '||' + q
              }
              subQueryCount++
            } else {
              subQuery = ''
            }
          }
          if (subQueryCount > 1) {
            subQuery = 'or(' + subQuery + ')'
          }
          mainQuery = mainQuery === '' ? subQuery : mainQuery + '||' + subQuery
          mainQueryCount++
        }
        if (mainQueryCount > 1) {
          mainQuery = 'and(' + mainQuery + ')'
        }
      } else if (lexicalStorage.activeSearchTab == 'advanced') {
        mainQuery = lexicalStorage.searchQuery
      }
      return mainQuery
    },
    setSearchExtendedOp(x: boolean) {
      this.searchExtendedOp = x
    },
    setSelectedColumns(columns: string[]) {
      this.selectedColumns = columns
    },
    setSelectedCompileFields(fields: string[]) {
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
      if (keys.length > 0) {
        if (!this.currentFields.some((field) => field.name === entryWordField)) {
          //console.log('Adding entry word field to currentFields and currentCommonFields')
          this.currentFields.unshift({
            name: entryWordField,
            type: 'text',
            collection: false,
            label: { swe: 'ingångsord', eng: 'word' },
            categories: [],
            categoryLabel: {},
          })
        }
        if (!this.currentCommonFields.some((field) => field.name === entryWordField)) {
          this.currentCommonFields.unshift({
            name: entryWordField,
            type: 'text',
            collection: false,
            label: { swe: 'ingångsord', eng: 'word' },
            categories: [],
            categoryLabel: {},
          })
        }
      }
      if (this.currentFields.length > 0) {
        // if we have fields in selectedFields (from beforehand)
        // that are now not in currentFields
        // remove them from selectedFields

        // traverse selectedFields, main and sub
        // do it in reverse so we can delete items
        if (this.selectedFieldsMain.length > 0) {
          for (let m = this.selectedFieldsMain.length - 1; m >= 0; m--) {
            if (this.selectedFieldsMain[m].selectedFieldsSub) {
              for (let s = this.selectedFieldsMain[m].selectedFieldsSub.length - 1; s >= 0; s--) {
                if (
                  !this.currentFields.find(
                    (f) => f.name === this.selectedFieldsMain[m].selectedFieldsSub[s].name,
                  )
                ) {
                  this.selectedFieldsMain[m].selectedFieldsSub.splice(s, 1)
                }
              }
            }
          }
          // now delete all empty in main
          for (let m = this.selectedFieldsMain.length - 1; m >= 0; m--) {
            if (this.selectedFieldsMain[m].selectedFieldsSub.length === 0) {
              this.selectedFieldsMain.splice(m, 1)
            }
          }
        }
        // if we don't have any fields left
        if (this.selectedFieldsMain.length === 0) {
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
      this.setSelectedCompileFields(DEFAULT_STATISTICS_COMPILE)
      this.setSelectedColumns(DEFAULT_STATISTICS_COLUMNS)

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
      document.documentElement.lang = locale

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
      const sfc: SelectedFieldConfig = {
        id: randomId(),
        name: entryWordField,
        value: val,
        position: POSITION_EQUALS,
        positionInitial: false,
        positionMedial: false,
        positionFinal: false,
        isNot: false,
      }
      this.resetSelectedFieldsMain(sfc)
      this.setSelectedCompileFields(DEFAULT_STATISTICS_COMPILE)
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
      this.setActiveSearchTab(TAB_SEARCH_SIMPLE)
      this.setActiveResultTab(TAB_RESULT_TABLE)
    },
    localizeField(p: string): string {
      const pCamel = p //this.camelify(p)
      let label = p
      for (const c of this.currentFields) {
        if (c.name === pCamel) {
          if (this.activeLocale == 'sv') {
            label = typeof c.label === 'object' && c.label !== null ? c.label.swe : c.label
          } else {
            label = typeof c.label === 'object' && c.label !== null ? c.label.eng : c.label
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
    getLimitedAccess(resourceId: string): boolean {
      const res = this.currentConfig.resources.find((item) => item.resourceId === resourceId)
      if (res !== undefined) {
        return res.limitedAccess ? true : false
      } else {
        return false
      }
    },
  },
})
