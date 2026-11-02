<script setup lang="ts" generic="Item extends object, Query extends ListQuery">
// SearchTable: the live list of the ListPage recipe (D32) over one livewire list read: search,
// a toolbar and chip slot for the page's filter kit, the Table with sort, selection and row
// menus, and the pager. The facet filter is a sibling block; the page passes its document in as
// `filter`. The state logic is in searchTable.ts; this file wires it to useLiveList.
import { computed, onScopeDispose, ref, shallowRef, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import type { ListResponse, LiveTarget } from '@/api/runtime'
import { useLiveList, useLiveStatus } from '@/api/vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import EmptyState from '../../EmptyState/EmptyState.vue'
import Icon from '../../Icon/Icon.vue'
import Input from '../../Input/Input.vue'
import Menu, { type MenuItem } from '../../Menu/Menu.vue'
import Pagination from '../../Pagination/Pagination.vue'
import Table, { type TableColumn, type TableKey, type TableSort } from '../../Table/Table.vue'
import { composeFilter, cursorWindow, errorKey, needsMore, readQuery, sortTerms, writeQuery, type ListQuery } from './searchTable'

const props = withDefaults(defineProps<{
  /** The list read, e.g. `live.customers`. */
  target: LiveTarget<Query, ListResponse<Item>>
  /** The page's filter document (FacetFilter's toFilterDocument, tabs); the search is added beside its where. */
  filter?: Query['filter'] | undefined
  columns: TableColumn[]
  rowKey: keyof Item | ((row: Item) => TableKey)
  defaultSort?: TableSort | undefined
  pageSize?: number | undefined
  /** offset: numbered pages with a total; cursor: previous and next for reads without a total. */
  mode?: 'offset' | 'cursor' | undefined
  selectable?: boolean | undefined
  rowActions?: ((row: Item) => MenuItem[]) | undefined
  searchable?: boolean | undefined
  /** Reads sort, page and search from the URL once and writes them back on change. */
  syncQuery?: boolean | undefined
  emptyTitle?: string | undefined
  caption?: string | undefined
  /** Drops the muted stale line, for a page that shows its own stale notice. */
  hideStale?: boolean | undefined
  /** Bound by `@row-click`; declared so rows only look clickable when someone listens. */
  onRowClick?: ((row: Item) => void) | undefined
}>(), { pageSize: 25, mode: 'offset' })

const emit = defineEmits<{ rows: [rows: Item[]]; total: [total: number | null] }>()
const selected = defineModel<TableKey[]>('selected', { default: () => [] })
const search = defineModel<string>('search', { default: '' })

const slots = defineSlots<{
  [cell: `cell-${string}`]: (props: { row: Item; value: unknown }) => unknown
  toolbar?: () => unknown
  chips?: () => unknown
  bulk?: (props: { selected: TableKey[] }) => unknown
  empty?: (props: { search: string }) => unknown
}>()

const { t } = useI18n()
const cursor = props.mode === 'cursor'
const route = props.syncQuery ? useRoute() : undefined
const router = props.syncQuery ? useRouter() : undefined
const fromUrl = route ? readQuery(route.query) : {}

const sort = ref<TableSort | null>(fromUrl.sort ?? props.defaultSort ?? null)
if (fromUrl.search !== undefined) search.value = fromUrl.search

// The box's text reaches the read 200 ms after the last key; Clear and v-model:search at once.
const typed = ref(search.value)
let debounce: ReturnType<typeof setTimeout> | undefined
watch(typed, (text) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => (search.value = text), 200)
})
watch(search, (text) => {
  if (text !== typed.value) typed.value = text
})
onScopeDispose(() => clearTimeout(debounce))
function clearSearch() {
  clearTimeout(debounce)
  typed.value = ''
  search.value = ''
}

const list = useLiveList(props.target, {
  filter: composeFilter(props.filter, search.value) as Query['filter'],
  sort: sortTerms(sort.value) as Query['sort'],
  limit: props.pageSize,
  mode: props.mode,
})
const { error, page, limit, total, hasMore, retry } = list
if (fromUrl.page !== undefined && !cursor) page.value = fromUrl.page
watch(() => composeFilter(props.filter, search.value), (filter) => (list.filter.value = filter as Query['filter']))
watch(sort, (value) => (list.sort.value = sortTerms(value) as Query['sort']))

// useLiveList drops the rows while a new sort, search or page loads: keep the last ones on
// screen meanwhile, so only the first load shows skeleton rows.
const loaded = shallowRef<Item[]>([])
watchEffect(() => {
  if (!list.loading.value) loaded.value = list.items.value
})

// Cursor mode: useLiveList tiles pages (load more); previous and next step through the loaded
// tiles and load the next one when stepping past them. ponytail: every visited page stays
// subscribed; drop tiles behind the window if long sessions on huge lists matter.
const size = computed(() => limit.value ?? props.pageSize)
const index = ref(0)
watch(() => JSON.stringify([list.filter.value, list.sort.value, limit.value]), () => (index.value = 0))
const window = computed(() => cursorWindow(loaded.value, index.value, size.value, hasMore.value))
function next() {
  if (needsMore(loaded.value.length, index.value, size.value) && hasMore.value) list.loadMore()
  index.value++
}

const rows = computed(() => (cursor ? window.value.rows : loaded.value))
watch(rows, (value) => emit('rows', value), { immediate: true })
const loading = computed(() => !error.value && ((list.loading.value && loaded.value.length === 0) || (cursor && rows.value.length === 0 && list.stale.value)))
const status = useLiveStatus()
const stale = computed(() => !props.hideStale && status.value !== 'open' && loaded.value.length > 0)
const errorText = computed(() => {
  const failure = error.value
  const key = failure && errorKey(failure)
  return key ? t(key) : (failure?.message ?? '')
})

// The last known total, null until the first page: kept while a page loads, so the pager and a
// page's count do not jump.
const shownTotal = ref<number | null>(null)
watch(total, (value) => {
  if (value !== undefined) shownTotal.value = value
})
watch(shownTotal, (value) => emit('total', value), { immediate: true })

if (route && router) {
  watch(
    () => writeQuery(route.query, { sort: sort.value, page: cursor ? 1 : page.value, search: search.value }, props.defaultSort ?? null),
    (query) => {
      if (query) void router.replace({ query: query as LocationQueryRaw })
    },
  )
}

const cellSlots = () => Object.keys(slots).filter((name): name is `cell-${string}` => name.startsWith('cell-'))
const nameOf = (row: Item) => String((row as Record<string, unknown>)[props.columns[0]?.key ?? ''] ?? '')
</script>

<template>
  <div class="ui-search-table">
    <div v-if="searchable || $slots.toolbar" class="ui-search-table__toolbar">
      <Input v-if="searchable" v-model="typed" type="search" name="search" class="ui-search-table__search" :placeholder="t('ui.search')" :aria-label="t('ui.search')">
        <template #prefix><Icon name="search" /></template>
      </Input>
      <slot name="toolbar" />
    </div>
    <slot name="chips" />
    <Banner v-if="error" variant="danger" class="ui-search-table__error">
      {{ errorText }}
      <template #action><Button size="sm" @click="retry">{{ t('ui.retry') }}</Button></template>
    </Banner>
    <p v-else-if="stale" class="ui-search-table__stale" role="status"><Icon name="clock" size="sm" />{{ t('ui.stale') }}</p>
    <template v-if="!(error && rows.length === 0)">
      <Table v-model:sort="sort" v-model:selected="selected" :columns="columns" :rows="rows" :row-key="rowKey" :selectable="selectable"
        :loading="loading" :caption="caption" :on-row-click="onRowClick">
        <template v-for="name in cellSlots()" :key="name" #[name]="scope"><slot :name="name" v-bind="scope" /></template>
        <template v-if="rowActions" #actions="{ row }"><Menu :items="rowActions(row)" :label="t('ui.actionsFor', { row: nameOf(row) })" /></template>
        <template v-if="$slots.bulk" #bulk="scope"><slot name="bulk" v-bind="scope" /></template>
        <template #empty>
          <slot name="empty" :search="search">
            <EmptyState :title="emptyTitle ?? t('ui.noResults')">
              <template v-if="search" #action><Button @click="clearSearch">{{ t('ui.clearSearch') }}</Button></template>
            </EmptyState>
          </slot>
        </template>
      </Table>
      <Pagination v-if="cursor" mode="cursor" :has-previous="window.hasPrevious" :has-next="window.hasNext" @previous="index--" @next="next" />
      <Pagination v-else-if="(shownTotal ?? 0) > 0" v-model:page="page" :page-size="size" :total="shownTotal ?? 0" @update:page-size="(value) => (limit = value)" />
    </template>
  </div>
</template>

<style scoped>
.ui-search-table { display: flex; flex-direction: column; gap: var(--ui-space-3); min-width: 0; }
.ui-search-table__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-2); }
.ui-search-table__search { flex: 1 1 16rem; max-width: 24rem; }
.ui-search-table__error { border-radius: var(--ui-radius-card); }
.ui-search-table__stale { display: flex; align-items: center; gap: var(--ui-space-2); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
