<script setup lang="ts">
import { ref } from 'vue'
import WhatsNew from './WhatsNew.vue'
import { resetWhatsNew, unseen } from './whatsNew'
import Button from '../../Button/Button.vue'

const storageKey = 'demo.whatsNew'
const version = '2.4.0'
// Mounted on demand, so the dialog does not cover the demo (and its screenshot) on load.
const mounted = ref(0)
const seen = ref(!unseen(version, storageKey))

function show() {
  resetWhatsNew(storageKey)
  seen.value = false
  mounted.value += 1
}
</script>

<template>
  <section>
    <h2>Once per version: reset, then it opens on mount</h2>
    <div class="row">
      <Button @click="show">Reset and mount</Button>
      <Button variant="ghost" @click="mounted += 1">Mount again (stays closed once seen)</Button>
      <span class="muted">stored: {{ seen ? version : 'nothing' }}</span>
    </div>
    <WhatsNew v-if="mounted > 0" :key="mounted" :version="version" :storage-key="storageKey" @close="seen = true">
      <h3>Saved filters</h3>
      <ul>
        <li>Save any filter of the customer list under a name and share its link.</li>
        <li>Counts next to every facet value update live.</li>
      </ul>
      <h3>Fixes</h3>
      <ul>
        <li>The export no longer drops customers without a country.</li>
      </ul>
    </WhatsNew>
  </section>

  <section>
    <h2>Inline preview</h2>
    <WhatsNew inline :version="version" title="What's new in 2.4">
      <h3>Saved filters</h3>
      <ul>
        <li>Save any filter of the customer list under a name and share its link.</li>
        <li>Counts next to every facet value update live.</li>
      </ul>
      <h3>Fixes</h3>
      <ul>
        <li>The export no longer drops customers without a country.</li>
      </ul>
    </WhatsNew>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
