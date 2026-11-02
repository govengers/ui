<script setup lang="ts">
import { computed, ref } from 'vue'
import Table, { type TableColumn, type TableKey, type TableSort } from './Table.vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

interface Customer { id: number; name: string; email: string; status: 'active' | 'trial' | 'paused'; revenue: number; city: string }

const customers: Customer[] = [
  { id: 1, name: 'Acme GmbH', email: 'billing@acme.example', status: 'active', revenue: 48200, city: 'Stuttgart' },
  { id: 2, name: 'Borealis AG', email: 'finance@borealis.example', status: 'trial', revenue: 0, city: 'Zürich' },
  { id: 3, name: 'Cobalt Systems', email: 'ap@cobalt.example', status: 'active', revenue: 12950, city: 'Munich' },
  { id: 4, name: 'Delta Freight', email: 'office@delta.example', status: 'paused', revenue: 3100, city: 'Hamburg' },
  { id: 5, name: 'Ember & Sons', email: 'hello@ember.example', status: 'active', revenue: 77010, city: 'Vienna' },
]

const columns: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', hideOnPhone: true },
  { key: 'status', label: 'Status', sortable: true, width: '8rem' },
  { key: 'city', label: 'City', hideOnPhone: true },
  { key: 'revenue', label: 'Revenue', sortable: true, align: 'end' },
]

const sort = ref<TableSort | null>({ key: 'revenue', direction: 'desc' })
const selected = ref<TableKey[]>([1, 5])
const clicked = ref('none')

const sorted = computed(() => {
  const current = sort.value
  if (!current) return customers
  const key = current.key as keyof Customer
  const factor = current.direction === 'asc' ? 1 : -1
  return [...customers].sort((a, b) => (a[key] > b[key] ? factor : a[key] < b[key] ? -factor : 0))
})

const euro = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
</script>

<template>
  <section>
    <h2>Sorted, selectable, custom cell, row actions</h2>
    <Table
      v-model:sort="sort"
      v-model:selected="selected"
      :columns="columns"
      :rows="sorted"
      row-key="id"
      selectable
      caption="Customers"
      @row-click="row => (clicked = row.name)"
    >
      <template #cell-status="{ value }"><span class="status" :data-status="value">{{ value }}</span></template>
      <template #cell-revenue="{ row }">{{ euro.format(row.revenue) }}</template>
      <template #actions="{ row }">
        <Button variant="ghost" size="sm" :label="`Actions for ${row.name}`"><template #icon><Icon name="more-horizontal" /></template></Button>
      </template>
      <template #bulk="{ selected: keys }">
        <Button size="sm" data-action="exportCustomers"><template #icon><Icon name="download" /></template>Export {{ keys.length }}</Button>
        <Button size="sm" variant="danger" data-action="deleteCustomers"><template #icon><Icon name="trash" /></template>Delete</Button>
      </template>
    </Table>
    <p class="muted">sort: {{ sort?.key }} {{ sort?.direction }} · selected: {{ selected.join(', ') || 'none' }} · last row click: {{ clicked }}</p>
  </section>
  <section>
    <h2>Narrow box: rows become cards</h2>
    <div class="narrow">
      <Table v-model:selected="selected" :columns="columns" :rows="sorted.slice(0, 2)" row-key="id" selectable>
        <template #cell-status="{ value }"><span class="status" :data-status="value">{{ value }}</span></template>
        <template #cell-revenue="{ row }">{{ euro.format(row.revenue) }}</template>
        <template #actions="{ row }">
          <Button variant="ghost" size="sm" :label="`Actions for ${row.name}`"><template #icon><Icon name="more-horizontal" /></template></Button>
        </template>
      </Table>
    </div>
  </section>
  <section>
    <h2>Loading</h2>
    <Table :columns="columns" :rows="[]" row-key="id" loading />
  </section>
  <section>
    <h2>Empty</h2>
    <Table :columns="columns" :rows="[]" row-key="id" />
  </section>
</template>

<style scoped>
.muted { margin-top: var(--ui-space-2); color: var(--ui-muted); font-size: var(--ui-text-sm); }
.narrow { max-width: 24rem; }
.status { display: inline-block; padding: 0 var(--ui-space-2); border-radius: var(--ui-radius-pill); font-size: var(--ui-text-xs); font-weight: var(--ui-weight-medium); }
.status[data-status="active"] { background: var(--ui-success-soft); color: var(--ui-on-success-soft); }
.status[data-status="trial"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.status[data-status="paused"] { background: var(--ui-warning-soft); color: var(--ui-on-warning-soft); }
</style>
