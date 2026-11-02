// The facet filter's model (D31), framework-free: clauses in, a livewire filter document, chip
// text and URL query out. OR inside a facet, AND across facets; "is not" per clause.
import type { DistinctValue } from '@/api/runtime'

export interface FacetOption {
  value: string
  label: string
}

export interface FacetDefinition {
  /** The resource's filterable field. */
  key: string
  label: string
  /** A short enumeration: shown in a FacetPanel, no value search in the cascade. */
  short?: boolean | undefined
  /** A fixed enumeration in its display order; without it the values come from the counts read. */
  values?: FacetOption[] | undefined
  /** The label of a value not in `values` (an id to a name). */
  labelOf?: ((value: string) => string) | undefined
  /** The field holds a list (a stringArray): "is" becomes hasAny. */
  array?: boolean | undefined
}

export interface FacetClause {
  key: string
  values: string[]
  negate?: boolean | undefined
}

/** One condition of a facet: the shape of the generated filters.ts conditions, field loosened to string. */
export type FacetCondition =
  | { field: string; op: 'in' | 'notIn' | 'hasAny'; value: string[] }
  | { not: { field: string; op: 'hasAny'; value: string[] } }

/** A livewire filter document (livewire D12): conditions under where, the search text. */
export interface FilterDocument {
  where?: unknown
  search?: string
}

export interface DocumentOptions {
  /** A tab's or page's fixed clauses, ANDed with the facets, never shown as chips. */
  base?: FilterDocument | undefined
  /** The search text; wins over base.search. */
  search?: string | undefined
  /** The definitions, so a list field (array) gets hasAny. */
  facets?: readonly FacetDefinition[] | undefined
}

/** The translate function of vue-i18n, as far as the chip text needs it. */
export type Translate = (key: string, named: Record<string, unknown>) => string

function condition(clause: FacetClause, array: boolean): FacetCondition {
  if (!array) return { field: clause.key, op: clause.negate ? 'notIn' : 'in', value: clause.values }
  const has = { field: clause.key, op: 'hasAny' as const, value: clause.values }
  return clause.negate ? { not: has } : has
}

function hasAnd(node: unknown): node is { and: unknown[] } {
  return typeof node === 'object' && node !== null && Array.isArray((node as { and?: unknown }).and)
}

/** The clauses as a filter document: base and facet conditions in one top-level `and`. */
export function toFilterDocument(clauses: readonly FacetClause[], options: DocumentOptions = {}): FilterDocument {
  const arrays = new Set(options.facets?.filter(facet => facet.array).map(facet => facet.key))
  const base = options.base?.where
  const nodes = [
    ...(base === undefined ? [] : hasAnd(base) ? base.and : [base]),
    ...clauses.filter(clause => clause.values.length > 0).map(clause => condition(clause, arrays.has(clause.key))),
  ]
  const document: FilterDocument = {}
  if (nodes.length > 0) document.where = { and: nodes }
  const search = options.search?.trim() || options.base?.search
  if (search) document.search = search
  return document
}

/** The document without one facet's clauses: what that facet's counts are read under (D31). */
export function documentWithout(clauses: readonly FacetClause[], key: string, options: DocumentOptions = {}): FilterDocument {
  return toFilterDocument(clauses.filter(clause => clause.key !== key), options)
}

/** The label of one value: the enumeration's, else labelOf, else the value. */
export function valueLabel(facet: FacetDefinition, value: string): string {
  return facet.values?.find(option => option.value === value)?.label ?? facet.labelOf?.(value) ?? value
}

/** "active, on hold, or 2 more": up to three values in full, beyond that two and a count; OR reads as "or". */
export function valuesText(facet: FacetDefinition, clause: FacetClause, t: Translate, locale: string): string {
  const labels = clause.values.map(value => valueLabel(facet, value))
  const shown = labels.length > 3 ? [...labels.slice(0, 2), t('ui.andMore', { n: labels.length - 2 })] : labels
  return new Intl.ListFormat(locale, { type: 'disjunction' }).format(shown)
}

/** "Status is active, on hold, or 2 more", "Tags is not trial": the chip as one sentence. */
export function chipText(facet: FacetDefinition, clause: FacetClause, t: Translate, locale: string): string {
  return `${facet.label} ${t(clause.negate ? 'ui.isNot' : 'ui.is', {})} ${valuesText(facet, clause, t, locale)}`
}

/** Toggles one value of a facet; a facet without values drops out, the facet order is kept. */
export function toggleValue(clauses: readonly FacetClause[], key: string, value: string): FacetClause[] {
  const current = clauses.find(clause => clause.key === key)
  if (!current) return [...clauses, { key, values: [value] }]
  const values = current.values.includes(value) ? current.values.filter(item => item !== value) : [...current.values, value]
  return values.length === 0 ? clauses.filter(clause => clause !== current) : clauses.map(clause => (clause === current ? { ...clause, values } : clause))
}

export interface FacetValue extends FacetOption {
  /** Rows the value would yield under the other facets; undefined while unknown. */
  count: number | undefined
  selected: boolean
}

/**
 * The values of a facet in a fixed order that never moves: the enumeration's order, else every
 * value seen so far (counts read, ticked) by label. A value missing from the counts counts 0.
 */
export function facetValues(facet: FacetDefinition, counts: readonly DistinctValue[] | undefined, seen: ReadonlySet<string>, selected: readonly string[]): FacetValue[] {
  const byValue = new Map(counts?.filter(entry => entry.value != null).map(entry => [String(entry.value), entry.count]))
  const options = facet.values ?? [...new Set([...seen, ...byValue.keys(), ...selected])]
    .map(value => ({ value, label: valueLabel(facet, value) }))
    .sort((left, right) => left.label.localeCompare(right.label))
  return options.map(option => ({
    ...option,
    count: counts === undefined ? undefined : (byValue.get(option.value) ?? 0),
    selected: selected.includes(option.value),
  }))
}

const escape = (value: string): string => value.replaceAll('%', '%25').replaceAll(',', '%2C')
const unescape = (value: string): string => value.replaceAll('%2C', ',').replaceAll('%25', '%')

/** The clauses as URL query: `status=active,onHold`, `status.not=churned`; commas in values escaped. */
export function toQuery(clauses: readonly FacetClause[]): Record<string, string> {
  return Object.fromEntries(clauses.filter(clause => clause.values.length > 0)
    .map(clause => [clause.negate ? `${clause.key}.not` : clause.key, clause.values.map(escape).join(',')]))
}

/** The clauses a URL query names, in facet order; keys that are no facet are ignored. */
export function fromQuery(query: Readonly<Record<string, unknown>>, facets: readonly FacetDefinition[]): FacetClause[] {
  return facets.flatMap((facet) => {
    for (const negate of [false, true]) {
      const raw = query[negate ? `${facet.key}.not` : facet.key]
      const text = Array.isArray(raw) ? raw[0] : raw
      if (typeof text !== 'string' || text === '') continue
      const values = text.split(',').map(unescape)
      return [negate ? { key: facet.key, values, negate } : { key: facet.key, values }]
    }
    return []
  })
}

/** A URL query with the facets' keys replaced by the clauses; other keys stay. */
export function withQuery<Value>(query: Readonly<Record<string, Value>>, clauses: readonly FacetClause[], facets: readonly FacetDefinition[]): Record<string, Value | string> {
  const owned = new Set(facets.flatMap(facet => [facet.key, `${facet.key}.not`]))
  return { ...Object.fromEntries(Object.entries(query).filter(([key]) => !owned.has(key))), ...toQuery(clauses) }
}
