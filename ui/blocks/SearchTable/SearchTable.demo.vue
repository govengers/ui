<script setup lang="ts">
import { computed, defineComponent, onScopeDispose, provide, ref, type PropType } from 'vue'
import { createLivePair, type LivePair, type WebSocketLike } from '@/api/runtime'
import { livePairKey, useLiveConnection } from '@/api/vue'
import { calls, live, type Customer, type CustomersFilter, type CustomerStatus, type Order } from '@/fake/api'
import { engine } from '@/fake/live'
import SearchTable from './SearchTable.vue'
import DetailDrawer from '../DetailDrawer/DetailDrawer.vue'
import Badge from '../../Badge/Badge.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import type { MenuItem } from '../../Menu/Menu.vue'
import type { TableColumn, TableKey } from '../../Table/Table.vue'
import { formatCurrency, formatDateTime } from '../../format'

const customerColumns: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', hideOnPhone: true },
  { key: 'status', label: 'Status', sortable: true, width: '8rem' },
  { key: 'country', label: 'Country', sortable: true, hideOnPhone: true },
  { key: 'revenue', label: 'Revenue', sortable: true, align: 'end' },
]
const orderColumns: TableColumn[] = [
  { key: 'number', label: 'Number', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'total', label: 'Total', sortable: true, align: 'end' },
  { key: 'createdAt', label: 'Created', sortable: true, hideOnPhone: true },
]
const badge: Record<CustomerStatus, 'success' | 'warning' | 'neutral'> = { active: 'success', onHold: 'warning', churned: 'neutral' }

// The tabs-like filter: what FacetFilter or CountedTabs would hand in.
const onlyActive = ref(false)
const filter = computed<CustomersFilter | undefined>(() => (onlyActive.value ? { where: { field: 'status', op: 'eq', value: 'active' } } : undefined))

const connection = useLiveConnection()
const open = ref<TableKey | null>(null)
const ids = ref<TableKey[]>([])
const selected = ref<TableKey[]>([])
let seeded = false
function onRows(rows: Customer[]) {
  ids.value = rows.map((row) => row.id)
  if (!seeded && rows.length > 2) {
    seeded = true
    selected.value = [rows[0]!.id, rows[2]!.id]
  }
}
const rowActions = (row: Customer): MenuItem[] => [
  { label: 'Open', icon: 'eye', run: () => (open.value = row.id) },
  { label: '-' },
  { label: 'Delete', icon: 'trash', danger: true, action: 'deleteCustomer', run: () => void connection.value.call(calls.deleteCustomer, { id: row.id }, undefined) },
]
function bumpFirst() {
  const row = engine.store.tables.customers.find((customer) => customer.id === ids.value[0])
  if (row) engine.store.update('customers', row.id, { revenue: row.revenue + 1000 })
}

// The states, each on a pair of its own provided to one section: a socket that never opens
// (loading), and the fake's socket dropping after the first page with every reconnect hanging
// (stale). `billing` always answers 403 (D50), read here as if it were a list.
class Silent implements WebSocketLike {
  readyState = 0
  onopen: WebSocketLike['onopen'] = null
  onmessage: WebSocketLike['onmessage'] = null
  onclose: WebSocketLike['onclose'] = null
  onerror: WebSocketLike['onerror'] = null
  send(_data: string) {}
  close(_code?: number, _reason?: string) {}
}
function droppingSocket(): new (url: string) => WebSocketLike {
  let dropped = false
  return class extends Silent {
    constructor(url: string) {
      super()
      if (dropped) return
      const socket = new engine.WebSocket(url)
      let handler: WebSocketLike['onmessage'] = null
      Object.defineProperty(socket, 'onmessage', {
        set: (value: WebSocketLike['onmessage']) => (handler = value),
        get: () => (event: { data: unknown }) => {
          handler?.(event)
          if (!dropped && String(event.data).includes('"items"')) {
            dropped = true
            setTimeout(() => socket.close(4000), 0)
          }
        },
      })
      return socket
    }
  }
}
const pairOn = (WebSocket: new (url: string) => WebSocketLike): LivePair =>
  createLivePair({ identity: () => 'demo:ada', client: { baseURL: '/api/v1', fetch: engine.fetch }, connection: { url: 'ws://fake/api/v1/socket', WebSocket } })
const loadingPair = pairOn(Silent)
const stalePair = pairOn(droppingSocket())
onScopeDispose(() => {
  loadingPair.end()
  stalePair.end()
})
const WithPair = defineComponent({
  props: { pair: { type: Object as PropType<LivePair>, required: true } },
  setup(props, { slots }) {
    provide(livePairKey, computed(() => props.pair))
    return () => slots.default?.()
  },
})
const forbidden = live.billing as unknown as typeof live.customers
const noMatch = ref('zzzz')
</script>

<template>
  <section>
    <h2>Customers: search, filter, selection, row menu, live changes</h2>
    <SearchTable v-model:selected="selected" :target="live.customers" :filter="filter" :columns="customerColumns" row-key="id" :page-size="10"
      :row-actions="rowActions" searchable selectable caption="Customers" @row-click="(row) => (open = row.id)" @rows="onRows">
      <template #toolbar>
        <Button :variant="onlyActive ? 'secondary' : 'primary'" :aria-pressed="!onlyActive" @click="onlyActive = false">All</Button>
        <Button :variant="onlyActive ? 'primary' : 'secondary'" :aria-pressed="onlyActive" @click="onlyActive = true">Active only</Button>
        <Button variant="ghost" data-action="tick" @click="engine.store.tick()"><template #icon><Icon name="refresh" /></template>Random change</Button>
        <Button variant="ghost" data-action="bumpFirst" @click="bumpFirst"><template #icon><Icon name="arrow-up" /></template>Bump first row</Button>
      </template>
      <template #cell-status="{ row }"><Badge :variant="badge[row.status]" dot>{{ row.status }}</Badge></template>
      <template #cell-revenue="{ row }">{{ formatCurrency(row.revenue, 'en', 'EUR') }}</template>
      <template #bulk="{ selected: keys }">
        <Button size="sm" data-action="exportCustomers"><template #icon><Icon name="download" /></template>Export {{ keys.length }}</Button>
      </template>
    </SearchTable>
    <DetailDrawer v-model="open" :ids="ids" :target="live['customers.item']" title="Customer">
      <template #default="{ item, loading, error }">
        <p v-if="error" class="muted">{{ error.message }}</p>
        <Skeleton v-else-if="loading" :lines="4" />
        <dl v-else-if="item" class="fields">
          <dt>Name</dt><dd>{{ item.name }}</dd>
          <dt>Email</dt><dd>{{ item.email }}</dd>
          <dt>Status</dt><dd><Badge :variant="badge[item.status]" dot>{{ item.status }}</Badge></dd>
          <dt>Country</dt><dd>{{ item.country }}</dd>
          <dt>Revenue</dt><dd>{{ formatCurrency(item.revenue, 'en', 'EUR') }}</dd>
          <dt>Created</dt><dd>{{ formatDateTime(item.createdAt, 'en') }}</dd>
        </dl>
      </template>
    </DetailDrawer>
  </section>
  <section>
    <h2>Orders: cursor mode, previous and next</h2>
    <SearchTable :target="live.orders" :columns="orderColumns" row-key="id" mode="cursor" :page-size="5" :default-sort="{ key: 'createdAt', direction: 'desc' }"
      searchable caption="Orders">
      <template #cell-total="{ row }">{{ formatCurrency(row.total, 'en', (row as Order).currency) }}</template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt, 'en') }}</template>
    </SearchTable>
  </section>
  <section>
    <h2>Loading: the socket never answers</h2>
    <WithPair :pair="loadingPair"><SearchTable :target="live.customers" :columns="customerColumns" row-key="id" searchable /></WithPair>
  </section>
  <section>
    <h2>Refused: forbidden, with Retry</h2>
    <SearchTable :target="forbidden" :columns="customerColumns" row-key="id" />
  </section>
  <section>
    <h2>Empty: the search matches nothing</h2>
    <SearchTable v-model:search="noMatch" :target="live.customers" :columns="customerColumns" row-key="id" searchable />
  </section>
  <section>
    <h2>Stale: the socket dropped, the last page stays</h2>
    <WithPair :pair="stalePair"><SearchTable :target="live.customers" :columns="customerColumns" row-key="id" :page-size="3" /></WithPair>
  </section>
</template>

<style scoped>
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.fields { display: grid; grid-template-columns: max-content 1fr; gap: var(--ui-space-2) var(--ui-space-4); font-size: var(--ui-text-sm); }
.fields dt { color: var(--ui-muted); }
</style>
