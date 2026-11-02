<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useLiveList } from '@/api/vue'
import { live, type CustomersFilter } from '@/fake/api'
import { engine } from '@/fake/live'
import FacetFilter from './FacetFilter.vue'
import FacetPanel from './FacetPanel.vue'
import { toFilterDocument, type FacetClause, type FacetDefinition } from './facets'

// Owners are user ids: the users read turns them into names.
const users = useLiveList(live.users)
const regions = new Intl.DisplayNames(['en'], { type: 'region' })
const seeded = engine.store.tables.customers
const tagValues = [...new Set(seeded.flatMap(customer => customer.tags))].sort().map(tag => ({ value: tag, label: tag }))
const countryValues = [...new Set(seeded.map(customer => customer.country))].map(code => ({ value: code, label: regions.of(code) ?? code })).sort((left, right) => left.label.localeCompare(right.label))

const facets: FacetDefinition[] = [
  { key: 'status', label: 'Status', short: true, values: [{ value: 'active', label: 'active' }, { value: 'onHold', label: 'on hold' }, { value: 'churned', label: 'churned' }] },
  { key: 'country', label: 'Country', short: true, values: countryValues },
  // No values: they come from the counts read, a value appears once a count names it.
  { key: 'owner', label: 'Owner', labelOf: id => users.items.value.find(user => user.id === id)?.name ?? id },
  // A list field: livewire's distinct read refuses it, so its values are given and counted only by a facets read.
  { key: 'tags', label: 'Tags', array: true, values: tagValues },
]

// Distinct reads: one per facet, each under the document without that facet's clauses.
const clauses = ref<FacetClause[]>([
  { key: 'status', values: ['active', 'onHold'] },
  { key: 'owner', values: ['usr-1', 'usr-2', 'usr-3', 'usr-4'] },
  { key: 'tags', values: ['trial'], negate: true },
])
const document = computed(() => toFilterDocument(clauses.value, { facets }))
const customers = useLiveList(live.customers, { limit: 1 })
watchEffect(() => { customers.filter.value = document.value as CustomersFilter })

// One facets read: the server strips each facet's clauses itself. Opened on load.
const second = ref<FacetClause[]>([{ key: 'country', values: ['DE', 'AT', 'CH'] }])
const preview = ref<InstanceType<typeof FacetFilter> | null>(null)
onMounted(() => setTimeout(() => preview.value?.open('owner'), 300))

// The panel: short facets as checkbox lists.
const third = ref<FacetClause[]>([{ key: 'status', values: ['churned'] }])
const panelCustomers = useLiveList(live.customers, { limit: 1 })
watchEffect(() => { panelCustomers.filter.value = toFilterDocument(third.value, { facets }) as CustomersFilter })
</script>

<template>
  <section class="preview">
    <h2>One facets read, open on load</h2>
    <FacetFilter ref="preview" v-model="second" :facets="facets" :facets-read="live.customerFacets" />
  </section>
  <section>
    <h2>Distinct reads, one per facet, synced to the URL</h2>
    <FacetFilter v-model="clauses" :facets="facets" :distinct="live['customers.distinct']" sync-query />
    <p class="muted"><strong>{{ customers.total.value ?? '…' }}</strong> matching customers</p>
    <pre class="json">{{ JSON.stringify(document) }}</pre>
  </section>
  <section>
    <h2>FacetPanel</h2>
    <div class="panel">
      <FacetPanel v-model="third" :facets="facets" :distinct="live['customers.distinct']" />
      <p class="muted"><strong>{{ panelCustomers.total.value ?? '…' }}</strong> matching customers</p>
    </div>
  </section>
</template>

<style scoped>
.muted { margin-top: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); }
.muted strong { color: var(--ui-ink); }
.json { max-width: 40rem; white-space: pre-wrap; word-break: break-word; margin-top: var(--ui-space-3); padding: var(--ui-space-3); background: var(--ui-sunk); border-radius: var(--ui-radius-control); font-size: var(--ui-text-xs); }
.preview { min-height: 28rem; }
.panel { display: flex; gap: var(--ui-space-8); align-items: flex-start; }
</style>
