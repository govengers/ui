<script lang="ts">
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean | undefined
  align?: 'start' | 'end' | undefined
  width?: string | undefined
  hideOnPhone?: boolean | undefined
}
export interface TableSort { key: string; direction: 'asc' | 'desc' }
export type TableKey = string | number
</script>

<script setup lang="ts" generic="Row extends object">
// Table: the one data table (D32). A semantic <table> that becomes a stack of cards when its own
// box is narrower than 48rem (a container query, so a table in a drawer turns into cards too).
// Sort and selection are controlled: the table emits, the page owns the state and the data.
// The roles are explicit because display:grid on table parts drops table semantics in Safari.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import Skeleton from '../Skeleton/Skeleton.vue'

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  rows: Row[]
  rowKey: keyof Row | ((row: Row) => TableKey)
  sort?: TableSort | null | undefined
  selectable?: boolean | undefined
  selected?: TableKey[] | undefined
  loading?: boolean | undefined
  /** Placeholder rows while loading; a list passes its page size. */
  loadingRows?: number | undefined
  /** Visually hidden caption, read by assistive technology. */
  caption?: string | undefined
  stickyHeader?: boolean | undefined
  /** No border and radius of its own: for a Table inside a flush Card. */
  frameless?: boolean | undefined
  /** Bound by `@row-click`; declared as a prop so the rows know to look and act clickable. */
  onRowClick?: ((row: Row) => void) | undefined
}>(), { sort: null, selected: () => [], loadingRows: 5 })

const emit = defineEmits<{
  'update:sort': [sort: TableSort]
  'update:selected': [selected: TableKey[]]
}>()

const slots = defineSlots<{
  [cell: `cell-${string}`]: (props: { row: Row; value: unknown }) => unknown
  empty?: () => unknown
  actions?: (props: { row: Row }) => unknown
  bulk?: (props: { selected: TableKey[] }) => unknown
}>()

const { t } = useI18n()

const keyOf = (row: Row): TableKey => (typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey] as TableKey)
const valueOf = (row: Row, key: string): unknown => (row as Record<string, unknown>)[key]
const display = (value: unknown): string => (value == null ? '' : String(value))
const nameOf = (row: Row): string => (props.columns[0] ? display(valueOf(row, props.columns[0].key)) : String(keyOf(row)))

const chosen = computed(() => new Set(props.selected))
const visible = computed(() => props.rows.map(keyOf))
const chosenVisible = computed(() => visible.value.filter(key => chosen.value.has(key)).length)
const allChosen = computed(() => props.rows.length > 0 && chosenVisible.value === props.rows.length)
const someChosen = computed(() => chosenVisible.value > 0 && !allChosen.value)
const span = computed(() => props.columns.length + (props.selectable ? 1 : 0) + (slots.actions ? 1 : 0))

/** Selects every visible row, or clears them when all are selected; keys of other pages stay. */
function toggleAll() {
  const rest = props.selected.filter(key => !visible.value.includes(key))
  emit('update:selected', allChosen.value ? rest : [...rest, ...visible.value])
}

// For a list's own Select all in card mode, where the header is hidden.
defineExpose({ toggleAll, allChosen, someChosen })

function toggle(row: Row) {
  const key = keyOf(row)
  emit('update:selected', chosen.value.has(key) ? props.selected.filter(item => item !== key) : [...props.selected, key])
}

function sortBy(key: string) {
  const direction = props.sort?.key === key && props.sort.direction === 'asc' ? 'desc' : 'asc'
  emit('update:sort', { key, direction })
}

function ariaSort(key: string) {
  if (props.sort?.key !== key) return undefined
  return props.sort.direction === 'asc' ? 'ascending' : 'descending'
}

// Clicks on a control inside the row belong to the control. A guard instead of stopPropagation,
// so document listeners (menus that close on an outside click) still see the click.
const controls = 'a, button, input, select, textarea, label, summary, .ui-table__select, .ui-table__actions'
function click(row: Row, event: MouseEvent) {
  if (!(event.target as Element).closest(controls)) props.onRowClick?.(row)
}
</script>

<template>
  <div class="ui-table" :data-sticky="stickyHeader || undefined" :data-frameless="frameless || undefined" :data-clickable="onRowClick ? '' : undefined">
    <div v-if="selected.length > 0" class="ui-table__bulk">
      <span aria-live="polite">{{ t('ui.selectedCount', { n: selected.length }) }}</span>
      <Button variant="ghost" size="sm" @click="emit('update:selected', [])">{{ t('ui.clear') }}</Button>
      <span v-if="$slots.bulk" class="ui-table__bulk-actions"><slot name="bulk" :selected="selected" /></span>
    </div>
    <div class="ui-table__scroll">
      <table class="ui-table__table" role="table" :aria-busy="loading || undefined">
        <caption v-if="caption" class="ui-visually-hidden">{{ caption }}</caption>
        <thead class="ui-table__head" role="rowgroup">
          <tr role="row">
            <th v-if="selectable" class="ui-table__select" role="columnheader" scope="col"><label class="ui-table__check">
              <input type="checkbox" :checked="allChosen" :indeterminate="someChosen" :disabled="rows.length === 0 || loading" :aria-label="t('ui.selectAll')" @change="toggleAll">
            </label></th>
            <th v-for="column in columns" :key="column.key" role="columnheader" scope="col" :style="{ width: column.width }" :aria-sort="ariaSort(column.key)"
              :data-align="column.align" :data-hide-on-phone="column.hideOnPhone || undefined">
              <button v-if="column.sortable" type="button" class="ui-table__sort" @click="sortBy(column.key)">
                {{ column.label }}
                <Icon v-if="sort?.key === column.key" :name="sort.direction === 'asc' ? 'chevron-up' : 'chevron-down'" size="sm" />
              </button>
              <template v-else>{{ column.label }}</template>
            </th>
            <th v-if="$slots.actions" class="ui-table__actions" role="columnheader" scope="col"><span class="ui-visually-hidden">{{ t('ui.actions') }}</span></th>
          </tr>
        </thead>
        <tbody v-if="loading" class="ui-table__loading" role="rowgroup" aria-hidden="true">
          <tr v-for="line in loadingRows" :key="line" role="row">
            <td v-if="selectable" class="ui-table__select" role="cell" />
            <td v-for="column in columns" :key="column.key" role="cell" :data-hide-on-phone="column.hideOnPhone || undefined"><Skeleton width="100%" /></td>
            <td v-if="$slots.actions" class="ui-table__actions" role="cell" />
          </tr>
        </tbody>
        <tbody v-else-if="rows.length === 0" role="rowgroup">
          <tr role="row"><td :colspan="span" class="ui-table__empty" role="cell"><slot name="empty">{{ t('ui.noResults') }}</slot></td></tr>
        </tbody>
        <tbody v-else role="rowgroup">
          <tr v-for="row in rows" :key="keyOf(row)" class="ui-table__row" role="row" :data-state="chosen.has(keyOf(row)) ? 'selected' : undefined"
            :tabindex="onRowClick ? 0 : undefined" @click="click(row, $event)" @keydown.enter.self.prevent="!$event.repeat && onRowClick?.(row)">
            <td v-if="selectable" class="ui-table__select" role="cell"><label class="ui-table__check">
              <input type="checkbox" :checked="chosen.has(keyOf(row))" :aria-label="t('ui.selectRow', { row: nameOf(row) })" @change="toggle(row)">
            </label></td>
            <td v-for="column in columns" :key="column.key" role="cell" :data-label="column.label" :data-align="column.align"
              :data-hide-on-phone="column.hideOnPhone || undefined">
              <slot :name="`cell-${column.key}`" :row="row" :value="valueOf(row, column.key)">{{ display(valueOf(row, column.key)) }}</slot>
            </td>
            <td v-if="$slots.actions" class="ui-table__actions" role="cell"><slot name="actions" :row="row" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.ui-table { container-type: inline-size; display: flex; flex-direction: column; gap: var(--ui-space-2); }
.ui-table__scroll {
  overflow-x: auto;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
}
.ui-table[data-frameless] .ui-table__scroll { border: 0; border-radius: 0; }
/* A scroll box would capture the sticky header; with stickyHeader the page scrolls instead. */
.ui-table[data-sticky] .ui-table__scroll { overflow: visible; }
.ui-table__table { width: 100%; border-collapse: collapse; font-size: var(--ui-text-sm); }

.ui-table__bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ui-space-2);
  padding: var(--ui-space-1) var(--ui-space-1) var(--ui-space-1) var(--ui-space-3);
  background: var(--ui-surface-2);
  border-radius: var(--ui-radius-card);
  font-size: var(--ui-text-sm);
  font-weight: var(--ui-weight-medium);
}
.ui-table__bulk-actions { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); margin-inline-start: auto; }

.ui-table__head th {
  height: var(--ui-touch-min);
  padding: 0 var(--ui-space-3);
  background: var(--ui-surface);
  border-bottom: var(--ui-border-width) solid var(--ui-divider);
  color: var(--ui-muted);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-medium);
  letter-spacing: var(--ui-tracking-caps);
  text-align: start;
  text-transform: uppercase;
  white-space: nowrap;
}
.ui-table__head th:first-child { border-start-start-radius: calc(var(--ui-radius-card) - var(--ui-border-width)); }
.ui-table__head th:last-child { border-start-end-radius: calc(var(--ui-radius-card) - var(--ui-border-width)); }
.ui-table[data-sticky] .ui-table__head th { position: sticky; top: var(--ui-sticky-top, 0); z-index: var(--ui-z-sticky); }
.ui-table__sort {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-1);
  min-height: var(--ui-touch-min);
  padding: 0;
  background: none;
  border: 0;
  letter-spacing: inherit;
  text-transform: inherit;
}
@media (hover: hover) {
  .ui-table__sort:hover { color: var(--ui-ink); }
}
[aria-sort] > .ui-table__sort { color: var(--ui-ink); }

.ui-table__table td { padding: var(--ui-row-py) var(--ui-space-3); border-bottom: var(--ui-border-width) solid var(--ui-divider); }
.ui-table__table tbody tr:last-child td { border-bottom: 0; }
.ui-table__table [data-align="end"] { text-align: end; }
.ui-table__table .ui-table__select, .ui-table__table .ui-table__actions { width: 1%; padding-block: 0; white-space: nowrap; }
/* The height holds a placeholder row's select cell as tall as the 44 px checkbox of a data row. */
.ui-table__table .ui-table__select { height: var(--ui-touch-min); padding-inline: 0; }
.ui-table__table .ui-table__actions { padding-inline-start: 0; text-align: end; }
.ui-table__check { display: inline-flex; align-items: center; justify-content: center; min-width: var(--ui-touch-min); min-height: var(--ui-touch-min); cursor: pointer; }
.ui-table__check input { margin: 0; accent-color: var(--ui-accent); cursor: inherit; }

/* Columns end on pixel fractions; a same-colour shadow fills the anti-aliased seam between cells. */
@media (hover: hover) {
  .ui-table__row:hover > td { background: var(--ui-surface-2); }
  .ui-table__row:hover > td + td { box-shadow: -1px 0 var(--ui-surface-2); }
}
.ui-table__row[data-state="selected"] > td { background: var(--ui-accent-soft); }
.ui-table__row[data-state="selected"] > td + td { box-shadow: -1px 0 var(--ui-accent-soft); }
.ui-table[data-clickable] .ui-table__row { cursor: pointer; }
.ui-table__row:focus-visible { outline-offset: -2px; }

.ui-table__table .ui-table__empty { padding: var(--ui-space-10) var(--ui-space-4); color: var(--ui-muted); text-align: center; }
/* Placeholder rows (card frames, row lines) wait for --ui-loading-delay like the Skeletons inside
   them, their space held, so a fast read shows no blank frames. Collapsed borders are painted by
   the table, not by the hidden cells, so the lines wait through their colour. */
.ui-table__loading { animation: ui-table-appear 0s var(--ui-loading-delay) backwards; }
.ui-table__loading td { animation: ui-table-lines 0s var(--ui-loading-delay) backwards; }
/* An empty actions cell as tall as a row menu's button, so a placeholder card matches a data card. */
.ui-table__loading .ui-table__actions { height: var(--ui-control-h); }
@keyframes ui-table-appear { from { visibility: hidden; } }
@keyframes ui-table-lines { from { border-color: transparent; } }
</style>

<style scoped src="./Table.phone.css"></style>
