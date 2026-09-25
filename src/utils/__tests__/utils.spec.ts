import { describe, expect, it } from 'vitest'

import type { CountHeadersColumn } from '@/types/datasetConfig'
import { buildEqualsQuery, compileRowSearch } from '@/utils/utils'

const compileHeaders: CountHeadersColumn[] = [
  { type: 'compile', columnField: 'part_of_speech', headerField: '', headerValue: '' },
  { type: 'compile', columnField: 'language', headerField: '', headerValue: '' },
]

describe('compileRowSearch', () => {
  it('combines all compile column values with AND', () => {
    expect(compileRowSearch(['noun', 'Hebrew', 12], compileHeaders, 2)).toEqual({
      label: 'noun ∧ Hebrew',
      query: 'and(equals|part_of_speech|"noun"||equals|language|"Hebrew")',
    })
  })

  it('escapes quotes in compile values', () => {
    expect(compileRowSearch(['a"b'], compileHeaders, 1)?.query).toBe(
      'equals|part_of_speech|"a\\"b"',
    )
  })
})

describe('buildEqualsQuery', () => {
  it('builds a query and escapes quotes in the value', () => {
    expect(buildEqualsQuery('word', 'a"b')).toBe('equals|word|"a\\"b"')
  })
})
