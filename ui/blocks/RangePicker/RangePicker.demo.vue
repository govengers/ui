<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import RangePicker from './RangePicker.vue'
import { anyTime, rangeToConditions, relativeRange, type TimeRange } from './range'

const range = ref<TimeRange>(relativeRange('-7d'))
const conditions = computed(() => rangeToConditions('createdAt', range.value))

const absolute = ref<TimeRange>({ from: new Date(2026, 10, 2, 10).toISOString(), to: new Date(2026, 10, 2, 12).toISOString() })

// Opened on load so the screenshot shows the quick ranges and the form.
const preview = ref<InstanceType<typeof RangePicker> | null>(null)
const open = ref<TimeRange>({ ...anyTime })
onMounted(() => setTimeout(() => preview.value?.open(), 300))
</script>

<template>
  <section class="preview">
    <h2>Open on load</h2>
    <RangePicker ref="preview" v-model="open" />
  </section>
  <section>
    <h2>Relative range and its conditions, synced to ?t=</h2>
    <RangePicker v-model="range" sync-query />
    <pre class="json">v-model: {{ JSON.stringify(range) }}
rangeToConditions('createdAt'): {{ JSON.stringify(conditions) }}</pre>
  </section>
  <section>
    <h2>Absolute range</h2>
    <RangePicker v-model="absolute" />
  </section>
</template>

<style scoped>
.json { max-width: 40rem; margin-top: var(--ui-space-3); padding: var(--ui-space-3); white-space: pre-wrap; word-break: break-word; background: var(--ui-sunk); border-radius: var(--ui-radius-control); font-size: var(--ui-text-xs); }
.preview { min-height: 39rem; }
</style>
