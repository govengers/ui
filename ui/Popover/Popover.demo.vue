<script setup lang="ts">
import { ref } from 'vue'
import Popover from './Popover.vue'
import Button from '../Button/Button.vue'
import Field from '../Field/Field.vue'
import Icon from '../Icon/Icon.vue'
import Input from '../Input/Input.vue'

const city = ref('Stuttgart')
const applied = ref('none')
const filterOpen = ref(false)
const ranges = ['Today', 'Last 7 days', 'Last 30 days', 'This year']
const range = ref('Last 7 days')
// Open on load (v-model true) so the screenshot shows the panel itself.
const previewOpen = ref(true)
</script>

<template>
  <section>
    <h2>Custom content with v-model</h2>
    <div class="row">
      <Popover v-model="filterOpen" label="City filter">
        <template #trigger="{ toggle, expanded }">
          <Button v-bind="expanded" @click="toggle">City<template #icon><Icon name="filter" /></template></Button>
        </template>
        <template #default="{ close }">
          <div class="panel">
            <Field label="City"><Input v-model="city" name="city" /></Field>
            <div class="actions">
              <Button variant="ghost" @click="close">Cancel</Button>
              <Button variant="primary" @click="applied = city; close()">Apply</Button>
            </div>
          </div>
        </template>
      </Popover>
      <span class="muted">open: {{ filterOpen }} · applied: {{ applied }}</span>
    </div>
  </section>
  <section>
    <h2>Match width, listbox, placement top</h2>
    <Popover role="listbox" label="Range" match-width placement="top">
      <template #trigger="{ toggle, expanded }">
        <Button class="wide" v-bind="expanded" @click="toggle">{{ range }}<template #icon><Icon name="calendar" /></template></Button>
      </template>
      <template #default="{ close }">
        <div class="options">
          <button v-for="option in ranges" :key="option" type="button" role="option" class="option" :aria-selected="option === range" @click="range = option; close()">{{ option }}</button>
        </div>
      </template>
    </Popover>
  </section>
  <section class="preview">
    <h2>Open on load, align end</h2>
    <div class="row end">
      <Popover v-model="previewOpen" align="end" label="Share">
        <template #trigger="{ toggle, expanded }">
          <Button v-bind="expanded" @click="toggle">Share<template #icon><Icon name="users" /></template></Button>
        </template>
        <div class="panel">
          <p class="title">Share with your team</p>
          <p class="muted">Everyone in Acme GmbH can open this list. Only owners can change it.</p>
          <Field label="Invite by email"><Input model-value="" name="email" type="email" placeholder="name@acme.example" /></Field>
        </div>
      </Popover>
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; }
.end { justify-content: flex-end; max-width: 32rem; }
.panel { display: flex; flex-direction: column; gap: var(--ui-space-3); width: 18rem; padding: var(--ui-space-4); }
.actions { display: flex; justify-content: flex-end; gap: var(--ui-space-2); }
.title { font-weight: var(--ui-weight-semibold); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.wide { width: 16rem; justify-content: space-between; }
.options { display: flex; flex-direction: column; padding: var(--ui-space-1); }
.option { min-height: var(--ui-control-h); padding: 0 var(--ui-space-3); background: none; border: 0; border-radius: var(--ui-radius-sm); text-align: start; font-size: var(--ui-text-sm); }
.option:hover, .option[aria-selected="true"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.preview { min-height: 20rem; }
</style>
