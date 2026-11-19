<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Tooltip from './Tooltip.vue'
import Button from '../Button/Button.vue'
import Dialog from '../Dialog/Dialog.vue'
import Icon from '../Icon/Icon.vue'

const tools = [{ icon: 'bold', label: 'Bold' }, { icon: 'italic', label: 'Italic' }, { icon: 'link', label: 'Insert link' }, { icon: 'code', label: 'Code' }] as const
const rail = [{ icon: 'home', label: 'Overview' }, { icon: 'users', label: 'Customers' }, { icon: 'settings', label: 'Settings' }] as const
const share = ref(false)
// Focus on load shows the tooltip at once, so the screenshot has the panel in it.
const preview = ref<HTMLElement | null>(null)
onMounted(() => preview.value?.querySelector('button')?.focus({ preventScroll: true }))
</script>

<template>
  <section>
    <h2>Around an element</h2>
    <div class="row">
      <Tooltip text="Exports the rows that match the filters as a CSV file.">
        <Button>Export<template #icon><Icon name="download" /></template></Button>
      </Tooltip>
      <Tooltip text="Copies the customer with a new number; invoices stay with the original." placement="top">
        <Button>Duplicate<template #icon><Icon name="copy" /></template></Button>
      </Tooltip>
    </div>
  </section>
  <section>
    <h2>Inside its trigger, as a label</h2>
    <div class="row toolbar" role="toolbar" aria-label="Formatting">
      <button v-for="tool in tools" :key="tool.icon" type="button" class="tool" :aria-label="tool.label">
        <Icon :name="tool.icon" />
        <Tooltip :text="tool.label" kind="label" />
      </button>
    </div>
  </section>
  <section>
    <h2>Beside the trigger: placement end</h2>
    <nav class="rail" aria-label="Rail">
      <button v-for="item in rail" :key="item.icon" type="button" class="tool" :aria-label="item.label">
        <Icon :name="item.icon" />
        <Tooltip :text="item.label" kind="label" placement="end" />
      </button>
    </nav>
  </section>
  <section>
    <h2>Inside a modal dialog</h2>
    <Button @click="share = true">Share list</Button>
    <Dialog v-model="share" size="sm" title="Share list">
      <Tooltip text="Anyone with the link can open the list; only members can change it.">
        <Button>Copy link<template #icon><Icon name="link" /></template></Button>
      </Tooltip>
      <template #actions>
        <Button variant="primary" @click="share = false">Done</Button>
      </template>
    </Dialog>
  </section>
  <section class="preview">
    <h2>Open on load</h2>
    <div ref="preview" class="row">
      <Tooltip text="Publishes the release notes to every user at the next sign-in.">
        <Button variant="primary" data-action="publishRelease">Publish</Button>
      </Tooltip>
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; }
.toolbar { gap: var(--ui-space-1); }
.rail { display: flex; flex-direction: column; gap: var(--ui-space-1); width: max-content; padding: var(--ui-space-1); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
.tool { display: inline-grid; place-items: center; min-width: var(--ui-control-h); min-height: var(--ui-control-h); padding: 0; background: none; border: 0; border-radius: var(--ui-radius-control); color: var(--ui-ink-2); }
@media (hover: hover) {
  .tool:hover { background: var(--ui-surface-2); color: var(--ui-ink); }
}
.preview { min-height: 8rem; }
</style>
