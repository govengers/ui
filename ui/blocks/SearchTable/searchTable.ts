// The state behind SearchTable as plain functions: the table's sort as livewire sort terms, the
// search folded into the filter document, the router query read and written, the cursor window
// and the text of a refused read. SearchTable.vue wires them to useLiveList.
import type { SearchableFilterDocument } from '@/api/runtime'
import type { TableSort } from '../../Table/Table.vue'

/** The table's sort as livewire sort terms: "name" ascending, "-name" descending. */
export function sortTerms(sort: TableSort | null): string[] | undefined {
  if (sort === null) return undefined
  return [sort.direction === 'desc' ? `-${sort.key}` : sort.key]
}

/** A sort term from the URL back into the table's sort; anything else is no sort. */
export function parseSort(term: unknown): TableSort | null {
  if (typeof term !== 'string' || term === '' || term === '-') return null
  return term.startsWith('-') ? { key: term.slice(1), direction: 'desc' } : { key: term, direction: 'asc' }
}

/**
 * The filter the list reads with: the page's filter (FacetFilter, tabs) and the search, which
 * the server ANDs with `where`. A non-empty search replaces a search the page's filter carries;
 * nothing to filter by is no filter at all.
 */
export function composeFilter(filter: unknown, search: string): unknown {
  const term = search.trim()
  const base = typeof filter === 'object' && filter !== null ? (filter as SearchableFilterDocument<unknown>) : {}
  const composed: SearchableFilterDocument<unknown> = term === '' ? base : { ...base, search: term }
  return Object.keys(composed).length === 0 ? undefined : composed
}

export interface QueryState {
  sort: TableSort | null
  page: number
  search: string
}

type RouteQuery = Record<string, unknown>

/** The state a URL carries under `sort`, `page` and `search`; what it lacks stays undefined. */
export function readQuery(query: RouteQuery): Partial<QueryState> {
  const state: Partial<QueryState> = {}
  const sort = parseSort(query['sort'])
  if (sort !== null) state.sort = sort
  const page = Number(query['page'])
  if (Number.isInteger(page) && page > 1) state.page = page
  if (typeof query['search'] === 'string' && query['search'] !== '') state.search = query['search']
  return state
}

/**
 * The query with the state written into `sort`, `page` and `search`, keeping every other key;
 * defaults (the default sort, page 1, no search) leave the key out. Null when nothing changed,
 * so the caller replaces the route only on a change.
 */
export function writeQuery(query: RouteQuery, state: QueryState, defaultSort: TableSort | null): RouteQuery | null {
  const term = sortTerms(state.sort)?.[0]
  const wanted: Record<string, string | undefined> = {
    sort: term === sortTerms(defaultSort)?.[0] ? undefined : term,
    page: state.page > 1 ? String(state.page) : undefined,
    search: state.search.trim() === '' ? undefined : state.search.trim(),
  }
  if (Object.entries(wanted).every(([key, value]) => query[key] === value)) return null
  const next: RouteQuery = { ...query }
  for (const [key, value] of Object.entries(wanted)) {
    if (value === undefined) delete next[key]
    else next[key] = value
  }
  return next
}

export interface CursorWindow<Item> {
  rows: Item[]
  hasPrevious: boolean
  hasNext: boolean
}

/**
 * One page of the tiles a cursor list loaded so far: `index` counts pages of `size` rows. Next
 * exists while more rows are loaded or the server has more (useLiveList's hasMore).
 */
export function cursorWindow<Item>(items: Item[], index: number, size: number, hasMore: boolean): CursorWindow<Item> {
  const start = index * size
  return {
    rows: items.slice(start, start + size),
    hasPrevious: index > 0,
    hasNext: start + size < items.length || hasMore,
  }
}

/** Whether stepping past window `index` needs the next tile: the next window is not fully loaded. */
export function needsMore(loaded: number, index: number, size: number): boolean {
  return loaded < (index + 2) * size
}

/** The ui.* key for a refusal with its own sentence; other errors show their message. Live errors carry no HTTP status: branch on code. */
export function errorKey(error: Error): 'ui.notFound' | 'ui.forbidden' | undefined {
  const code = 'code' in error ? error.code : undefined
  if (code === 'not_found') return 'ui.notFound'
  if (code === 'forbidden') return 'ui.forbidden'
  return undefined
}
