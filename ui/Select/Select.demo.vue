<script setup lang="ts">
import { ref } from 'vue'
import Select from './Select.vue'
import Field from '../Field/Field.vue'

const countries = [
  { value: 'de', label: 'Germany' },
  { value: 'at', label: 'Austria' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'li', label: 'Liechtenstein', disabled: true },
]
const sizes = [10, 25, 50, 100].map(value => ({ value, label: `${value} rows` }))

const country = ref<string | number | null>(null)
const pageSize = ref<string | number | null>(25)
const plan = ref<string | number | null>(null)
</script>

<template>
  <section class="stack">
    <h2>Placeholder and number values</h2>
    <Select v-model="country" name="country" :options="countries" placeholder="Choose a country" />
    <Select v-model="pageSize" name="pageSize" :options="sizes" />
    <p class="muted">country: {{ country }} · pageSize: {{ pageSize }} ({{ typeof pageSize }})</p>
  </section>
  <section class="stack">
    <h2>In a Field</h2>
    <Field label="Country" hint="Where the invoice goes." required>
      <Select v-model="country" name="billingCountry" :options="countries" placeholder="Choose a country" />
    </Field>
    <Field label="Plan" error="Choose a plan to continue.">
      <Select v-model="plan" name="plan" :options="[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]" placeholder="Choose a plan" />
    </Field>
  </section>
  <section>
    <h2>Sizes and disabled</h2>
    <div class="row">
      <Select size="sm" :options="sizes" :model-value="10" />
      <Select :options="sizes" :model-value="25" />
      <Select size="lg" :options="sizes" :model-value="50" />
      <Select :options="countries" :model-value="'de'" disabled />
    </div>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-3); max-width: 28rem; }
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
