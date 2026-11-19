<script setup lang="ts">
import { ref } from 'vue'
import Toast from './Toast.vue'
import { toast } from './toast'
import Button from '../Button/Button.vue'

const archived = ref(0)
function archive() {
  archived.value += 1
  toast({ message: 'Customer archived.', action: { label: 'Undo', run: () => { archived.value -= 1 } } })
}
// Three show, the fourth waits; closing one lets it in while the others slide together.
function fourAtOnce() {
  for (const month of ['January', 'February', 'March', 'April']) toast({ message: `${month} report exported.` })
}
</script>

<template>
  <!-- The demo stands in for the app shell: the host is mounted once, here. -->
  <Toast />
  <section>
    <h2>Fire a toast</h2>
    <div class="row">
      <Button @click="toast({ message: 'Export started. You get a mail when it is ready.' })">Neutral</Button>
      <Button @click="toast({ message: 'Invoice 2026-0042 sent.', variant: 'success' })">Success</Button>
      <Button @click="toast({ message: 'Could not delete the customer: it still has open invoices.', variant: 'danger' })">Danger</Button>
      <Button data-action="archiveCustomer" @click="archive">Archive (with Undo)</Button>
      <Button variant="ghost" @click="toast({ message: 'Stays until closed.', duration: Infinity })">Until closed</Button>
      <Button variant="ghost" @click="fourAtOnce">Four at once</Button>
    </div>
    <p class="muted">archived: {{ archived }}</p>
  </section>
  <section>
    <h2>Preview</h2>
    <Toast
      :preview="[
        { message: 'Export started. You get a mail when it is ready.' },
        { message: 'Customer archived.', variant: 'success', action: { label: 'Undo', run: () => {} } },
        { message: 'Could not delete the customer: it still has open invoices.', variant: 'danger' },
      ]"
    />
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; margin-bottom: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
