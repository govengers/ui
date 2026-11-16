<script setup lang="ts">
import { ref } from 'vue'
import Sheet from './Sheet.vue'
import Button from '../Button/Button.vue'
import Field from '../Field/Field.vue'
import Input from '../Input/Input.vue'

const edit = ref(false)
const filters = ref(false)
const history = ref(false)
const customer = ref({ name: 'Acme GmbH', email: 'billing@acme.example', city: 'Frankfurt' })
</script>

<template>
  <section>
    <h2>Edit form, right side</h2>
    <Button @click="edit = true">Edit customer</Button>
    <Sheet v-model="edit" title="Edit customer">
      <div class="stack">
        <Field label="Name"><Input v-model="customer.name" name="name" /></Field>
        <Field label="Billing email"><Input v-model="customer.email" name="email" type="email" /></Field>
        <Field label="City"><Input v-model="customer.city" name="city" /></Field>
      </div>
      <template #actions>
        <Button @click="edit = false">Cancel</Button>
        <Button variant="primary" data-action="updateCustomer" @click="edit = false">Save</Button>
      </template>
    </Sheet>
  </section>
  <section>
    <h2>Left side, custom header, narrow</h2>
    <Button @click="filters = true">Filters</Button>
    <Sheet v-model="filters" title="Filters" side="left" width="20rem">
      <template #header>
        <h2 class="title">Filters</h2>
        <p class="muted">3 active</p>
      </template>
      <div class="stack">
        <Field label="City"><Input model-value="Frankfurt" name="city" /></Field>
        <Field label="Created after"><Input model-value="2026-01-01" name="createdAfter" type="date" /></Field>
      </div>
      <template #actions>
        <Button variant="ghost">Clear</Button>
        <Button variant="primary" @click="filters = false">Apply</Button>
      </template>
    </Sheet>
  </section>
  <section>
    <h2>Long body, no footer (a bottom sheet below 48rem)</h2>
    <Button @click="history = true">Show history</Button>
    <Sheet v-model="history" title="History">
      <ol class="history">
        <li v-for="n in 30" :key="n">Invoice {{ 2026000 + n }} sent to billing@acme.example</li>
      </ol>
    </Sheet>
  </section>
  <section>
    <h2>Inline preview</h2>
    <Sheet inline title="Edit customer" width="24rem">
      <div class="stack">
        <Field label="Name"><Input model-value="Acme GmbH" name="name" /></Field>
        <Field label="Billing email"><Input model-value="billing@acme.example" name="email" type="email" /></Field>
      </div>
      <template #actions>
        <Button>Cancel</Button>
        <Button variant="primary">Save</Button>
      </template>
    </Sheet>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.title { font-size: var(--ui-text-lg); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.history { margin: 0; padding-inline-start: var(--ui-space-5); display: flex; flex-direction: column; gap: var(--ui-space-2); }
</style>
