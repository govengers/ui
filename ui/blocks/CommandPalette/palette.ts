// The model of CommandPalette: search groups over livewire list reads, quick actions from the
// agent action registry, recent picks in localStorage, and the active option under the arrows.
import type { ListQuery, ListResponse, LiveConnection, ReadTarget } from '@/api/runtime'
import type { BoundAction } from '../../agent/registry'

/** One row the palette offers. */
export interface PaletteResult {
  id: string
  label: string
  hint?: string | undefined
}

/** A recent pick: the result and the group it came from. */
export interface RecentPick extends PaletteResult {
  group: string
}

/** A group of search results; build it with `searchGroup`. */
export interface PaletteGroup {
  key: string
  label: string
  search: (connection: LiveConnection, text: string, signal: AbortSignal) => Promise<PaletteResult[]>
}

/**
 * A search group over a list read whose resource has a searchable field: each search is one
 * query over the socket with `{ filter: { where, search }, limit }`.
 */
export function searchGroup<Query extends ListQuery, Item>(options: {
  key: string
  label: string
  target: ReadTarget<Query, ListResponse<Item>>
  result: (item: Item) => PaletteResult
  /** A where clause kept beside the search, e.g. only open tasks. */
  where?: unknown
  /** Results per group (default 5). */
  limit?: number | undefined
}): PaletteGroup {
  return {
    key: options.key,
    label: options.label,
    search: async (connection, text, signal) => {
      const filter = options.where === undefined ? { search: text } : { where: options.where, search: text }
      const page = await connection.query(options.target, { filter, limit: options.limit ?? 5 } as Query, { signal })
      return page.items.map(options.result)
    },
  }
}

/** "createCustomer" to "Create customer". */
export function humanize(name: string): string {
  const words = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_.-]+/g, ' ').trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** The actions a palette can run without asking anything: no params. Every word of the text must match. */
export function matchActions(actions: readonly BoundAction[], text: string): BoundAction[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  return actions
    .filter((action) => action.params === undefined || Object.keys(action.params).length === 0)
    .filter((action) => {
      const haystack = `${humanize(action.name)} ${action.name} ${action.description}`.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
}

/** The recent picks with `pick` first, without duplicates, at most `max`. */
export function addRecent(recent: readonly RecentPick[], pick: RecentPick, max = 6): RecentPick[] {
  return [pick, ...recent.filter((entry) => entry.group !== pick.group || entry.id !== pick.id)].slice(0, max)
}

/** localStorage, or none where there is none or the browser blocks it (its getter throws). */
export function defaultStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/**
 * The storage key of one identity's recent picks: a pick never shows to the next account on the
 * browser. None without a prefix or an identity: an anonymous pair would share them with everyone.
 */
export function recentKey(prefix: string, identity: string): string {
  return prefix === '' || identity === '' ? '' : `${prefix}:${identity}`
}

/** Removes one identity's recent picks; a refusing storage keeps them. */
export function removeRecent(storage: Pick<Storage, 'removeItem'> | undefined, key: string): void {
  try {
    storage?.removeItem(key)
  } catch {
    // ponytail: a storage that refuses the removal keeps the picks
  }
}

/** Stores the recent picks; a full or refusing storage keeps them for this page only. */
export function writeRecent(storage: Pick<Storage, 'setItem'> | undefined, key: string, recent: readonly RecentPick[]): void {
  try {
    storage?.setItem(key, JSON.stringify(recent))
  } catch {
    // ponytail: the picks live until reload when storage refuses them
  }
}

/** The stored recent picks; anything unreadable counts as none. */
export function readRecent(storage: Pick<Storage, 'getItem'> | undefined, key: string): RecentPick[] {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(key) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is RecentPick =>
      typeof entry === 'object' && entry !== null && typeof entry.group === 'string' && typeof entry.id === 'string' && typeof entry.label === 'string')
  } catch {
    return []
  }
}

/** The active option after a key; -1 is none. Arrows wrap, Home and End jump; undefined for other keys. */
export function moveActive(active: number, count: number, key: string): number | undefined {
  if (count === 0) return key === 'ArrowDown' || key === 'ArrowUp' ? -1 : undefined
  switch (key) {
    case 'ArrowDown': return active < 0 ? 0 : (active + 1) % count
    case 'ArrowUp': return active <= 0 ? count - 1 : active - 1
    case 'Home': return 0
    case 'End': return count - 1
    default: return undefined
  }
}
