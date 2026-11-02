<script setup lang="ts">
import { ref } from 'vue'
import { useLiveStatus } from '@/api/vue'
import ConnectionBanner from './ConnectionBanner.vue'

// The fake socket stays open, so the states below are forced (`force`, docs and previews only).
const status = useLiveStatus()
const retried = ref(0)
</script>

<template>
  <section>
    <h2>Live: the demo connection is {{ status }}; open and idle show nothing</h2>
    <ConnectionBanner />
  </section>
  <section>
    <h2>Reconnecting</h2>
    <ConnectionBanner force="reconnecting" />
  </section>
  <section>
    <h2>Ended, with Retry</h2>
    <ConnectionBanner force="ended" :reconnect="() => retried++" />
    <p class="muted">Retry pressed {{ retried }} times</p>
  </section>
  <section>
    <h2>Ended, without a reconnect handler</h2>
    <ConnectionBanner force="ended" />
  </section>
</template>

<style scoped>
.muted { margin-top: var(--ui-space-2); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
