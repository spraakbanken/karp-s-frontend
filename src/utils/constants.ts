import { i18n } from '@/i18n.ts'

// misc constants

export const ROW_MAX_HEIGHT: number = 32 // if shortening columns, how high should they be
export const ROW_SHOW_EXPANDED_DEFAULT: boolean = true // default for shortening columns or expand them
export const ROWS_PER_PAGE: number = 100 // how many rows to show for each page (default)
export const GRAPH_BARWIDTH: number = 60 // default bar width of overview graph
export const BE_STATISTICS_COUNT_ID: string = 'count' // what BE sends in statistics data for count value in object

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
