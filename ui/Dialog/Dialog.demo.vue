<script setup lang="ts">
import { ref } from 'vue'
import Dialog from './Dialog.vue'
import Button from '../Button/Button.vue'
import Field from '../Field/Field.vue'
import Input from '../Input/Input.vue'

const rename = ref(false)
const name = ref('Acme GmbH')
const remove = ref(false)
const terms = ref(false)
const blocking = ref(false)
const closes = ref(0)
</script>

<template>
  <section>
    <h2>Form in a dialog</h2>
    <div class="row">
      <Button @click="rename = true">Rename customer</Button>
      <span class="muted">closed {{ closes }} times</span>
    </div>
    <Dialog v-model="rename" title="Rename customer" description="The new name shows on every invoice from now on." @close="closes += 1">
      <Field label="Name"><Input v-model="name" name="name" /></Field>
      <template #actions>
        <Button @click="rename = false">Cancel</Button>
        <Button variant="primary" data-action="renameCustomer" @click="rename = false">Save</Button>
      </template>
    </Dialog>
  </section>
  <section>
    <h2>Danger confirm</h2>
    <Button variant="danger" @click="remove = true">Delete customer</Button>
    <Dialog v-model="remove" size="sm" variant="danger" title="Delete Acme GmbH?" description="This removes the customer and its 12 invoices. It cannot be undone.">
      <template #actions>
        <Button @click="remove = false">Cancel</Button>
        <Button variant="danger" data-action="deleteCustomer" @click="remove = false">Delete</Button>
      </template>
    </Dialog>
  </section>
  <section>
    <h2>Large with a scrolling body, persistent</h2>
    <div class="row">
      <Button @click="terms = true">Large, scrolling</Button>
      <Button @click="blocking = true">Persistent</Button>
    </div>
    <Dialog v-model="terms" size="lg" title="Terms of service">
      <p v-for="n in 12" :key="n" class="para">
        Section {{ n }}. The customer keeps all rights to the data they upload. We process it only to
        provide the service, store it in the EU and delete it within 30 days after the contract ends.
      </p>
      <template #actions>
        <Button @click="terms = false">Decline</Button>
        <Button variant="primary" data-action="acceptTerms" @click="terms = false">Accept</Button>
      </template>
    </Dialog>
    <Dialog v-model="blocking" size="sm" persistent title="Session expired" description="Sign in again to keep working. Unsaved changes stay in this tab.">
      <template #actions>
        <Button variant="primary" @click="blocking = false">Sign in</Button>
      </template>
    </Dialog>
  </section>
  <section>
    <h2>Inline preview</h2>
    <div class="previews">
      <Dialog inline title="Rename customer" description="The new name shows on every invoice from now on.">
        <Field label="Name"><Input model-value="Acme GmbH" name="name" /></Field>
        <template #actions>
          <Button>Cancel</Button>
          <Button variant="primary">Save</Button>
        </template>
      </Dialog>
      <Dialog inline size="sm" variant="danger" title="Delete Acme GmbH?" description="This removes the customer and its 12 invoices. It cannot be undone.">
        <template #actions>
          <Button>Cancel</Button>
          <Button variant="danger">Delete</Button>
        </template>
      </Dialog>
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.para + .para { margin-top: var(--ui-space-3); }
.previews { display: flex; flex-wrap: wrap; gap: var(--ui-space-6); align-items: flex-start; }
</style>
