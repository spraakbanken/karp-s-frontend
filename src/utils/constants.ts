import { i18n } from '@/i18n.ts'

// UI
export const ROW_MAX_HEIGHT: number = 33 // if shortening columns, how high should they be
export const ROW_SHOW_COMPACT_DEFAULT: boolean = true // default for shortening columns or expand them
export const ROWS_PER_PAGE: number = 100 // how many rows to show for each page (default)
export const GRAPH_BARWIDTH: number = 60 // default bar width of overview graph
export const TABREFCOUNT_MAX: number = 10 // how many tabrefs can we create?

// BE statistics data
export const BE_STATISTICS_VALUES_ID: string = 'values' // and for value
export const BE_STATISTICS_COUNT_ID: string = 'count' // what BE sends in statistics data for count value in object
export const BE_STATISTICS_VALUE_ID: string = 'value' // and for value

// sortering
export const SORT_ORDER_ASCENDING: string = 'asc'
export const SORT_ORDER_DESCENDING: string = 'desc'

// tabs - result
export const TAB_SEARCH_SIMPLE: string = 'simple'
export const TAB_SEARCH_EXTENDED: string = 'extended'
export const TAB_SEARCH_ADVANCED: string = 'advanced'
export const TAB_RESULT_TABLE: string = 'table'
export const TAB_RESULT_STATISTICS: string = 'statistics'
export const TAB_RESULT_REF: string = 'ref' // + key

// error messages

export enum BEErrorCode {
  NONE = 0,
  TOO_MANY_COLUMNS = 1,
  NO_ACCESS = 2,
  BAD_JWT = 3,
  BAD_API_KEY = 4,
}

export const BEErrorMessage = (key: BEErrorCode): string => {
  let retval = 'Unknown'
  switch (key) {
    case BEErrorCode.NONE:
      retval = ''
      break
    case BEErrorCode.TOO_MANY_COLUMNS:
      retval = i18n.global.t('error.code.1')
      break
    case BEErrorCode.NO_ACCESS:
      retval = i18n.global.t('error.code.2')
      break
    case BEErrorCode.BAD_JWT:
      retval = i18n.global.t('error.code.3')
      break
    case BEErrorCode.BAD_API_KEY:
      retval = i18n.global.t('error.code.4')
      break
  }
  return retval
}
