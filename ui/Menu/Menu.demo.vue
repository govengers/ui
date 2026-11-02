<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Menu, { type MenuItem } from './Menu.vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

const last = ref('nothing yet')
const rowItems: MenuItem[] = [
  { label: 'Open', icon: 'external-link', to: { path: '/' } },
  { label: 'Edit', icon: 'pencil', run: () => { last.value = 'Edit' } },
  { label: 'Duplicate', icon: 'copy', action: 'duplicateCustomer', run: () => { last.value = 'duplicateCustomer' } },
  { label: '-' },
  { label: 'Archive', icon: 'folder', disabled: true },
  { label: 'Delete', icon: 'trash', danger: true, action: 'deleteCustomer', run: () => { last.value = 'deleteCustomer' } },
]
const exportItems: MenuItem[] = [
  { label: 'CSV', icon: 'download', action: 'exportCsv', run: () => { last.value = 'exportCsv' } },
  { label: 'Excel', icon: 'download', action: 'exportXlsx', run: () => { last.value = 'exportXlsx' } },
  { label: 'PDF', icon: 'file', action: 'exportPdf', run: () => { last.value = 'exportPdf' } },
]

// Opened on load so the screenshot shows the menu itself.
const preview = ref<InstanceType<typeof Menu> | null>(null)
onMounted(() => preview.value?.toggle())
</script>

<template>
  <section>
    <h2>Row actions (default trigger, align end)</h2>
    <div class="row">
      <span class="name">Acme GmbH</span>
      <span class="muted">Stuttgart</span>
      <Menu :items="rowItems" label="Actions for Acme GmbH" />
    </div>
    <p class="muted">last activated: {{ last }}</p>
  </section>
  <section>
    <h2>Own trigger, align start</h2>
    <Menu :items="exportItems" align="start" label="Export">
      <template #trigger="{ open, toggle }">
        <Button aria-haspopup="menu" :aria-expanded="open" @click="toggle">
          Export<template #icon><Icon name="download" /></template>
        </Button>
      </template>
    </Menu>
  </section>
  <section class="preview">
    <h2>Open on load</h2>
    <div class="row">
      <span class="name">Globex AG</span>
      <span class="muted">Berlin</span>
      <Menu ref="preview" :items="rowItems" label="Actions for Globex AG" />
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; align-items: center; gap: var(--ui-space-3); max-width: 28rem; padding: var(--ui-space-2) var(--ui-space-3); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-control); background: var(--ui-surface); margin-bottom: var(--ui-space-3); }
.name { font-weight: var(--ui-weight-medium); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.row .muted { flex: 1; }
.preview { min-height: 22rem; }
</style>
