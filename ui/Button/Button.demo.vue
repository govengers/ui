<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
import Field from '../Field/Field.vue'
import Icon from '../Icon/Icon.vue'
import Input from '../Input/Input.vue'

const loading = ref(false)
function load() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 1200)
}

// A loading submit keeps the focus and swallows a second press and Enter in the field: the count says so.
// The handler still checks its own flag: requestSubmit() from script passes no button.
const name = ref('Acme GmbH')
const saving = ref(false)
const sent = ref(0)
function save() {
  if (saving.value) return
  sent.value += 1
  saving.value = true
  setTimeout(() => { saving.value = false }, 1500)
}
</script>

<template>
  <section>
    <h2>Variants</h2>
    <div class="row">
      <Button variant="primary" data-action="createThing">Primary</Button>
      <Button>Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger" data-action="deleteThing">Danger</Button>
    </div>
  </section>
  <section>
    <h2>Sizes</h2>
    <div class="row">
      <Button size="sm">Small</Button>
      <Button>Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  </section>
  <section>
    <h2>With icon, icon only, loading, disabled, block</h2>
    <div class="row">
      <Button variant="primary"><template #icon><Icon name="plus" /></template>New customer</Button>
      <Button label="Settings"><template #icon><Icon name="settings" /></template></Button>
      <Button variant="primary" :loading="loading" @click="load">Save</Button>
      <Button disabled>Disabled</Button>
    </div>
    <Button block variant="primary">Block button</Button>
  </section>
  <section>
    <h2>Loading</h2>
    <div class="row">
      <Button variant="primary" loading>Save</Button>
      <Button loading><template #icon><Icon name="download" /></template>Export</Button>
      <Button variant="ghost" label="Refresh" loading><template #icon><Icon name="refresh" /></template></Button>
    </div>
    <form class="row" @submit.prevent="save">
      <Field label="Name"><Input v-model="name" name="name" /></Field>
      <Button type="submit" variant="primary" data-action="saveThing" :loading="saving">Save</Button>
      <output>Submits: {{ sent }}</output>
    </form>
  </section>
  <section>
    <h2>As link</h2>
    <div class="row">
      <Button :to="{ path: '/' }">Router link</Button>
      <Button href="https://github.com/govengers/ui" variant="ghost">Anchor <template #icon><Icon name="external-link" /></template></Button>
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; margin-bottom: var(--ui-space-4); }
form.row { align-items: end; }
</style>
