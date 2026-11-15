<script setup lang="ts" generic="Item extends Keyed, Query extends ListQuery, Params extends object, Body">
// Board: a kanban board over ONE live list read (a per-column subscription would flash a moved
// card in every column, because the runtime upserts an optimistic item into every live list of
// its resource). Columns and their order are computed here (board.ts); a move, by pointer
// (drag.ts), by keyboard on the grip or by the card menu, calls the page's move mutation with the
// moved card as the optimistic item.
import { computed, nextTick, ref, shallowRef, useId, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ListResponse, LiveTarget, MutationTarget } from '@/api/runtime'
import { useLiveConnection, useLiveList, useLiveStatus, type UseLiveListOptions } from '@/api/vue'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Menu, { type MenuItem } from '../../Menu/Menu.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import { entries, group, place, sameSpot, step, without, type BoardColumn, type Keyed, type Lift, type ListQuery, type Placement, type Spot } from './board'
import { useBoardDrag } from './drag'

const props = withDefaults(defineProps<{
  /** The board-wide list read, e.g. `live.tasks`; its items carry the column and rank fields. */
  target: LiveTarget<Query, ListResponse<Item>>
  /** The read's filter document, e.g. the cards of one board. Read once. */
  filter?: Query['filter'] | undefined
  /** The read's sort; rank first keeps the right cards when the list is cut at `limit`. Read once. */
  sort?: Query['sort'] | undefined
  /** Cards loaded at most (the resource's MaximumLimit caps it); a cut list says so. */
  limit?: number | undefined
  columns: BoardColumn[]
  /** The field naming a card's column, e.g. `status`. */
  columnField: keyof Item & string
  /** The numeric field ordering cards in a column, e.g. `position`. */
  rankField: keyof Item & string
  /** A card's name for menus and announcements. */
  itemLabel: (item: Item) => string
  /** The move mutation, e.g. `calls.moveTask`; it answers the moved item and upserts into the read's resource. */
  move: MutationTarget<Params, Body, Item>
  /** Its parameters and body for a placement (column, index, neighbours, rank). */
  moveArgs: (item: Item, placement: Placement) => { parameters: Params; body: Body }
  /** More items for a card's menu, under the move items. */
  cardActions?: ((item: Item) => MenuItem[]) | undefined
  /** The board's accessible name. */
  label?: string | undefined
}>(), { limit: 100 })

const emit = defineEmits<{ moved: [item: Item, placement: Placement]; 'move-error': [error: unknown, item: Item] }>()
defineSlots<{
  card?: (props: { item: Item; column: BoardColumn }) => unknown
  'column-actions'?: (props: { column: BoardColumn }) => unknown
  empty?: (props: { column: BoardColumn }) => unknown
}>()

const { t } = useI18n()
const uid = useId()
const connection = useLiveConnection()
const status = useLiveStatus()
const options: UseLiveListOptions<Query> = { limit: props.limit }
if (props.filter !== undefined) options.filter = props.filter
if (props.sort !== undefined) options.sort = props.sort
const list = useLiveList(props.target, options)
const { error, retry, total } = list

const rankOf = (item: Item): number => Number(item[props.rankField])
const columnOf = (item: Item): string => String(item[props.columnField])
const items = shallowRef<Item[]>([])
watchEffect(() => {
  if (!list.loading.value) items.value = list.items.value
})
const grouped = computed(() => group(items.value, props.columns, columnOf, rankOf))
const keys = computed(() => props.columns.map((column) => column.key))
const loading = computed(() => !error.value && list.loading.value && items.value.length === 0)
const stale = computed(() => status.value !== 'open' && items.value.length > 0)
const cut = computed(() => (total.value !== undefined && total.value > items.value.length ? total.value : undefined))

const lift = ref<Lift | null>(null)
const lifted = computed(() => (lift.value === null ? undefined : items.value.find((item) => item.id === lift.value?.id)))
const announcement = ref('')
const root = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)

const cardsOf = (column: string): Item[] => grouped.value.get(column) ?? []
const columnLabel = (key: string): string => props.columns.find((column) => column.key === key)?.label ?? key
const spotOf = (item: Item): Spot => ({ column: columnOf(item), index: cardsOf(columnOf(item)).findIndex((card) => card.id === item.id) })
const counts = computed(() => new Map(props.columns.map((column) => [column.key, without(cardsOf(column.key), lift.value?.id ?? '').length])))
const where = (spot: Spot): string => t('ui.cardPosition', { column: columnLabel(spot.column), n: spot.index + 1, total: (counts.value.get(spot.column) ?? 0) + 1 })

function start(item: Item, mode: Lift['mode']): boolean {
  if (lift.value !== null) return false
  const from = spotOf(item)
  lift.value = { id: item.id, from, to: from, mode }
  announcement.value = t('ui.cardLifted', { card: props.itemLabel(item), where: where(from) })
  return true
}

function cancel(): void {
  const item = lifted.value
  lift.value = null
  if (item) announcement.value = t('ui.moveCancelled', { card: props.itemLabel(item) })
}

function drop(): void {
  const current = lift.value
  const item = lifted.value
  lift.value = null
  if (current && item) void commit(item, current.to)
}

/** Moves a card to a spot: the optimistic item at once, the mutation behind it; an error takes it back. */
async function commit(item: Item, spot: Spot): Promise<void> {
  const name = props.itemLabel(item)
  if (sameSpot(spotOf(item), spot)) {
    announcement.value = t('ui.moveCancelled', { card: name })
    return
  }
  const placement = place(cardsOf(spot.column), item.id, spot, rankOf)
  const optimistic = { ...item, [props.columnField]: spot.column, [props.rankField]: placement.rank } as Item
  const { parameters, body } = props.moveArgs(item, placement)
  announcement.value = t('ui.cardMoved', { card: name, where: where(placement) })
  try {
    await connection.value.call(props.move, parameters, body, { optimistic })
    emit('moved', item, placement)
  } catch (failure) {
    announcement.value = t('ui.moveFailed', { card: name })
    emit('move-error', failure, item)
  }
}

const { ghost, onPointerdown } = useBoardDrag({
  lift: (id) => {
    const item = items.value.find((candidate) => candidate.id === id)
    return item !== undefined && start(item, 'pointer')
  },
  over: (spot) => {
    if (lift.value && !sameSpot(lift.value.to, spot)) lift.value = { ...lift.value, to: spot }
  },
  drop,
  cancel,
  scroller: () => scroller.value,
})

// Keyboard: Space or Enter on the grip lifts, arrows move, Space or Enter drops, Escape cancels.
function onGripKey(event: KeyboardEvent, item: Item): void {
  const current = lift.value
  if (event.isComposing || (current !== null && current.id !== item.id)) return
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    if (current === null) start(item, 'keyboard')
    else drop()
    return
  }
  if (current === null) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    cancel()
    return
  }
  const next = step(keys.value, counts.value, current, event.key)
  if (next === undefined) return
  event.preventDefault()
  lift.value = { ...current, to: next }
  announcement.value = where(next)
  // The card moved in the DOM; keep focus on its grip.
  void nextTick(() => root.value?.querySelector<HTMLElement>(`[data-board-card="${CSS.escape(item.id)}"] [data-board-grip]`)?.focus())
}

function onFocusout(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (lift.value?.mode === 'keyboard' && next !== null && !root.value?.contains(next)) cancel()
}

function menuOf(item: Item): MenuItem[] {
  const from = spotOf(item)
  const last = cardsOf(from.column).length - 1
  const moves: MenuItem[] = props.columns.map((column) => ({
    label: t('ui.moveToColumn', { column: column.label }),
    icon: 'arrow-right',
    action: props.move.name,
    disabled: column.key === from.column,
    run: () => void commit(item, { column: column.key, index: counts.value.get(column.key) ?? 0 }),
  }))
  moves.push(
    { label: '-' },
    { label: t('ui.moveUp'), icon: 'arrow-up', action: props.move.name, disabled: from.index <= 0, run: () => void commit(item, { ...from, index: from.index - 1 }) },
    { label: t('ui.moveDown'), icon: 'arrow-down', action: props.move.name, disabled: from.index >= last, run: () => void commit(item, { ...from, index: from.index + 1 }) },
  )
  const extra = props.cardActions?.(item) ?? []
  return extra.length > 0 ? [...moves, { label: '-' }, ...extra] : moves
}

function countLabel(column: BoardColumn): string {
  const n = cardsOf(column.key).length
  return column.limit === undefined ? t('ui.cardCount', { n }, n) : t('ui.cardCountLimit', { n, limit: column.limit })
}
const overLimit = (column: BoardColumn): boolean => column.limit !== undefined && cardsOf(column.key).length > column.limit
</script>

<template>
  <section ref="root" class="ui-board" :aria-label="label" :data-state="lift ? 'moving' : undefined" @focusout="onFocusout">
    <Banner v-if="error" variant="danger">
      {{ error.message }}
      <template #action><Button size="sm" @click="retry">{{ t('ui.retry') }}</Button></template>
    </Banner>
    <p v-else-if="stale" class="ui-board__note" role="status"><Icon name="clock" size="sm" />{{ t('ui.stale') }}</p>
    <p v-if="cut !== undefined" class="ui-board__note" role="status"><Icon name="info" size="sm" />{{ t('ui.boardCut', { shown: items.length, total: cut }) }}</p>
    <div ref="scroller" class="ui-board__columns">
      <section v-for="column in columns" :key="column.key" class="ui-board__column" :data-board-column="column.key" :aria-labelledby="`${uid}-${column.key}`">
        <header class="ui-board__header">
          <h3 :id="`${uid}-${column.key}`" class="ui-board__title">{{ column.label }}</h3>
          <Badge v-if="!loading" size="sm" :variant="overLimit(column) ? 'warning' : 'neutral'" :aria-label="countLabel(column)">
            {{ cardsOf(column.key).length }}<template v-if="column.limit !== undefined">/{{ column.limit }}</template>
          </Badge>
          <span class="ui-board__header-actions"><slot name="column-actions" :column="column" /></span>
        </header>
        <ol class="ui-board__cards">
          <template v-if="loading">
            <li v-for="n in 2" :key="n" class="ui-board__skeleton"><Skeleton shape="rect" height="4rem" /></li>
          </template>
          <template v-for="entry in loading ? [] : entries(cardsOf(column.key), column.key, lift, lifted)" :key="entry.kind === 'card' ? entry.item.id : 'placeholder'">
            <li v-if="entry.kind === 'placeholder'" class="ui-board__placeholder" :style="{ height: `${ghost?.height ?? 0}px` }" aria-hidden="true" />
            <li
              v-else
              class="ui-board__card"
              :data-board-card="entry.item.id"
              :data-origin="entry.origin || undefined"
              :data-state="lift?.id === entry.item.id && lift.mode === 'keyboard' ? 'lifted' : undefined"
              @pointerdown="onPointerdown($event, entry.item.id)"
            >
              <button
                type="button"
                class="ui-board__grip"
                data-board-grip
                :aria-label="t('ui.moveCard', { card: itemLabel(entry.item) })"
                :aria-pressed="lift?.id === entry.item.id"
                :aria-describedby="`${uid}-help`"
                @keydown="onGripKey($event, entry.item)"
              >
                <Icon name="grip-vertical" />
              </button>
              <div class="ui-board__body"><slot name="card" :item="entry.item" :column="column">{{ itemLabel(entry.item) }}</slot></div>
              <Menu :items="menuOf(entry.item)" :label="t('ui.actionsFor', { row: itemLabel(entry.item) })" class="ui-board__menu" />
            </li>
          </template>
          <li v-if="!loading && cardsOf(column.key).length === 0 && lift?.to.column !== column.key" class="ui-board__empty">
            <slot name="empty" :column="column">{{ t('ui.noCards') }}</slot>
          </li>
        </ol>
      </section>
    </div>
    <p :id="`${uid}-help`" class="ui-visually-hidden">{{ t('ui.boardHelp') }}</p>
    <p class="ui-visually-hidden" aria-live="assertive">{{ announcement }}</p>
    <Teleport to="body">
      <div
        v-if="ghost && lifted"
        class="ui-board__ghost"
        :style="{ transform: `translate(${ghost.x}px, ${ghost.y}px)`, width: `${ghost.width}px`, height: `${ghost.height}px` }"
        aria-hidden="true"
      >
        <span class="ui-board__grip"><Icon name="grip-vertical" /></span>
        <div class="ui-board__body"><slot name="card" :item="lifted" :column="columns.find((column) => column.key === lift?.to.column) ?? columns[0]!">{{ itemLabel(lifted) }}</slot></div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.ui-board { display: flex; flex-direction: column; gap: var(--ui-space-3); min-width: 0; }
.ui-board__note { display: flex; align-items: center; gap: var(--ui-space-2); color: var(--ui-muted); font-size: var(--ui-text-sm); }
.ui-board__columns {
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-3);
  overflow-x: auto;
  /* The columns never widen the page: their width is the board's, they scroll inside it. */
  contain: inline-size;
  padding-block-end: var(--ui-space-2);
  scroll-snap-type: x proximity;
}
.ui-board__column {
  display: flex;
  flex: 0 0 18rem;
  flex-direction: column;
  gap: var(--ui-space-2);
  min-width: 0;
  padding: var(--ui-space-3);
  /* The border draws the column where sunk equals the page (dark themes). */
  border: var(--ui-border-width) solid var(--ui-divider);
  border-radius: var(--ui-radius-card);
  background: var(--ui-sunk);
  scroll-snap-align: start;
}
.ui-board__header { display: flex; align-items: center; gap: var(--ui-space-2); min-height: var(--ui-control-h-sm); }
.ui-board__title { font-size: var(--ui-text-sm); font-weight: var(--ui-weight-semibold); }
.ui-board__header-actions { display: flex; margin-inline-start: auto; }
.ui-board__cards { display: flex; flex-direction: column; gap: var(--ui-space-2); min-height: 3rem; margin: 0; padding: 0; list-style: none; }
.ui-board__card, .ui-board__ghost {
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-1);
  padding: var(--ui-space-2);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-control);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
  user-select: none;
  -webkit-user-select: none;
}
.ui-board__card[data-origin] { display: none; }
.ui-board__card[data-state="lifted"] { border-color: var(--ui-accent); box-shadow: var(--ui-shadow-md); }
.ui-board__body { flex: 1; min-width: 0; padding-block: var(--ui-space-1); overflow-wrap: anywhere; }
.ui-board__grip {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--ui-control-h-sm);
  height: var(--ui-control-h-sm);
  padding: 0;
  border: 0;
  border-radius: var(--ui-radius-sm);
  background: none;
  color: var(--ui-muted);
  cursor: grab;
  touch-action: none;
}
.ui-board__grip:hover, .ui-board__grip[aria-pressed="true"] { background: var(--ui-surface-2); color: var(--ui-ink); }
.ui-board__menu { flex: none; }
.ui-board__placeholder { border: 2px dashed var(--ui-border-strong); border-radius: var(--ui-radius-control); }
.ui-board__empty { padding: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); text-align: center; }
.ui-board__ghost {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: var(--ui-z-overlay);
  border-color: var(--ui-accent);
  box-shadow: var(--ui-shadow-lg);
  pointer-events: none;
  cursor: grabbing;
}
.ui-board[data-state="moving"] { cursor: grabbing; }
@media (pointer: coarse) {
  .ui-board__grip { width: var(--ui-touch-min); height: var(--ui-touch-min); }
}
/* Phones: one column per screen, swiped sideways. */
@media (max-width: 48rem) {
  .ui-board__column { flex-basis: 85%; }
}
</style>
