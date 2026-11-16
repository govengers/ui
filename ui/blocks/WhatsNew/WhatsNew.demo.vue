<script setup lang="ts">
import { ref } from 'vue'
import { releases } from '@/fake/changelog'
import WhatsNew from './WhatsNew.vue'
import { readSeen, resetWhatsNew, writeSeen } from './whatsNew'
import Button from '../../Button/Button.vue'

const storageKey = 'demo.whatsNew'
const version = '2.4.1'
// Mounted on demand, so the dialog does not cover the demo (and its screenshot) on load.
const mounted = ref(0)
const forced = ref(false)
const stored = ref(readSeen(storageKey))

function mount(seen: string | undefined, force = false) {
  if (seen === undefined) resetWhatsNew(storageKey)
  else writeSeen(seen, storageKey)
  stored.value = seen
  forced.value = force
  mounted.value += 1
  // The block stores a first visit right after its mount.
  setTimeout(() => { stored.value = readSeen(storageKey) })
}
</script>

<template>
  <section>
    <h2>Once per user: running 2.4.1, decided from what is stored</h2>
    <div class="row">
      <Button @click="mount('2.3')">Last saw 2.3: opens</Button>
      <Button @click="mount(undefined)">First visit: silent, stores 2.4</Button>
      <Button variant="ghost" @click="mounted += 1; forced = false">Mount again</Button>
      <Button variant="ghost" @click="mount(stored, true)">Menu entry (force)</Button>
      <span class="muted">stored: {{ stored ?? 'nothing' }}</span>
    </div>
    <WhatsNew
      v-if="mounted > 0"
      :key="mounted"
      :version="version"
      :releases="releases"
      :storage-key="storageKey"
      :force="forced"
      :to="{ hash: '#changelog' }"
      @close="stored = readSeen(storageKey)"
    />
  </section>

  <section>
    <h2>Inline preview of the 2.4 line (patches merged, x.y.0 first)</h2>
    <WhatsNew inline :version="version" :releases="releases" :limit="2" />
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
