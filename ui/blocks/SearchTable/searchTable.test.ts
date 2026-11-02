import { describe, expect, test } from 'bun:test'
import { composeFilter, cursorWindow, errorKey, needsMore, parseSort, readQuery, sortTerms, writeQuery } from './searchTable'

describe('sort', () => {
  test('terms and back', () => {
    expect(sortTerms(null)).toBeUndefined()
    expect(sortTerms({ key: 'name', direction: 'asc' })).toEqual(['name'])
    expect(sortTerms({ key: 'revenue', direction: 'desc' })).toEqual(['-revenue'])
    expect(parseSort('-revenue')).toEqual({ key: 'revenue', direction: 'desc' })
    expect(parseSort('name')).toEqual({ key: 'name', direction: 'asc' })
    expect(parseSort(['name'])).toBeNull()
    expect(parseSort('-')).toBeNull()
  })
})

describe('composeFilter', () => {
  const where = { field: 'status', op: 'eq', value: 'active' }
  test('no filter and no search is no filter', () => {
    expect(composeFilter(undefined, '')).toBeUndefined()
    expect(composeFilter({}, '  ')).toBeUndefined()
  })
  test('search alone, trimmed', () => {
    expect(composeFilter(undefined, ' acme ')).toEqual({ search: 'acme' })
  })
  test('search beside the page filter, which stays untouched', () => {
    const filter = { where }
    expect(composeFilter(filter, 'acme')).toEqual({ where, search: 'acme' })
    expect(filter).toEqual({ where })
  })
  test('a non-empty search replaces the filter\'s own, an empty one keeps it', () => {
    expect(composeFilter({ where, search: 'old' }, 'new')).toEqual({ where, search: 'new' })
    expect(composeFilter({ where, search: 'old' }, '')).toEqual({ where, search: 'old' })
  })
})

describe('router query', () => {
  test('reads what is there', () => {
    expect(readQuery({ sort: '-revenue', page: '3', search: 'acme', item: 'x' })).toEqual({ sort: { key: 'revenue', direction: 'desc' }, page: 3, search: 'acme' })
    expect(readQuery({ page: 'abc', search: '' })).toEqual({})
    expect(readQuery({ page: '1' })).toEqual({})
  })
  test('writes changes, keeps other keys, leaves defaults out', () => {
    const state = { sort: { key: 'revenue', direction: 'desc' as const }, page: 2, search: ' acme ' }
    expect(writeQuery({ item: 'x' }, state, null)).toEqual({ item: 'x', sort: '-revenue', page: '2', search: 'acme' })
    expect(writeQuery({ sort: 'name', page: '2', item: 'x' }, { sort: { key: 'name', direction: 'asc' }, page: 1, search: '' }, { key: 'name', direction: 'asc' })).toEqual({ item: 'x' })
  })
  test('null when nothing changed', () => {
    expect(writeQuery({ sort: '-revenue', page: '2' }, { sort: { key: 'revenue', direction: 'desc' }, page: 2, search: '' }, null)).toBeNull()
    expect(writeQuery({}, { sort: null, page: 1, search: '' }, null)).toBeNull()
  })
})

describe('cursor window', () => {
  const items = [1, 2, 3, 4, 5]
  test('pages through the loaded rows', () => {
    expect(cursorWindow(items, 0, 2, false)).toEqual({ rows: [1, 2], hasPrevious: false, hasNext: true })
    expect(cursorWindow(items, 2, 2, false)).toEqual({ rows: [5], hasPrevious: true, hasNext: false })
    expect(cursorWindow(items, 2, 2, true).hasNext).toBe(true)
    expect(cursorWindow(items.slice(0, 4), 1, 2, false).hasNext).toBe(false)
  })
  test('needs the next tile when the next window is not fully loaded', () => {
    expect(needsMore(4, 0, 2)).toBe(false)
    expect(needsMore(4, 1, 2)).toBe(true)
    expect(needsMore(5, 1, 2)).toBe(true)
  })
})

describe('errorKey', () => {
  const coded = (code: string) => Object.assign(new Error('refused'), { code })
  test('branches on code, not status', () => {
    expect(errorKey(coded('not_found'))).toBe('ui.notFound')
    expect(errorKey(coded('forbidden'))).toBe('ui.forbidden')
    expect(errorKey(coded('invalid_filter'))).toBeUndefined()
    expect(errorKey(new Error('socket closed'))).toBeUndefined()
  })
})
