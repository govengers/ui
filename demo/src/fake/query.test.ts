import { describe, expect, test } from 'bun:test'
import { Refusal, listPage, parseFilter, withoutField, type FieldMeta, type Row } from './query'

const fields: FieldMeta[] = [
  { name: 'id', type: 'string', filter: true, sort: true, search: false },
  { name: 'name', type: 'string', filter: true, sort: true, search: true },
  { name: 'status', type: 'enum', enum: ['open', 'done'], filter: true, sort: true, search: false },
  { name: 'tags', type: 'stringArray', filter: true, sort: false, search: false },
  { name: 'size', type: 'int', filter: true, sort: true, search: false },
  { name: 'at', type: 'time', filter: true, sort: true, search: false },
]
const now = Date.parse('2026-11-02T12:00:00Z')
const rows = [
  { id: 'a', name: 'Alpha Mill', status: 'open', tags: ['x', 'y'], size: 3, at: '2026-11-01T12:00:00Z' },
  { id: 'b', name: 'beta works', status: 'done', tags: [], size: 10, at: '2026-10-01T12:00:00Z' },
  { id: 'c', name: 'Gamma', status: 'open', tags: ['y'], size: null, at: '2026-11-02T11:00:00Z' },
]

function matching(document: unknown): string[] {
  return rows.filter(parseFilter(fields, document, now) as (row: Row) => boolean).map((row) => row.id)
}

function refusalOf(run: () => unknown): Refusal {
  try {
    run()
  } catch (error) {
    if (error instanceof Refusal) return error
    throw error
  }
  throw new Error('nothing was refused')
}

describe('query', () => {
  test('conditions follow the SQL semantics of livewire', () => {
    expect(matching({ where: { field: 'name', op: 'contains', value: 'MILL' } })).toEqual(['a'])
    expect(matching({ where: { field: 'name', op: 'startsWith', value: 'be' } })).toEqual(['b'])
    expect(matching({ where: { field: 'size', op: 'ne', value: 3 } })).toEqual(['b', 'c']) // IS DISTINCT FROM: null differs
    expect(matching({ where: { field: 'size', op: 'notIn', value: [3] } })).toEqual(['b']) // NULL NOT IN (...) is not true
    expect(matching({ where: { field: 'size', op: 'isNull', value: true } })).toEqual(['c'])
    expect(matching({ where: { field: 'at', op: 'gte', value: { relative: '-1d' } } })).toEqual(['a', 'c'])
    expect(matching({ where: { field: 'tags', op: 'hasAll', value: ['x', 'y'] } })).toEqual(['a'])
    expect(matching({ where: { field: 'tags', op: 'isEmpty', value: true } })).toEqual(['b'])
    expect(matching({ where: { or: [{ field: 'status', op: 'eq', value: 'done' }, { not: { field: 'tags', op: 'has', value: 'x' } }] } })).toEqual(['b', 'c'])
    expect(matching({ search: 'ALPHA' })).toEqual(['a'])
  })

  test('a bad document names the path of its fault', () => {
    expect(refusalOf(() => parseFilter(fields, { where: { and: [{ field: 'status', op: 'eq', value: 'open' }, { field: 'nope', op: 'eq', value: 1 }] } }, now)).body)
      .toEqual({ code: 'invalid_filter', message: 'the filter is not valid for this resource', fields: { 'where.and[1].field': 'unknown or unfilterable field "nope"' } })
    expect(refusalOf(() => parseFilter(fields, { where: { field: 'status', op: 'eq', value: 'gone' } }, now)).body.fields).toEqual({ 'where.value': '"gone" is not one of [open done]' })
    expect(refusalOf(() => parseFilter(fields, { where: { field: 'size', op: 'in', value: [] } }, now)).body.fields).toEqual({ 'where.value': 'the list must not be empty' })
    expect(refusalOf(() => parseFilter(fields, { sort: 'x' }, now)).body.fields).toEqual({ sort: 'unknown key "sort"' })
  })

  test('withoutField drops a field from the top and from and, nothing else', () => {
    const own = { field: 'status', op: 'in', value: ['open'] }
    const other = { field: 'size', op: 'gt', value: 1 }
    expect(withoutField({ where: own, search: 'a' }, 'status')).toEqual({ search: 'a' })
    expect(withoutField({ where: { and: [own, other] } }, 'status')).toEqual({ where: { and: [other] } })
    expect(withoutField({ where: { or: [own, other] } }, 'status')).toEqual({ where: { or: [own, other] } })
  })

  test('pages clamp the limit, refuse a bad page and page by cursor only where declared', () => {
    const options = { fields, defaultSort: ['name'], cursor: false }
    const page = listPage(rows, { limit: '500' }, undefined, options, now)
    expect(page).toMatchObject({ limit: 100, offset: 0, total: 3 })
    expect(page.items.map((row) => row.id)).toEqual(['a', 'b', 'c']) // English collation: case does not split the order
    expect(page.next).toBeUndefined()
    expect(refusalOf(() => listPage(rows, { offset: '-1' }, undefined, options, now)).body.fields).toEqual({ offset: 'must not be negative' })
    expect(refusalOf(() => listPage(rows, { after: 'abc' }, undefined, options, now)).body.code).toBe('invalid_request')
    expect(refusalOf(() => listPage(rows, { sort: 'tags' }, undefined, options, now)).body.fields).toEqual({ 'sort[0]': 'unknown or unsortable field "tags"' })

    const cursor = { ...options, cursor: true, defaultSort: ['-size'] }
    const first = listPage(rows, { limit: '1' }, undefined, cursor, now)
    const rest = listPage(rows, { limit: '5', after: first.next as string }, undefined, cursor, now)
    expect([...first.items, ...rest.items].map((row) => row.id)).toEqual(['b', 'a', 'c']) // a row without a value sorts last either way
    expect(rest.next).toBeUndefined()
  })
})

import { withoutField } from './query'
import { test as t2, expect as e2 } from 'bun:test'
t2('withoutField strips a negated facet clause under not', () => {
  const document = { where: { and: [{ field: 'status', op: 'in', value: ['active'] }, { not: { field: 'tags', op: 'hasAny', value: ['trial'] } }] } }
  e2(withoutField(document, 'tags')).toEqual({ where: { and: [{ field: 'status', op: 'in', value: ['active'] }] } })
  e2(withoutField({ where: { not: { field: 'tags', op: 'hasAny', value: ['trial'] } } }, 'tags')).toEqual({})
})
