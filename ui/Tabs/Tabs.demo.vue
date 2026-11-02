<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Tabs, { type TabItem } from './Tabs.vue'

const items: TabItem[] = [
  { value: 'all', label: 'All', count: 128 },
  { value: 'open', label: 'Open', count: 12 },
  { value: 'closed', label: 'Closed', count: 116 },
  { value: 'archived', label: 'Archived', disabled: true },
]
const tab = ref('open')

const route = useRoute()
const routedItems = items.map(item => ({ ...item, to: { query: item.value === 'all' ? {} : { status: item.value } } }))
const routedValue = computed(() => (typeof route.query.status === 'string' ? route.query.status : 'all'))

const settings: TabItem[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
  { value: 'notifications', label: 'Notifications' },
]
const setting = ref('profile')
</script>

<template>
  <section>
    <h2>Tab list with counts</h2>
    <Tabs v-model="tab" :items="items" label="Invoice status" />
    <p class="panel">Showing the {{ tab }} invoices.</p>
  </section>
  <section>
    <h2>Routed, the counted tabs of a list page</h2>
    <Tabs :model-value="routedValue" :items="routedItems" label="Invoice status filter" />
    <p class="panel">Query status: {{ route.query.status ?? 'none' }}</p>
  </section>
  <section>
    <h2>Small</h2>
    <Tabs v-model="setting" :items="settings" size="sm" label="Settings" />
  </section>
</template>

<style scoped>
.panel { padding: var(--ui-space-4) 0; color: var(--ui-ink-2); font-size: var(--ui-text-sm); }
</style>
