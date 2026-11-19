<script setup lang="ts">
// ListPage recipe (D32): every customer with counted tabs, search, facet filter, created range,
// columns, sort, paging, selection with bulk actions, a row menu, the detail drawer and the create
// dialog. The per-entity parts live in customers.list.ts; this file composes the blocks.
import { computed, nextTick, reactive, ref, useTemplateRef, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNavigationFailure, NavigationFailureType, useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/runtime'
import { useLive, useLiveConnection, useLiveList, useLivePair } from '@/api/vue'
// In a project: import { calls, downloads, live, type CreateCustomer, type CustomersFilter, type CustomerStatus } from '@/api/api'
import { calls, downloads, live, type CreateCustomer, type CustomersFilter, type CustomerStatus } from '@/fake/api'
import Badge from '../../ui/Badge/Badge.vue'
import Banner from '../../ui/Banner/Banner.vue'
import Button from '../../ui/Button/Button.vue'
import Dialog from '../../ui/Dialog/Dialog.vue'
import EmptyState from '../../ui/EmptyState/EmptyState.vue'
import Field from '../../ui/Field/Field.vue'
import Icon from '../../ui/Icon/Icon.vue'
import Input from '../../ui/Input/Input.vue'
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import Select from '../../ui/Select/Select.vue'
import Skeleton from '../../ui/Skeleton/Skeleton.vue'
import Tabs from '../../ui/Tabs/Tabs.vue'
import type { TableKey } from '../../ui/Table/Table.vue'
import { toast } from '../../ui/Toast/toast'
import { useAgentAction } from '../../ui/agent/registry'
import ColumnsPicker from '../../ui/blocks/ColumnsPicker/ColumnsPicker.vue'
import DetailDrawer from '../../ui/blocks/DetailDrawer/DetailDrawer.vue'
import FacetFilter from '../../ui/blocks/FacetFilter/FacetFilter.vue'
import { toFilterDocument, withQuery, type FacetClause, type FilterDocument } from '../../ui/blocks/FacetFilter/facets'
import RangePicker from '../../ui/blocks/RangePicker/RangePicker.vue'
import { anyTime, isAnyTime, rangeToConditions, type TimeRange } from '../../ui/blocks/RangePicker/range'
import SearchTable from '../../ui/blocks/SearchTable/SearchTable.vue'
import { formatCurrency, formatDate } from '../../ui/format'
import { createCustomer, deleteCustomer } from './actions'
import { bulkActions, columns, defaultColumns, defaultSort, detailRoute, facets, rowActions, statuses, statusKeys, statusTone, tabs, type Names } from './customers.list'
import { messages } from './messages'

// Global scope merges the folder's messages into the app's, so one t resolves page and ui.* keys.
const { t, locale } = useI18n({ useScope: 'global', messages })
const route = useRoute()
const router = useRouter()
const connection = useLiveConnection()
const pair = useLivePair()

// Names for owner ids and country codes: the facets, the cells and the drawer show these.
const users = useLiveList(live.users)
const regions = computed(() => new Intl.DisplayNames([locale.value], { type: 'region' }))
const names: Names = {
  owner: id => users.items.value.find(user => user.id === id)?.name ?? id,
  country: code => regions.value.of(code) ?? code,
}
const columnList = computed(() => columns(t))
const visible = ref([...defaultColumns])
const shown = computed(() => columnList.value.filter(column => visible.value.includes(column.key)))
const facetList = facets(t, names)
const statusOptions = computed(() => statuses.map(value => ({ value, label: t(statusKeys[value]) })))

// The filter: tab and created range are the base, the facet clauses go on top, SearchTable adds the search.
const clauses = ref<FacetClause[]>([])
const range = ref<TimeRange>({ ...anyTime })
const search = ref('')
const tabList = computed(() => tabs(t))
const tab = computed(() => tabList.value.find(item => item.value === route.query['tab']) ?? tabList.value[0]!)
const where = (conditions: unknown[]): FilterDocument => (conditions.length > 0 ? { where: { and: conditions } } : {})
const ranged = computed(() => rangeToConditions('createdAt', range.value))
const base = computed(() => where([...ranged.value, ...(tab.value.status ? [{ field: 'status', op: 'eq', value: tab.value.status }] : [])]))
const filter = computed(() => toFilterDocument(clauses.value, { base: base.value, facets: facetList }) as CustomersFilter)
const narrowed = computed(() => search.value.trim() !== '' || clauses.value.length > 0 || !isAnyTime(range.value))
// SearchTable's total under the whole filter: an empty page past the end is no first run.
const listTotal = ref<number | null>(null)
// While the list still shows the query before (`stale`), the empty state keeps its case: it never
// claims a first run for a query not read yet (right after Clear filters, total and rows are the old).
let shownCase: 'narrowed' | 'firstRun' | 'none' = 'none'
function emptyCase(stale: boolean): typeof shownCase {
  if (!stale) shownCase = narrowed.value ? 'narrowed' : tab.value === tabList.value[0] && listTotal.value === 0 ? 'firstRun' : 'none'
  return shownCase
}

// Each block writes the URL from the route as it is, so three model changes in one tick would let the
// last writer restore the others. The page writes only the keys of the two blocks that follow the URL,
// in one awaited write; their models then match the route and write nothing. The search goes last:
// SearchTable is the only writer left, of its own keys (search, page). `t` is RangePicker's key.
const list = useTemplateRef<ComponentPublicInstance & { clearSearch(): void }>('list')
// One run at a time: a second press would cancel the first navigation and let a block write back.
let clearing = false
async function clearFilters(): Promise<void> {
  if (clearing) return
  clearing = true
  try {
    // The button leaves with the empty state; focus goes to the filter button, not the body.
    list.value?.$el.querySelector('[data-action="filter"]')?.focus()
    const { t: _, ...query } = withQuery(route.query, [], facetList)
    const failure = await router.replace({ path: route.path, hash: route.hash, query })
    // Refused by a guard or superseded: the URL kept its keys, so the models keep theirs. A duplicated
    // navigation (only a search was set) goes on.
    if (isNavigationFailure(failure, NavigationFailureType.aborted | NavigationFailureType.cancelled)) return
    clauses.value = []
    range.value = { ...anyTime }
    list.value?.clearSearch() // also drops a text still in SearchTable's debounce
  } finally {
    clearing = false
  }
}

// The tab counts: one distinct read on status under everything but the tab.
const counts = useLive(live['customers.distinct'], () => ({
  field: 'status' as const,
  filter: toFilterDocument(clauses.value, { base: where(ranged.value), search: search.value, facets: facetList }) as CustomersFilter,
}))
const countOf = (status: CustomerStatus | undefined): number | undefined =>
  counts.data.value?.filter(entry => status === undefined || entry.value === status).reduce((sum, entry) => sum + entry.count, 0)
const tabItems = computed(() => tabList.value.map((item) => {
  const count = countOf(item.status)
  return { value: item.value, label: item.label, to: { query: { ...route.query, tab: item.status } }, ...(count === undefined ? {} : { count }) }
}))
const total = computed(() => countOf(tab.value.status))

const exporting = ref(false)
async function exportCsv(scope: FilterDocument): Promise<void> {
  exporting.value = true
  try {
    const { blob } = await pair.value.client.download(downloads.customers, { filter: scope as CustomersFilter, format: 'csv' })
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'customers.csv' })
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href))
  } catch (failure) {
    toast({ message: t('customers.list.exportFailed', { message: (failure as Error).message }), variant: 'danger' })
  } finally {
    exporting.value = false
  }
}

const open = ref<TableKey | null>(null)
const ids = ref<TableKey[]>([])
const selected = ref<TableKey[]>([])

// Delete, one row or the selection, behind a danger confirm (the delete is final). The push removes
// the rows. `doomed` outlives the close, so the dialog keeps its title and count while it leaves.
const doomed = ref<{ ids: string[]; name?: string }>({ ids: [] })
const confirming = ref(false)
const deleting = ref(false)
const deleteTitle = computed(() => (doomed.value.name !== undefined
  ? t('customers.list.deleteOne', { name: doomed.value.name })
  : t('customers.list.deleteMany', { n: doomed.value.ids.length }, doomed.value.ids.length)))
function askDelete(target: { ids: string[]; name?: string }): void {
  doomed.value = target
  confirming.value = true
}
async function confirmDelete(): Promise<void> {
  // A second press while the call runs, or on the confirm of a dialog that is leaving, deletes nothing.
  if (deleting.value || !confirming.value) return
  const gone = doomed.value.ids
  // Taken before the call: the push may remove the rows before the call answers.
  const shown = ids.value.map(String)
  const at = Math.max(shown.findIndex(id => gone.includes(id)), 0)
  const after = nearest(shown.filter(id => !gone.includes(id)), at)
  deleting.value = true
  try {
    await Promise.all(gone.map(id => connection.value.call(calls.deleteCustomer, { id }, undefined)))
    selected.value = selected.value.filter(key => !gone.includes(String(key)))
    if (gone.includes(String(open.value))) open.value = null
    toast({ message: t('customers.list.deleted', { n: gone.length }, gone.length), variant: 'success' })
    confirming.value = false
    await nextTick()
    refocus = { gone, after, at, opener: document.activeElement }
    placeFocus()
  } catch (failure) {
    toast({ message: (failure as Error).message, variant: 'danger' })
  } finally {
    deleting.value = false
  }
}
/** What takes the place `at` of the first deleted row: the item there, else the last; none in an empty list. */
const nearest = <Item>(items: Item[], at: number): Item | undefined => items[Math.min(at, items.length - 1)]
// The dialog gives the focus back to its opener (a row's menu, the bulk bar), which the push removes,
// before or after the call answers. Once the deleted rows are gone: the successor by id, else (a live
// change took it too) the row now at that place, else the list; never once the user moved the focus.
let refocus: { gone: string[]; after: string | undefined; at: number; opener: Element | null } | undefined
watch(ids, () => placeFocus(), { flush: 'post' })
function placeFocus(): void {
  const wanted = refocus
  if (!wanted || ids.value.some(id => wanted.gone.includes(String(id)))) return
  refocus = undefined
  if (document.activeElement !== wanted.opener && document.activeElement !== document.body) return
  const root = list.value?.$el as HTMLElement | undefined
  const rows = [...(root?.querySelectorAll<HTMLElement>('.ui-table__row') ?? [])]
  const target = rows[ids.value.map(String).indexOf(wanted.after ?? '')] ?? nearest(rows, wanted.at) ?? root
  target?.focus()
}
const rowMenu = rowActions(t, { open: row => (open.value = row.id), remove: row => askDelete({ ids: [row.id], name: row.name }) })
const bulk = bulkActions(t, {
  export: keys => exportCsv({ where: { field: 'id', op: 'in', value: keys.map(String) } }),
  remove: keys => askDelete({ ids: keys.map(String) }),
})

// Create: the server validates, ApiError.fields land at the Fields; the push renders the new row.
const blank = (): CreateCustomer => ({ name: '', email: '', status: 'active', country: '' })
const creating = ref(false)
const draft = reactive(blank())
const createErrors = ref<Readonly<Record<string, string>>>({})
const saving = ref(false)
const createButton = useTemplateRef<ComponentPublicInstance>('createButton')
async function create(): Promise<void> {
  saving.value = true
  createErrors.value = {}
  try {
    const customer = await connection.value.call(calls.createCustomer, {}, { ...draft })
    toast({ message: t('customers.list.created', { name: customer.name }), variant: 'success' })
    Object.assign(draft, blank())
    creating.value = false
    // The dialog gives focus back to its opener, which leaves with the first-run empty state.
    await nextTick()
    createButton.value?.$el.focus()
  } catch (failure) {
    if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) createErrors.value = failure.fields
    else toast({ message: (failure as Error).message, variant: 'danger' })
  } finally {
    saving.value = false
  }
}

useAgentAction(createCustomer, params => connection.value.call(calls.createCustomer, {}, params as unknown as CreateCustomer))
useAgentAction(deleteCustomer, params => connection.value.call(calls.deleteCustomer, { id: String(params['id']) }, undefined))
</script>

<template>
  <Page data-page="customers.list">
    <PageHeader :title="t('customers.list.title')" :subtitle="total === undefined ? undefined : t('customers.list.subtitle', { n: total }, total)">
      <template #actions>
        <Button variant="ghost" :loading="exporting" @click="exportCsv(toFilterDocument(clauses, { base, search, facets: facetList }))">
          <template #icon><Icon name="download" /></template>{{ t('customers.list.export') }}
        </Button>
        <Button ref="createButton" variant="primary" data-action="createCustomer" @click="creating = true">
          <template #icon><Icon name="plus" /></template>{{ t('customers.list.create') }}
        </Button>
      </template>
      <template #tabs><Tabs :items="tabItems" :model-value="tab.value" :label="t('customers.list.title')" /></template>
    </PageHeader>

    <!-- tabindex -1, a group named like the page: the list takes the focus when a delete leaves no row. -->
    <SearchTable ref="list" v-model:selected="selected" v-model:search="search" :target="live.customers" :filter="filter" :columns="shown" row-key="id"
      :default-sort="defaultSort" :row-actions="rowMenu" :search-label="t('customers.list.searchLabel')" :caption="t('customers.list.title')"
      searchable selectable sync-query tabindex="-1" role="group" :aria-label="t('customers.list.title')" @row-click="(row) => (open = row.id)" @rows="(rows) => (ids = rows.map((row) => row.id))"
      @total="(value) => (listTotal = value)">
      <template #toolbar>
        <FacetFilter v-model="clauses" :facets="facetList" :distinct="live['customers.distinct']" :base-filter="base" :search="search" sync-query />
        <RangePicker v-model="range" sync-query />
        <ColumnsPicker v-model="visible" :columns="columnList" storage-key="customers.list.columns" />
      </template>
      <template #cell-status="{ row }"><Badge :variant="statusTone[row.status]" dot>{{ t(statusKeys[row.status]) }}</Badge></template>
      <template #cell-country="{ row }">{{ names.country(row.country) }}</template>
      <template #cell-owner="{ row }">{{ names.owner(row.owner) }}</template>
      <template #cell-revenue="{ row }">{{ formatCurrency(row.revenue, locale, 'EUR') }}</template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt, locale) }}</template>
      <template #bulk="{ selected: keys }">
        <Button v-for="item in bulk" :key="item.label" size="sm" :variant="item.danger ? 'danger' : 'secondary'" :data-action="item.action" @click="item.run(keys)">
          <template #icon><Icon :name="item.icon" /></template>{{ item.label }}
        </Button>
      </template>
      <template #empty="{ stale }">
        <EmptyState v-if="emptyCase(stale) === 'narrowed'" :title="t('customers.list.empty')">
          <template #action><Button @click="clearFilters">{{ t('ui.clearFilters') }}</Button></template>
        </EmptyState>
        <EmptyState v-else-if="emptyCase(stale) === 'firstRun'" icon="users" :title="t('customers.list.emptyFirst')" :description="t('customers.list.emptyFirstHint')">
          <template #action>
            <Button variant="primary" data-action="createCustomer" @click="creating = true">
              <template #icon><Icon name="plus" /></template>{{ t('customers.list.create') }}
            </Button>
          </template>
        </EmptyState>
        <EmptyState v-else :title="t('customers.list.empty')" />
      </template>
    </SearchTable>

    <DetailDrawer v-model="open" :ids="ids" :target="live['customers.item']" :title="t('customers.list.drawerTitle')" sync-query>
      <template #default="{ item, loading, error }">
        <Banner v-if="error" variant="danger">{{ error.message }}</Banner>
        <Skeleton v-else-if="loading" :lines="6" />
        <dl v-else-if="item" class="summary">
          <dt>{{ t('customers.list.fields.name') }}</dt><dd>{{ item.name }}</dd>
          <dt>{{ t('customers.list.fields.email') }}</dt><dd>{{ item.email }}</dd>
          <dt>{{ t('customers.list.fields.status') }}</dt><dd><Badge :variant="statusTone[item.status]" dot>{{ t(statusKeys[item.status]) }}</Badge></dd>
          <dt>{{ t('customers.list.fields.country') }}</dt><dd>{{ names.country(item.country) }}</dd>
          <dt>{{ t('customers.list.fields.owner') }}</dt><dd>{{ names.owner(item.owner) }}</dd>
          <dt>{{ t('customers.list.fields.revenue') }}</dt><dd>{{ formatCurrency(item.revenue, locale, 'EUR') }}</dd>
          <dt>{{ t('customers.list.fields.createdAt') }}</dt><dd>{{ formatDate(item.createdAt, locale) }}</dd>
        </dl>
      </template>
      <template #actions>
        <Button v-if="open !== null" variant="primary" :to="detailRoute(String(open))">{{ t('customers.list.actions.open') }}</Button>
      </template>
    </DetailDrawer>

    <Dialog v-model="creating" :title="t('customers.list.create')">
      <form id="customer-create" class="form" @submit.prevent="create">
        <Field :label="t('customers.list.fields.name')" :error="createErrors['name']" required>
          <Input v-model="draft.name" name="name" autocomplete="organization" />
        </Field>
        <Field :label="t('customers.list.fields.email')" :error="createErrors['email']" required>
          <Input v-model="draft.email" type="email" name="email" autocomplete="email" />
        </Field>
        <Field :label="t('customers.list.fields.status')" :error="createErrors['status']">
          <Select v-model="draft.status" name="status" :options="statusOptions" />
        </Field>
        <Field :label="t('customers.list.fields.country')" :error="createErrors['country']" required>
          <Input v-model="draft.country" name="country" autocomplete="country" />
        </Field>
      </form>
      <template #actions>
        <Button @click="creating = false">{{ t('ui.cancel') }}</Button>
        <Button type="submit" form="customer-create" variant="primary" data-action="createCustomer" :loading="saving">{{ t('customers.list.createSubmit') }}</Button>
      </template>
    </Dialog>

    <Dialog v-model="confirming" variant="danger" size="sm" :title="deleteTitle" :description="t('customers.list.deleteDescription')" :persistent="deleting">
      <template #actions>
        <Button :disabled="deleting" @click="confirming = false">{{ t('ui.cancel') }}</Button>
        <Button variant="danger" data-action="deleteCustomer" :loading="deleting" @click="confirmDelete">
          {{ t('customers.list.actions.deleteN', { n: doomed.ids.length }, doomed.ids.length) }}
        </Button>
      </template>
    </Dialog>
  </Page>
</template>

<style scoped>
.form { display: grid; gap: var(--ui-space-4); }
.summary { display: grid; grid-template-columns: max-content 1fr; gap: var(--ui-space-3) var(--ui-space-6); }
.summary dd { margin: 0; }
</style>
