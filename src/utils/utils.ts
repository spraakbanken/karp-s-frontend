import type { ByLang } from '@/types/util.types'
import { useI18n } from 'vue-i18n'
import { clone } from 'es-toolkit'
import {
  BE_STATISTICS_VALUES_ID,
  BE_STATISTICS_VALUE_ID,
  BE_STATISTICS_COUNT_ID,
} from '@/utils/constants.ts'

// Return propeer text according to locale
export const th = (x?: ByLang | string): string | undefined => {
  if (typeof x == 'string') {
    return x
  }
  if (typeof x === 'undefined') {
    return ''
  } else {
    const { locale } = useI18n()
    if (locale.value == 'en') {
      return x['eng']
    } else {
      return x['swe']
    }
  }
}

// Format date according to locale
export const getDate = (date: Date) => {
  const { locale } = useI18n()

  return date.toLocaleDateString(locale.value, { dateStyle: 'long' })
}

export const secondsToDate = (seconds: string): string => {
  const date = new Date(parseInt(seconds) * 1000)
  return date.toISOString().substring(0, 10)
}

export const formatNumber = (num: number, precision: number = 2): string => {
  const map = [
    { suffix: 'T', threshold: 1e12 },
    { suffix: 'B', threshold: 1e9 },
    { suffix: 'M', threshold: 1e6 },
    { suffix: 'K', threshold: 1e3 },
    { suffix: '', threshold: 1 },
  ]

  const found = map.find((x) => Math.abs(num) >= x.threshold)
  if (found) {
    const formatted = (num / found.threshold).toFixed(precision) + found.suffix
    return formatted
  }

  return num.toString()
}

export const camelify = (p: string): string => {
  return p.toLowerCase().replace(/(_\w)/g, (m) => m.toUpperCase().substring(1))
}

function getFilenameFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const pathSegments = parsedUrl.pathname.split('/')
    return pathSegments[pathSegments.length - 1] || null // Return last segment or null if not found
  } catch (error) {
    console.error('Invalid URL:', error)
    return null // Handle invalid URLs
  }
}

export const formatCell = (
  x: number | string | string[] | object,
  divider: string = '<br>',
  solo: boolean = false,
  showCount: boolean = true,
): string => {
  let cell: string = ''
  //let count: number = 0

  if (x !== null) {
    if (Array.isArray(x)) {
      if (x.length > 0) {
        x.every((item) => {
          cell = cell + (cell ? divider : '') + item
          return true
        })
      }
    } else if (typeof x === 'object' && x !== null) {
      // value(s)
      if (BE_STATISTICS_VALUES_ID in x) {
        x.values.forEach((v) => {
          if (typeof v === 'object') {
            let vvalue: string = ''
            let vcount: number = -1
            if (BE_STATISTICS_VALUE_ID in v) {
              vvalue = v[BE_STATISTICS_VALUE_ID]
            }
            if (BE_STATISTICS_COUNT_ID in v) {
              vcount = v[BE_STATISTICS_COUNT_ID]
            }
            vvalue = vvalue !== null ? String(vvalue) : '<i>n/a</i>'

            cell = cell + (cell ? ', ' : '') + vvalue + (showCount ? ': ' + String(vcount) : '')
          }
        })
      }
      // base count
      if (showCount) {
        if (BE_STATISTICS_COUNT_ID in x) {
          cell =
            cell +
            '<span class="sum-right"><b>' +
            (!solo ? (cell ? ' ' : '') : '') +
            String(x[BE_STATISTICS_COUNT_ID]) +
            '</b></span>'
        }
      }
    } else if (typeof x === 'string' && x.startsWith('https://')) {
      cell = "<a href='" + x + "' target=_blank >" + getFilenameFromUrl(x) + '</a>'
    } else {
      cell = String(x)
    }
  } else {
    cell = '-'
  }
  // console.log('formatCell result: ', cell)
  return cell
}

export const isImage = (x: unknown): boolean => {
  let retval = false
  if (x != null) {
    if (typeof x === 'string') {
      if (x.slice(-4) === '.png') {
        retval = true
      }
    }
  }
  return retval
}

/*
export const formatCell = (x: string | string[], divider: string = '<br>'): string => {
  let value = ''
  if (typeof x === 'object' && x !== null) {
    if ('values' in x) {
      Object.entries(x.values).forEach(([k, v]) => {
        if (typeof v === 'object') {
          Object.entries(v).forEach(([k2, v2]) => {
            if (k2 === BE_STATISTICS_COUNT_ID) {
              value = value + (value ? '/' : '') + v2
            } else {
              value = value + (value ? ', ' : '') + v2
            }
          })
        } else {
          value = value + (value ? divider : '') + v
        }
        return true
      })
    } else {
      Object.entries(x).forEach(([k2, v2]) => {
        if (k2 === BE_STATISTICS_COUNT_ID) {
          value = value + (value ? '/' : '') + v2
        } else {
          value = value + (value ? ', ' : '') + v2
        }
      })
    }
  } else if (Array.isArray(x)) {
    x.every((item) => {
      value = value + (value ? divider : '') + item
      return true
    })
  } else if (typeof x === 'string' && x.startsWith('https://')) {
    value = "<a href='" + x + "' target=_blank >" + getFilenameFromUrl(x) + '<a>'
  } else {
    value = x
  }
  return value
}
*/

/** The number of milliseconds in a full day. */
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Add or subtract a number of days to a date
 *
 * Works with 24-hour cycles, so the hour (and possibly date) will change across DST changes.
 **/
export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS)
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Trigger a file download in the browser by adding a temporary link and click it */
export function downloadFile(data: string | Blob, filename: string) {
  // The url is temporary and bound to the window and document, and represents (does not contain) the data.
  // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
  const url = window.URL.createObjectURL(new Blob([data]))

  // Create an invisible link element and "click" it. This makes the browser save the file.
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()

  // Clear the temporary url.
  window.URL.revokeObjectURL(url)
}

/** Leaves an array unchanged but returns [x] for a non-array value x. */
export const enarray = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x])

/** Formats an ISO 8601 date as "YYYY-MM-DD hh:mm:ss" */
export function formatDate(dateStr: string) {
  return dateStr.slice(0, 19).replace('T', ' ')
}

/** Add or change a filename extension */
export function ensureExtension(filename: string, ext: string) {
  return filename.replace(/(.+)\.[^/.]*$/, '$1') + '.' + ext
}

/** Add trailing slash to a URL if it doesn't already have one */
export function ensureTrailingSlash(url: string) {
  return url.replace(/\/*$/, '/')
}

/** Join path segments and normalize.
 *
 * Similar to Node.js path.join but not as complete.
 */
export function pathJoin(...parts: string[]) {
  return parts.map((part) => part.replace(/^\/+/, '').replace(/\/+$/, '')).join('/')
}

/**
 * Calls an async function, and if it is rejected, retries a given number of times.
 *
 * @throws The last rejection if the number of retries is exhausted.
 */
export async function retry<T>(f: () => Promise<T>, retries: number = 3): Promise<T> {
  try {
    return await f()
  } catch (error) {
    if (retries - 1) return retry(f, retries - 1)
    else throw error
  }
}

/** Remove and add properties in `obj` in-place, to match names in `keys`. */
export function setKeys<T>(obj: Record<string, T>, keys: string[], defaultValue: T) {
  // Remove non-matching items.
  for (const key in obj) {
    if (!keys.includes(key)) {
      delete obj[key]
    }
  }

  // Add new items.
  for (const key of keys) {
    obj[key] = obj[key] || clone(defaultValue)
  }

  return obj
}

/** Create a random string of around 11 chars in the [0-9a-z] range. */
export const randomString = () => Math.random().toString(36).slice(2)

/* create a random id for arrays */
export const randomId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000)
}

/** Execute callback, catch and return any exception, otherwise return undefined. */
// TODO Use attempt and isError from es-toolkit instead
export const getException = (f: () => void): unknown | undefined => {
  try {
    f()
  } catch (e) {
    return e
  }
  return undefined
}

/** Returns the last part after the period ("."), or empty string if there is none */
export const getFilenameExtension = (filename: string) => filename.split('.').slice(1).pop() || ''

// check if a file exists
export const fileExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/** If an array, return first element. Otherwise return the whole argument. */
export const unarray = <T>(x: T[] | T): T => (Array.isArray(x) ? x[0] : x)

/** Create dictionary by picking a key and a value from each object in a list. */
export const objsToDict = <
  T extends Record<K, string> & Record<VK, unknown>,
  K extends PropertyKey,
  VK extends PropertyKey,
>(
  objs: T[],
  keyName: K,
  valueName: VK,
) => Object.fromEntries(objs.map((item) => [item[keyName], item[valueName]]))
