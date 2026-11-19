<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useLive, useLiveList } from '@/api/vue'
import { live } from '@/fake/api'
import { engine } from '@/fake/live'
import StatusTile from './StatusTile.vue'

// The page reads livewire and passes plain values: the tile stays dumb.
// A count is the ListResponse total of a one-row page.
const active = useLiveList(live.customers, { filter: { where: { field: 'status', op: 'eq', value: 'active' } }, limit: 1 })
const billing = useLive(live.billing)

// A random change every two seconds, so the live tile moves.
const ticker = setInterval(() => engine.store.tick(), 2000)
onUnmounted(() => clearInterval(ticker))
</script>

<template>
  <section>
    <h2>Dashboard row: static, live, forbidden, loading</h2>
    <div class="grid">
      <StatusTile label="Revenue this month" :value="482310" unit="EUR" :delta="12.4" period="vs last month" state="ok" state-label="On track" to="/ui/blocks/JobProgress">
        Click: the whole tile is a link
      </StatusTile>
      <StatusTile label="Active customers" :value="active.total.value ?? 0" :loading="active.loading.value" state="ok" state-label="Live">
        Updates as customers change status
      </StatusTile>
      <StatusTile label="Billed seats" :value="billing.data.value?.seats ?? '-'" :loading="billing.loading.value" state="neutral">
        {{ billing.error.value ? 'Only the finance team can see billing' : 'From the billing read' }}
      </StatusTile>
      <StatusTile label="Failed jobs" value="" loading />
    </div>
  </section>

  <section>
    <h2>Deltas and lamps: down, flat, inverted</h2>
    <div class="grid">
      <StatusTile label="Uptime" value="99.91" unit="%" :delta="-0.07" state="warning" state-label="Degraded" />
      <StatusTile label="Open tickets" :value="12" :delta="0" state="neutral" />
      <StatusTile label="Error rate" value="2.4" unit="%" :delta="38" invert state="danger" state-label="Alert" />
      <StatusTile label="Churn" value="1.2" unit="%" :delta="-15" invert state="ok" state-label="On track" />
    </div>
  </section>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: var(--ui-space-4); }
</style>
