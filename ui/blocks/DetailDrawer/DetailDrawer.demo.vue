<script setup lang="ts">
import { computed, ref } from 'vue'
import { live, type CustomerStatus } from '@/fake/api'
import { engine } from '@/fake/live'
import DetailDrawer from './DetailDrawer.vue'
import Badge from '../../Badge/Badge.vue'
import Button from '../../Button/Button.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import type { TableKey } from '../../Table/Table.vue'
import { formatCurrency } from '../../format'

// The rows "on screen": the first page of customers by name, as SearchTable's `rows` event hands them over.
const ids = [...engine.store.tables.customers].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25).map((row) => row.id)
const badge: Record<CustomerStatus, 'success' | 'warning' | 'neutral'> = { active: 'success', onHold: 'warning', churned: 'neutral' }

const inlineId = ref<TableKey | null>(ids[2] ?? null)
const modalId = ref<TableKey | null>(null)
// Without a target the page passes the record it already has.
const record = computed(() => engine.store.tables.customers.find((row) => row.id === modalId.value))
</script>

<template>
  <section>
    <h2>Live record, previous and next (inline preview; focus it and press the arrow keys)</h2>
    <div class="frame">
      <DetailDrawer v-model="inlineId" :ids="ids" :target="live['customers.item']" title="Customer" inline>
        <template #default="{ item, loading, error }">
          <p v-if="error" class="muted">{{ error.message }}</p>
          <Skeleton v-else-if="loading" :lines="4" />
          <dl v-else-if="item" class="fields">
            <dt>Name</dt><dd>{{ item.name }}</dd>
            <dt>Email</dt><dd>{{ item.email }}</dd>
            <dt>Status</dt><dd><Badge :variant="badge[item.status]" dot>{{ item.status }}</Badge></dd>
            <dt>Revenue</dt><dd>{{ formatCurrency(item.revenue, 'en', 'EUR') }}</dd>
          </dl>
        </template>
        <template #actions><Button data-action="updateCustomer">Edit</Button></template>
      </DetailDrawer>
    </div>
  </section>
  <section>
    <h2>Modal, record passed by the page</h2>
    <Button @click="modalId = ids[0] ?? null">Open the first customer</Button>
    <DetailDrawer v-model="modalId" :ids="ids" :item="record" title="Customer">
      <template #default="{ item }">
        <dl v-if="item" class="fields">
          <dt>Name</dt><dd>{{ item.name }}</dd>
          <dt>Country</dt><dd>{{ item.country }}</dd>
        </dl>
      </template>
    </DetailDrawer>
  </section>
</template>

<style scoped>
.frame { max-width: 28rem; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.fields { display: grid; grid-template-columns: max-content 1fr; gap: var(--ui-space-2) var(--ui-space-4); font-size: var(--ui-text-sm); }
.fields dt { color: var(--ui-muted); }
</style>
