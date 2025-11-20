import { i18n } from '@/i18n.ts'

// UI
export const ROW_MAX_HEIGHT: number = 32 // if shortening columns, how high should they be
export const ROW_SHOW_COMPACT_DEFAULT: boolean = true // default for shortening columns or expand them
export const ROWS_PER_PAGE: number = 100 // how many rows to show for each page (default)
export const GRAPH_BARWIDTH: number = 60 // default bar width of overview graph

// BE statistics data
export const BE_STATISTICS_VALUES_ID: string = 'values' // and for value
export const BE_STATISTICS_COUNT_ID: string = 'count' // what BE sends in statistics data for count value in object
export const BE_STATISTICS_VALUE_ID: string = 'value' // and for value

// error messages

export enum BEErrorCode {
  NONE = 0,
  TOO_MANY_COLUMNS = 1,
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
  }
  return retval
}
