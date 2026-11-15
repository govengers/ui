<script setup lang="ts">
import { ref } from 'vue'
import UpdateHint from './UpdateHint.vue'
import Button from '../../Button/Button.vue'

// "Reload" in the demo adopts the server's version instead of reloading the page.
const pushedBundle = ref('2.4.1')
const pushed = ref('2.4.1')
const polledBundle = ref('2.4.1')
const deployed = ref('2.4.1')
const checks = ref(0)
async function check(): Promise<string> {
  checks.value += 1
  return deployed.value
}
</script>

<template>
  <section>
    <h2>Pushed over livewire: the version arrives with a live read</h2>
    <div class="row">
      <Button @click="pushed = '2.5.0'">Deploy 2.5.0</Button>
      <span class="muted">bundle {{ pushedBundle }}, server {{ pushed }}</span>
    </div>
    <UpdateHint :version="pushedBundle" :latest="pushed" :reload="() => (pushedBundle = pushed)" />
  </section>

  <section>
    <h2>Polled: a check every 3 seconds here (15 minutes by default), on tab focus and on reconnect</h2>
    <div class="row">
      <Button @click="deployed = deployed === '2.5.0' ? '2.6.0' : '2.5.0'">Deploy the next version</Button>
      <span class="muted">bundle {{ polledBundle }}, server {{ deployed }}, checks {{ checks }}</span>
    </div>
    <UpdateHint :version="polledBundle" :check="check" :interval="3000" :reload="() => (polledBundle = deployed)" />
  </section>

  <section>
    <h2>Static preview</h2>
    <UpdateHint version="2.4.1" force="2.5.0" :reload="() => undefined" />
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); margin-bottom: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
