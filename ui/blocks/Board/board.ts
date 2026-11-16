// The model of Board: grouping one live list into columns, ordering by rank, the lift a pointer
// or keyboard move carries, where a drop lands, and the rank sent to the move mutation. No DOM.

/** The reserved parameters of a filterable list read, as useLiveList drives them. */
export interface ListQuery {
  filter?: unknown
  sort?: readonly string[]
  limit?: number
  offset?: number
  after?: string
}

export interface BoardColumn {
  /** The value of the item's column field, e.g. a status. */
  key: string
  label: string
  /** A work-in-progress limit: the header shows count/limit and warns above it. */
  limit?: number | undefined
}

export interface Spot {
  column: string
  /** The index among the column's cards without the moving one. */
  index: number
}

/** A spot and the column's cards around it: what a lift aims at, so a push keeps it between them. */
export interface Target extends Spot {
  /** The id of the card above, if any. */
  before: string | undefined
  /** The id of the card below, if any. */
  after: string | undefined
}

/** A card in flight and where it would land now. */
export interface Lift {
  id: string
  to: Target
  /** pointer: the card follows the pointer and a placeholder marks the spot; keyboard: the card itself moves. */
  mode: 'pointer' | 'keyboard'
}

/** Where a drop lands: the column, the index, its neighbours and a rank between them. */
export interface Placement extends Target {
  rank: number
}

export interface Keyed {
  id: string
}

/** One rendered entry of a column: a card (hidden while it follows the pointer) or the drop placeholder. */
export type Entry<Item> = { kind: 'card'; item: Item; origin: boolean } | { kind: 'placeholder' }

/** The gap between ranks a move into an empty column or past an end leaves. */
export const rankStep = 1024

/** The items by column key, each column ordered by rank, ties by id. Items of no column are left out. */
export function group<Item extends Keyed>(items: readonly Item[], columns: readonly BoardColumn[], columnOf: (item: Item) => string, rankOf: (item: Item) => number): Map<string, Item[]> {
  const out = new Map<string, Item[]>(columns.map((column) => [column.key, []]))
  for (const item of items) out.get(columnOf(item))?.push(item)
  for (const list of out.values()) list.sort((left, right) => rankOf(left) - rankOf(right) || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
  return out
}

/**
 * A rank between two neighbours. shortcut: plain floats halve the gap on every move between the
 * same two cards, about 50 moves before they collide; the server should renumber a column when
 * neighbours get closer than, say, 1e-6 (equal ranks still order by id).
 */
export function rankBetween(above: number | undefined, below: number | undefined): number {
  if (above === undefined && below === undefined) return rankStep
  if (above === undefined) return (below as number) - rankStep
  if (below === undefined) return above + rankStep
  return (above + below) / 2
}

/** The column's cards without the moving one. */
export function without<Item extends Keyed>(cards: readonly Item[], id: string): Item[] {
  return cards.filter((card) => card.id !== id)
}

/** The target of card `id` at `spot` (index clamped) among the column's other cards. */
export function aim<Item extends Keyed>(cards: readonly Item[], id: string, spot: Spot): Target {
  const others = without(cards, id)
  const index = Math.max(0, Math.min(spot.index, others.length))
  return { column: spot.column, index, before: others[index - 1]?.id, after: others[index]?.id }
}

/**
 * Where a target is in the column's cards now: under the card it was aimed below (none: the top),
 * else above the card it was aimed above, else at its index. A card another user puts into the
 * column moves the index, never the spot between the neighbours the user picked.
 */
export function resolve<Item extends Keyed>(cards: readonly Item[], id: string, target: Target): Target {
  const others = without(cards, id)
  const at = (key: string | undefined): number => (key === undefined ? -1 : others.findIndex((card) => card.id === key))
  const above = at(target.before)
  const below = at(target.after)
  const index = target.before === undefined ? 0 : above >= 0 ? above + 1 : below >= 0 ? below : target.index
  return aim(cards, id, { column: target.column, index })
}

/** Where dropping card `id` at `spot` lands, computed from the target column's cards. */
export function place<Item extends Keyed>(cards: readonly Item[], id: string, spot: Spot, rankOf: (item: Item) => number): Placement {
  const target = aim(cards, id, spot)
  const others = without(cards, id)
  const above = others[target.index - 1]
  const below = others[target.index]
  return { ...target, rank: rankBetween(above === undefined ? undefined : rankOf(above), below === undefined ? undefined : rankOf(below)) }
}

export function sameSpot(left: Spot, right: Spot): boolean {
  return left.column === right.column && left.index === right.index
}

/** The spot a key moves a lifted card to; undefined for a key that does not move it. */
export function step(columns: readonly string[], counts: ReadonlyMap<string, number>, lift: Lift, key: string): Spot | undefined {
  // counts are per column without the moving card: a column has `count + 1` spots.
  const { column, index } = lift.to
  const last = (name: string): number => counts.get(name) ?? 0
  const at = columns.indexOf(column)
  switch (key) {
    case 'ArrowUp': return { column, index: Math.max(0, index - 1) }
    case 'ArrowDown': return { column, index: Math.min(last(column), index + 1) }
    case 'Home': return { column, index: 0 }
    case 'End': return { column, index: last(column) }
    case 'ArrowLeft':
    case 'ArrowRight': {
      const next = columns[at + (key === 'ArrowLeft' ? -1 : 1)]
      return next === undefined ? lift.to : { column: next, index: Math.min(index, last(next)) }
    }
    default: return undefined
  }
}

/** The index a pointer at `y` points to: the number of cards whose middle is above it. */
export function indexAt(middles: readonly number[], y: number): number {
  let index = 0
  while (index < middles.length && (middles[index] as number) < y) index++
  return index
}

/**
 * What a column renders while a card is lifted (`lift.to` resolved against `cards`). Keyboard: the
 * card itself at its target spot. Pointer: the placeholder at the target spot, and the card kept
 * hidden where the list has it (`origin`), so the element the pointer went down on stays mounted.
 */
export function entries<Item extends Keyed>(cards: readonly Item[], column: string, lift: Lift | null, lifted: Item | undefined): Entry<Item>[] {
  if (lift === null || lifted === undefined) return cards.map((item) => ({ kind: 'card', item, origin: false }))
  const pointer = lift.mode === 'pointer'
  const out: Entry<Item>[] = cards.filter((item) => pointer || item.id !== lift.id).map((item) => ({ kind: 'card', item, origin: item.id === lift.id }))
  if (lift.to.column === column) {
    out.splice(cardPosition(out, lift.to.index), 0, pointer ? { kind: 'placeholder' } : { kind: 'card', item: lifted, origin: false })
  }
  return out
}

/** The array position before the `index`-th card entry (placeholders and the origin do not count). */
function cardPosition<Item>(list: readonly Entry<Item>[], index: number): number {
  let seen = 0
  for (let position = 0; position < list.length; position++) {
    const entry = list[position] as Entry<Item>
    if (entry.kind !== 'card' || entry.origin) continue
    if (seen === index) return position
    seen++
  }
  return list.length
}
