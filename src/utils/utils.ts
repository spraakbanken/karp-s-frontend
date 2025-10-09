import type { ByLang } from '@/util.types'
import { useI18n } from 'vue-i18n'

// Return propeer text according to locale
export const th = (x?: ByLang | string): string | undefined => {
  const { locale } = useI18n()
  if (typeof x == 'string') return x
  //if (useI18n. == 'en') {
  if (locale.value == 'en') {
    return x['eng']
  } else {
    return x['swe']
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

export const formatCell = (x: string | string[], divider: string = '<br>'): string => {
  let value = ''
  if (Array.isArray(x)) {
    x.every((item, index) => {
      value = value + (value ? divider : '') + item
      return true
    })
  } else {
    value = x
  }
  return value
}
