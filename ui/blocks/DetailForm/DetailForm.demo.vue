<script setup lang="ts">
import { watch } from 'vue'
import DetailForm from './DetailForm.vue'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'
import Select from '../../Select/Select.vue'
import { useLiveForm } from '../LiveForm/liveForm'
import { calls, live, type Customer, type UpdateCustomer } from '@/fake/api'
import { engine } from '@/fake/live'

const customer = engine.store.tables.customers[1] as Customer
const pick = (item: Customer): UpdateCustomer => ({ name: item.name, email: item.email, status: item.status, country: item.country })
const statuses = [{ value: 'active', label: 'Active' }, { value: 'onHold', label: 'On hold' }, { value: 'churned', label: 'Churned' }]

// The scripted edit below is not the visitor's: no leave guard here (the DetailPage demo shows it).
const form = useLiveForm({ target: live['customers.item'], params: { id: customer.id }, call: calls.updateCustomer, pick, leaveGuard: false })
const missing = useLiveForm({ target: live['customers.item'], params: { id: 'cus-missing' }, call: calls.updateCustomer, pick })

// The scripted visit: once the record is there, empty the name and save; the fake refuses it.
const stop = watch(form.item, (item) => {
  if (item === undefined) return
  stop()
  form.fields.name = ''
  void form.save()
})
</script>

<template>
  <section class="narrow">
    <h2>Loaded, an empty name refused by the server</h2>
    <DetailForm :form="form" title="Customer" action="updateCustomer">
      <template #default="{ fields, errors, disabled }">
        <Field label="Name" :error="errors.name" required>
          <Input v-model="fields.name" name="name" :disabled="disabled" />
        </Field>
        <Field label="Email" :error="errors.email">
          <Input v-model="fields.email" type="email" name="email" :disabled="disabled" />
        </Field>
        <Field label="Status" :error="errors.status">
          <Select v-model="fields.status" name="status" :options="statuses" :disabled="disabled" />
        </Field>
        <Field label="Country" :error="errors.country">
          <Input v-model="fields.country" name="country" :disabled="disabled" />
        </Field>
      </template>
    </DetailForm>
  </section>
  <section class="narrow">
    <h2>A record that failed to load</h2>
    <DetailForm :form="missing" title="Customer" action="updateCustomer" />
  </section>
</template>

<style scoped>
.narrow { max-width: 36rem; }
</style>
