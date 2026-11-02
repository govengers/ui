import { describe, expect, test } from 'bun:test'
import { chipText, documentWithout, facetValues, fromQuery, toFilterDocument, toggleValue, toQuery, withQuery, type FacetClause, type FacetDefinition, type Translate } from './facets'

const status: FacetDefinition = { key: 'status', label: 'Status', short: true, values: [{ value: 'active', label: 'active' }, { value: 'onHold', label: 'on hold' }, { value: 'churned', label: 'churned' }] }
const tags: FacetDefinition = { key: 'tags', label: 'Tags', array: true }
const owner: FacetDefinition = { key: 'owner', label: 'Owner', labelOf: id => ({ 'usr-1': 'Ada', 'usr-2': 'Bob' })[id] ?? id }
const facets = [status, tags, owner]

const t: Translate = (key, named) => ({ 'ui.is': 'is', 'ui.isNot': 'is not', 'ui.andMore': `${String(named['n'])} more` })[key] ?? key

describe('toFilterDocument', () => {
  test('nothing ticked is the empty document', () => {
    expect(toFilterDocument([])).toEqual({})
    expect(toFilterDocument([{ key: 'status', values: [] }])).toEqual({})
  })

  test('in and notIn per facet, hasAny and not hasAny on a list field, all under one and', () => {
    const clauses: FacetClause[] = [
      { key: 'status', values: ['active', 'onHold'] },
      { key: 'country', values: ['DE'], negate: true },
      { key: 'tags', values: ['smb'] },
      { key: 'tags', values: ['trial'], negate: true },
    ]
    expect(toFilterDocument(clauses, { facets })).toEqual({ where: { and: [
      { field: 'status', op: 'in', value: ['active', 'onHold'] },
      { field: 'country', op: 'notIn', value: ['DE'] },
      { field: 'tags', op: 'hasAny', value: ['smb'] },
      { not: { field: 'tags', op: 'hasAny', value: ['trial'] } },
    ] } })
  })

  test('the base is ANDed in front, its and flattened; search wins over base.search', () => {
    const base = { where: { and: [{ field: 'country', op: 'eq', value: 'DE' }] }, search: 'old' }
    expect(toFilterDocument([{ key: 'status', values: ['active'] }], { base, search: ' gmbh ' })).toEqual({
      where: { and: [{ field: 'country', op: 'eq', value: 'DE' }, { field: 'status', op: 'in', value: ['active'] }] },
      search: 'gmbh',
    })
    expect(toFilterDocument([], { base: { where: { field: 'x', op: 'eq', value: 1 }, search: 'old' }, search: '  ' }))
      .toEqual({ where: { and: [{ field: 'x', op: 'eq', value: 1 }] }, search: 'old' })
  })

  test('documentWithout drops only that facet', () => {
    const clauses: FacetClause[] = [{ key: 'status', values: ['active'] }, { key: 'owner', values: ['usr-1'] }]
    expect(documentWithout(clauses, 'status')).toEqual({ where: { and: [{ field: 'owner', op: 'in', value: ['usr-1'] }] } })
    expect(documentWithout([{ key: 'status', values: ['active'] }], 'status', { search: 'a' })).toEqual({ search: 'a' })
  })
})

describe('chipText', () => {
  test('up to three values in full, beyond two plus a count', () => {
    expect(chipText(status, { key: 'status', values: ['active'] }, t, 'en')).toBe('Status is active')
    expect(chipText(status, { key: 'status', values: ['active', 'onHold', 'churned'] }, t, 'en')).toBe('Status is active, on hold, or churned')
    expect(chipText(owner, { key: 'owner', values: ['usr-1', 'usr-2', 'usr-3', 'usr-4'], negate: true }, t, 'en')).toBe('Owner is not Ada, Bob, or 2 more')
  })
})

describe('toggleValue', () => {
  test('adds a facet, adds and removes a value, drops an emptied facet, keeps the order', () => {
    let clauses = toggleValue([], 'status', 'active')
    clauses = toggleValue(clauses, 'owner', 'usr-1')
    clauses = toggleValue(clauses, 'status', 'onHold')
    expect(clauses).toEqual([{ key: 'status', values: ['active', 'onHold'] }, { key: 'owner', values: ['usr-1'] }])
    clauses = toggleValue(toggleValue(clauses, 'status', 'active'), 'status', 'onHold')
    expect(clauses).toEqual([{ key: 'owner', values: ['usr-1'] }])
  })

  test('keeps negate', () => {
    expect(toggleValue([{ key: 'tags', values: ['a'], negate: true }], 'tags', 'b')).toEqual([{ key: 'tags', values: ['a', 'b'], negate: true }])
  })
})

describe('facetValues', () => {
  test('an enumeration keeps its order; missing counts are 0; unknown counts stay undefined', () => {
    const values = facetValues(status, [{ value: 'churned', count: 5 }, { value: 'active', count: 9 }], new Set(), ['onHold'])
    expect(values.map(value => [value.value, value.count, value.selected])).toEqual([['active', 9, false], ['onHold', 0, true], ['churned', 5, false]])
    expect(facetValues(status, undefined, new Set(), [])[0]?.count).toBeUndefined()
  })

  test('read values are sorted by label and include seen and ticked ones, nulls dropped', () => {
    const values = facetValues(owner, [{ value: 'usr-2', count: 3 }, { value: null, count: 1 }], new Set(['usr-1']), ['usr-9'])
    expect(values.map(value => [value.label, value.count])).toEqual([['Ada', 0], ['Bob', 3], ['usr-9', 0]])
  })
})

describe('URL query', () => {
  test('round-trips clauses, escapes commas, ignores foreign keys', () => {
    const clauses: FacetClause[] = [{ key: 'status', values: ['active', 'onHold'] }, { key: 'tags', values: ['a,b', '50%'], negate: true }]
    const query = toQuery(clauses)
    expect(query).toEqual({ status: 'active,onHold', 'tags.not': 'a%2Cb,50%25' })
    expect(fromQuery({ ...query, tab: 'all', owner: '' }, facets)).toEqual(clauses)
    expect(fromQuery({ status: ['active', 'x'] }, facets)).toEqual([{ key: 'status', values: ['active'] }])
  })

  test('withQuery replaces the facet keys and keeps the rest', () => {
    expect(withQuery({ tab: 'all', status: 'churned', 'tags.not': 'a' }, [{ key: 'owner', values: ['usr-1'] }], facets)).toEqual({ tab: 'all', owner: 'usr-1' })
  })
})
