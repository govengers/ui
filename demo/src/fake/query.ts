// The fake engine's list queries, as livewire's query package answers them (D12, D14, D38 of
// livewire): a filter document (and, or, not, conditions per field type, search, relative
// times) turned into a predicate, the sort with `id` as the last tie-breaker, limit and offset
// clamped to the maximum, and opaque cursors for keyset pages. Refusals carry livewire's codes,
// messages and field paths ("where.and[1].op"). engine.ts calls these for every list read.

import type { DistinctValue, ErrorBody, ErrorCode, ListResponse } from '../api/runtime'

export type FieldType = 'string' | 'text' | 'int' | 'float' | 'bool' | 'time' | 'uuid' | 'enum' | 'stringArray'

/** One field of a resource: what a filter, a sort and the search may do with it. */
export interface FieldMeta {
  name: string
  type: FieldType
  enum?: readonly string[]
  filter: boolean
  sort: boolean
  search: boolean
}

/** A row of any table: an id and its other fields by name. */
export type Row = { readonly id: string }

const messages: Partial<Record<ErrorCode, string>> = {
  invalid_request: 'the request is not valid',
  invalid_filter: 'the filter is not valid for this resource',
  invalid_sort: 'the sort is not valid for this resource',
  invalid_page: 'the page is not valid',
  invalid_cursor: 'the cursor is not valid for this sort',
  forbidden: 'forbidden',
  not_found: 'not found',
  conflict: 'the request conflicts with the current state',
  internal: 'internal',
}

/** A request the engine refuses: the status and the one error body of livewire. */
export class Refusal extends Error {
  readonly status: number
  readonly body: ErrorBody

  constructor(code: ErrorCode, fields?: Record<string, string>) {
    const body: ErrorBody = { code, message: messages[code] ?? code }
    if (fields !== undefined) body.fields = fields
    super(body.message)
    this.status = code === 'forbidden' ? 403 : code === 'not_found' ? 404 : code === 'conflict' ? 409 : code === 'internal' ? 500 : 400
    this.body = body
  }
}

const operators: Record<FieldType, readonly string[]> = {
  string: ['eq', 'ne', 'in', 'notIn', 'contains', 'startsWith', 'isNull'],
  text: ['eq', 'ne', 'in', 'notIn', 'contains', 'startsWith', 'isNull'],
  int: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'isNull'],
  float: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'isNull'],
  time: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'isNull'],
  bool: ['eq', 'ne', 'isNull'],
  enum: ['eq', 'ne', 'in', 'notIn', 'isNull'],
  uuid: ['eq', 'ne', 'in', 'notIn', 'isNull'],
  stringArray: ['has', 'hasAny', 'hasAll', 'isEmpty'],
}

type Predicate = (row: Row) => boolean
type Value = string | number | boolean

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function field(row: Row, name: string): unknown {
  return (row as unknown as Record<string, unknown>)[name]
}

function filterError(path: string, message: string): Refusal {
  return new Refusal('invalid_filter', { [path]: message })
}

/**
 * The predicate of a filter document (already JSON-decoded); undefined matches every row.
 * `now` is the instant relative times count from. Throws a Refusal naming the first fault.
 */
export function parseFilter(fields: readonly FieldMeta[], document: unknown, now: number): Predicate {
  if (document === undefined) return () => true
  if (!isObject(document)) throw filterError('', 'must be an object')
  let where: Predicate = () => true
  let search: Predicate = () => true
  for (const [key, value] of Object.entries(document)) {
    if (key === 'where') where = parseNode(fields, value, 'where', 1, now)
    else if (key === 'search') search = parseSearch(fields, value)
    else throw filterError(key, `unknown key "${key}"`)
  }
  return (row) => where(row) && search(row)
}

/** The search term matches any searchable field, case-insensitively. */
function parseSearch(fields: readonly FieldMeta[], value: unknown): Predicate {
  const term = decodeString(value, 'search').toLowerCase()
  const searchable = fields.filter((candidate) => candidate.search).map((candidate) => candidate.name)
  if (searchable.length === 0) throw filterError('search', 'this resource has no searchable field')
  if (term === '') return () => true
  return (row) => searchable.some((name) => String(field(row, name) ?? '').toLowerCase().includes(term))
}

function parseNode(fields: readonly FieldMeta[], node: unknown, path: string, depth: number, now: number): Predicate {
  if (depth > 8) throw filterError(path, 'the filter is nested deeper than 8 levels')
  if (!isObject(node)) throw filterError(path, 'must be an object')
  const keys = Object.keys(node)
  const only = keys.length === 1 ? keys[0] : undefined
  if (only === 'and' || only === 'or') {
    const list = node[only]
    if (!Array.isArray(list)) throw filterError(`${path}.${only}`, 'must be a list of nodes')
    if (list.length === 0) throw filterError(`${path}.${only}`, 'must not be empty')
    const children = list.map((child, index) => parseNode(fields, child, `${path}.${only}[${index}]`, depth + 1, now))
    return only === 'and' ? (row) => children.every((child) => child(row)) : (row) => children.some((child) => child(row))
  }
  if (only === 'not') {
    const child = parseNode(fields, node['not'], `${path}.not`, depth + 1, now)
    return (row) => !child(row)
  }
  if ('field' in node && keys.every((key) => key === 'field' || key === 'op' || key === 'value')) {
    return parseCondition(fields, node, path, now)
  }
  throw filterError(path, 'a node is exactly one of and, or, not or a condition {field, op, value}')
}

/**
 * One condition. A row without a value matches only isNull, isEmpty and ne (IS DISTINCT FROM).
 * ponytail: two-valued logic, so `not` over a condition on a missing value matches where
 * PostgreSQL's NULL would not; no seeded filterable field is ever null.
 */
function parseCondition(fields: readonly FieldMeta[], node: Record<string, unknown>, path: string, now: number): Predicate {
  const name = node['field']
  const meta = fields.find((candidate) => candidate.name === name && candidate.filter)
  if (meta === undefined) throw filterError(`${path}.field`, `unknown or unfilterable field "${String(name)}"`)
  const op = node['op']
  if (typeof op !== 'string' || !operators[meta.type].includes(op)) {
    throw filterError(`${path}.op`, `operator "${String(op)}" is not allowed on ${meta.type} field "${meta.name}"`)
  }
  if (!('value' in node)) throw filterError(`${path}.value`, 'a value is required')
  const raw = node['value']
  const at = `${path}.value`
  const valueOf = (row: Row): Value | null => {
    const value = field(row, meta.name)
    if (value === null || value === undefined) return null
    return meta.type === 'time' ? Date.parse(String(value)) : (value as Value)
  }
  const tagsOf = (row: Row): unknown[] => {
    const value = field(row, meta.name)
    return Array.isArray(value) ? value : []
  }
  switch (op) {
    case 'isNull': {
      const flag = decodeFlag(raw, op, at)
      return (row) => (valueOf(row) === null) === flag
    }
    case 'isEmpty': {
      const flag = decodeFlag(raw, op, at)
      return (row) => (tagsOf(row).length === 0) === flag
    }
    case 'has': {
      const tag = decodeString(raw, at)
      return (row) => tagsOf(row).includes(tag)
    }
    case 'hasAny':
    case 'hasAll': {
      const tags = decodeList(raw, at, (item, itemPath) => decodeString(item, itemPath))
      return op === 'hasAny' ? (row) => tags.some((tag) => tagsOf(row).includes(tag)) : (row) => tags.every((tag) => tagsOf(row).includes(tag))
    }
    case 'contains':
    case 'startsWith': {
      const term = decodeString(raw, at).toLowerCase()
      return (row) => {
        const value = valueOf(row)
        if (value === null) return false
        const text = String(value).toLowerCase()
        return op === 'contains' ? text.includes(term) : text.startsWith(term)
      }
    }
    case 'in':
    case 'notIn': {
      const values = decodeList(raw, at, (item, itemPath) => decodeScalar(meta, item, itemPath, now))
      return (row) => {
        const value = valueOf(row)
        if (value === null) return false // SQL: NULL IN (...) and NULL NOT IN (...) are both not true
        return values.some((candidate) => compareValues(value, candidate) === 0) === (op === 'in')
      }
    }
    default: {
      const target = decodeScalar(meta, raw, at, now)
      return (row) => {
        const value = valueOf(row)
        if (value === null) return op === 'ne'
        const order = compareValues(value, target)
        if (op === 'eq') return order === 0
        if (op === 'ne') return order !== 0
        if (op === 'gt') return order > 0
        if (op === 'gte') return order >= 0
        if (op === 'lt') return order < 0
        return order <= 0
      }
    }
  }
}

function decodeFlag(raw: unknown, op: string, path: string): boolean {
  if (typeof raw !== 'boolean') throw filterError(path, `${op} takes true or false`)
  return raw
}

function decodeString(raw: unknown, path: string): string {
  if (typeof raw !== 'string') throw filterError(path, 'must be a string')
  if (raw.length > 1024) throw filterError(path, 'the string is longer than 1024 bytes')
  return raw
}

function decodeList<Item>(raw: unknown, path: string, decode: (item: unknown, path: string) => Item): Item[] {
  if (!Array.isArray(raw)) throw filterError(path, 'takes a list of values')
  if (raw.length === 0) throw filterError(path, 'the list must not be empty')
  if (raw.length > 500) throw filterError(path, 'the list has more than 500 values')
  return raw.map((item, index) => decode(item, `${path}[${index}]`))
}

const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 }

/** A value of the field's type; a time becomes milliseconds, an RFC 3339 string or { relative: "-7d" } from now. */
function decodeScalar(meta: FieldMeta, raw: unknown, path: string, now: number): Value {
  switch (meta.type) {
    case 'int':
      if (typeof raw !== 'number' || !Number.isInteger(raw)) throw filterError(path, 'must be an integer')
      return raw
    case 'float':
      if (typeof raw !== 'number' || !Number.isFinite(raw)) throw filterError(path, 'must be a number')
      return raw
    case 'bool':
      if (typeof raw !== 'boolean') throw filterError(path, 'must be true or false')
      return raw
    case 'enum': {
      const text = decodeString(raw, path)
      if (!(meta.enum ?? []).includes(text)) throw filterError(path, `"${text}" is not one of [${(meta.enum ?? []).join(' ')}]`)
      return text
    }
    case 'time': {
      if (typeof raw === 'string') {
        const instant = Date.parse(raw)
        if (Number.isNaN(instant)) throw filterError(path, `"${raw}" is not an RFC 3339 time`)
        return instant
      }
      const relative = isObject(raw) ? raw['relative'] : undefined
      const match = typeof relative === 'string' ? /^([+-])((?:\d+[smhdw])+)$/.exec(relative) : null
      if (match === null) throw filterError(path, 'a time is an RFC 3339 string or {"relative": "-7d"}')
      let offset = 0
      for (const [, amount, unit] of (match[2] ?? '').matchAll(/(\d+)([smhdw])/g)) offset += Number(amount) * (units[unit ?? 's'] ?? 0)
      return match[1] === '-' ? now - offset : now + offset
    }
    default:
      return decodeString(raw, path)
  }
}

/** Orders two present values: numbers by value, false before true, text by the English collation. */
function compareValues(left: Value, right: Value): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right)
  return String(left).localeCompare(String(right), 'en')
}

/** JSON with the keys of every object sorted, so equal filter documents compare equal (stored filters dedup by it, D13). */
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_, entry: unknown) =>
    isObject(entry) ? Object.fromEntries(Object.entries(entry).sort(([left], [right]) => (left < right ? -1 : 1))) : entry)
}

/** A filter document without the conditions on one field, for its facet's counts (D31). */
export function withoutField(document: unknown, name: string): unknown {
  if (!isObject(document) || document['where'] === undefined) return document
  const where = strip(document['where'], name)
  const rest = { ...document }
  delete rest['where']
  return where === undefined ? rest : { ...rest, where }
}

/** ponytail: strips conditions at the top and inside `and` only; a facet's selection is one in or notIn clause there (D31). */
function strip(node: unknown, name: string): unknown {
  if (!isObject(node)) return node
  if (node['field'] === name) return undefined
  const children = node['and']
  if (!Array.isArray(children)) return node
  const kept = children.map((child) => strip(child, name)).filter((child) => child !== undefined)
  return kept.length === 0 ? undefined : { and: kept }
}

interface SortTerm {
  field: string
  descending: boolean
}

function parseSort(fields: readonly FieldMeta[], raw: string | undefined, defaultSort: readonly string[]): SortTerm[] {
  const parts = raw === undefined || raw.trim() === '' ? defaultSort : raw.split(',')
  const seen = new Set<string>()
  return parts.map((part, index) => {
    const name = part.trim().replace(/^-/, '')
    if (!fields.some((candidate) => candidate.name === name && candidate.sort)) {
      throw new Refusal('invalid_sort', { [`sort[${index}]`]: `unknown or unsortable field "${name}"` })
    }
    if (seen.has(name)) throw new Refusal('invalid_sort', { [`sort[${index}]`]: `field "${name}" appears twice` })
    seen.add(name)
    return { field: name, descending: part.trim().startsWith('-') }
  })
}

/** Orders rows by the sort, rows without a value last in either direction, then by id. */
function comparator(sort: readonly SortTerm[]): (left: Row, right: Row) => number {
  return (left, right) => {
    for (const term of sort) {
      const a = field(left, term.field) as Value | null | undefined
      const b = field(right, term.field) as Value | null | undefined
      if (a == null || b == null) {
        if (a == null && b == null) continue
        return a == null ? 1 : -1
      }
      const order = compareValues(a, b)
      if (order !== 0) return term.descending ? -order : order
    }
    return compareValues(left.id, right.id)
  }
}

/** The rows a filter document selects, in the order of the sort parameter or the default sort. */
export function select<Item extends Row>(rows: readonly Item[], fields: readonly FieldMeta[], document: unknown, sort: string | undefined, defaultSort: readonly string[], now: number): Item[] {
  const matches = parseFilter(fields, document, now)
  const terms = parseSort(fields, sort, defaultSort)
  return rows.filter(matches).sort(comparator(terms))
}

function parseCount(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined) return fallback
  if (!/^-?\d+$/.test(raw)) throw new Refusal('invalid_page', { [name]: `"${raw}" is not a whole number` })
  const value = Number(raw)
  if (value < 0) throw new Refusal('invalid_page', { [name]: 'must not be negative' })
  return value
}

interface Cursor {
  sort: string
  values: unknown[]
  id: string
}

function encodeCursor(cursor: Cursor): string {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeCursor(encoded: string): Cursor {
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
    const cursor = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))) as Cursor
    if (typeof cursor.sort === 'string' && Array.isArray(cursor.values) && typeof cursor.id === 'string') return cursor
  } catch {
    // falls through to the refusal
  }
  throw new Refusal('invalid_cursor', { after: 'is not a cursor' })
}

export interface ListOptions {
  fields: readonly FieldMeta[]
  defaultSort: readonly string[]
  /** Whether the resource pages by cursor (D38): `after` is accepted and `next` answered. */
  cursor: boolean
}

/** The livewire ListResponse of a list read: limit and offset clamped, the total under the filter, a next cursor in cursor mode. */
export function listPage<Item extends Row>(rows: readonly Item[], parameters: Record<string, string>, document: unknown, options: ListOptions, now: number): ListResponse<Item> {
  const matching = select(rows, options.fields, document, parameters['sort'], options.defaultSort, now)
  const limit = Math.min(parseCount(parameters['limit'], 'limit', 100), 100)
  const offset = parseCount(parameters['offset'], 'offset', 0)
  const terms = parseSort(options.fields, parameters['sort'], options.defaultSort)
  const sort = terms.map((term) => (term.descending ? `-${term.field}` : term.field)).join(',')
  let start = 0
  const after = parameters['after']
  if (after !== undefined && after !== '') {
    if (!options.cursor) throw new Refusal('invalid_request', { after: 'this resource does not page by cursor' })
    const cursor = decodeCursor(after)
    if (cursor.sort !== sort) throw new Refusal('invalid_cursor', { after: 'taken under another sort' })
    const position = { id: cursor.id } as Record<string, unknown>
    terms.forEach((term, index) => {
      position[term.field] = cursor.values[index]
    })
    const compare = comparator(terms)
    start = matching.findIndex((row) => compare(row, position as unknown as Row) > 0)
    if (start < 0) start = matching.length
  }
  const items = matching.slice(start + offset, start + offset + limit)
  const response: ListResponse<Item> = { limit, offset, total: matching.length, items }
  const last = items.at(-1)
  if (options.cursor && last !== undefined && start + offset + limit < matching.length) {
    response.next = encodeCursor({ sort, values: terms.map((term) => field(last, term.field)), id: last.id })
  }
  return response
}

/** How many rows carry each value of a field, most frequent first (the distinct read, D15). */
export function distinctValues(rows: readonly Row[], name: string): DistinctValue[] {
  const counts = new Map<unknown, number>()
  for (const row of rows) counts.set(field(row, name) ?? null, (counts.get(field(row, name) ?? null) ?? 0) + 1)
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || String(left.value).localeCompare(String(right.value), 'en'))
}
