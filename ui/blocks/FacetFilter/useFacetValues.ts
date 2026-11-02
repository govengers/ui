// The live counts behind FacetFilter and FacetPanel (D31): one distinct read per facet under the
// document without that facet's clauses, or one facets read the server strips per facet itself.
import type { DistinctValue, LiveTarget } from '@/api/runtime'
import { useLive } from '@/api/vue'
import { documentWithout, facetValues, toFilterDocument, type DocumentOptions, type FacetClause, type FacetDefinition, type FacetValue, type FilterDocument } from './facets'

/** Any distinct read (livewire D15): the app's parameter type names its own fields, so it stays open here. */
export type DistinctRead = LiveTarget<never, DistinctValue[]>
/** Any read answering `{ [facet key]: DistinctValue[] }`, each counted without that facet's clauses. */
export type FacetsRead = LiveTarget<never, object>

/** The props FacetFilter and FacetPanel share. */
export interface FacetSourceProps {
  facets: FacetDefinition[]
  modelValue: FacetClause[]
  distinct?: DistinctRead | undefined
  facetsRead?: FacetsRead | undefined
  baseFilter?: FilterDocument | undefined
  search?: string | undefined
}

interface DistinctQuery { field: string; filter?: FilterDocument | undefined }
interface FacetsQuery { filter?: FilterDocument | undefined }

const orNone = (document: FilterDocument): FilterDocument | undefined => (Object.keys(document).length > 0 ? document : undefined)

/**
 * The values of a facet with live counts, by key. The reads are chosen once, at setup: facetsRead
 * wins over distinct; a list field (array) gets no distinct read, livewire refuses stringArray.
 * ponytail: every facet subscribes while the block lives; subscribe on open if facets grow many.
 */
export function useFacetValues(props: FacetSourceProps): (key: string) => FacetValue[] {
  const options = (): DocumentOptions => ({ base: props.baseFilter, search: props.search, facets: props.facets })
  const counts = new Map<string, () => readonly DistinctValue[] | undefined>()
  if (props.facetsRead) {
    const read = useLive(props.facetsRead as LiveTarget<FacetsQuery, object>, () => ({ filter: orNone(toFilterDocument(props.modelValue, options())) }))
    for (const facet of props.facets) counts.set(facet.key, () => (read.data.value as Record<string, DistinctValue[] | undefined> | undefined)?.[facet.key])
  } else if (props.distinct) {
    for (const facet of props.facets.filter(item => !item.array)) {
      const read = useLive(props.distinct as LiveTarget<DistinctQuery, DistinctValue[]>, () => ({ field: facet.key, filter: orNone(documentWithout(props.modelValue, facet.key, options())) }))
      counts.set(facet.key, () => read.data.value)
    }
  }
  // Every value ever seen stays listed (at 0), so the order never moves while counts change.
  const seen = new Map(props.facets.map(facet => [facet.key, new Set<string>()]))
  return (key) => {
    const facet = props.facets.find(item => item.key === key)
    if (!facet) return []
    const current = counts.get(key)?.()
    const known = seen.get(key) ?? new Set<string>()
    for (const entry of current ?? []) if (entry.value != null) known.add(String(entry.value))
    return facetValues(facet, current, known, props.modelValue.find(clause => clause.key === key)?.values ?? [])
  }
}
