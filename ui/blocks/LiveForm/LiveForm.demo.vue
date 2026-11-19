<script setup lang="ts">
import { watch } from 'vue'
import Button from '../../Button/Button.vue'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'
import { useLiveForm } from './liveForm'
import { calls, live, type Customer, type UpdateCustomer } from '@/fake/api'
import { engine } from '@/fake/live'

const customer = engine.store.tables.customers[0] as Customer
// The scripted edit below is not the visitor's: no leave guard here (the DetailPage demo shows it).
const { fields, item, errors, touched, conflicts, saving, save, reset, settle } = useLiveForm({
  target: live['customers.item'],
  params: { id: customer.id },
  call: calls.updateCustomer,
  pick: (record: Customer): UpdateCustomer => ({ name: record.name, email: record.email, country: record.country }),
  leaveGuard: false,
})

/** A refused field's error clears once the user leaves it with another value (settle). */
function leave(event: FocusEvent): void {
  const { name } = event.target as Partial<HTMLInputElement>
  if (name) settle(name)
}

/** Someone else edits the record: an untouched field refills, a touched one keeps its text. */
function changeOnServer(): void {
  const current = engine.store.tables.customers.find((record) => record.id === customer.id)
  engine.store.update('customers', customer.id, { name: `${current?.name ?? ''} (edited elsewhere)`, country: current?.country === 'FR' ? 'DE' : 'FR' })
}

// The scripted visit: the user edits the name, then someone else changes name and country.
const stop = watch(item, (loaded) => {
  if (loaded === undefined) return
  stop()
  fields.name = `${loaded.name} GmbH`
  changeOnServer()
})
</script>

<template>
  <section class="narrow">
    <h2>A plain Field stack over useLiveForm</h2>
    <form class="stack" @submit.prevent="save()" @focusout="leave">
      <Field label="Name" :error="errors.name" :hint="conflicts.includes('name') ? 'Changed elsewhere since you started editing.' : undefined">
        <Input v-model="fields.name" name="name" />
      </Field>
      <Field label="Email" :error="errors.email">
        <Input v-model="fields.email" type="email" name="email" />
      </Field>
      <Field label="Country" :error="errors.country">
        <Input v-model="fields.country" name="country" />
      </Field>
      <div class="row">
        <Button type="submit" variant="primary" data-action="updateCustomer" :loading="saving">Save</Button>
        <Button @click="reset">Reset</Button>
        <Button variant="ghost" @click="changeOnServer">Change on the server</Button>
      </div>
    </form>
    <dl class="state">
      <dt>touched</dt><dd data-state="touched">{{ touched.join(', ') || 'none' }}</dd>
      <dt>conflicts</dt><dd data-state="conflicts">{{ conflicts.join(', ') || 'none' }}</dd>
    </dl>
  </section>
</template>

<style scoped>
.narrow { max-width: 32rem; }
.stack { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); }
.state { display: grid; grid-template-columns: auto 1fr; gap: var(--ui-space-1) var(--ui-space-4); margin-top: var(--ui-space-4); font-size: var(--ui-text-sm); }
.state dt { color: var(--ui-muted); }
</style>
