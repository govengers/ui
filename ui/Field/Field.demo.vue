<script setup lang="ts">
import { ref } from 'vue'
import Field from './Field.vue'
import Input from '../Input/Input.vue'
import Checkbox from '../Checkbox/Checkbox.vue'

const email = ref('')
const name = ref('Ada')
const channels = ref<string[]>(['email'])
const maybe = ref<string | undefined>(undefined)
</script>

<template>
  <section class="stack">
    <Field label="Email" hint="We only use it for sign-in." required>
      <Input v-model="email" type="email" name="email" placeholder="ada@example.com" />
    </Field>
    <Field label="Name" error="A name needs at least two characters.">
      <Input v-model="name" name="name" />
    </Field>
    <Field label="Search" hide-label>
      <Input type="search" name="q" placeholder="Search customers" />
    </Field>
    <Field label="Notify me by" group hint="Pick at least one." :error="maybe">
      <Checkbox v-model="channels" value="email" label="Email" name="channels" />
      <Checkbox v-model="channels" value="sms" label="SMS" name="channels" />
    </Field>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-4); max-width: 24rem; }
</style>
