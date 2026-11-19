<script setup lang="ts">
import { ref } from 'vue'
import RadioGroup from './RadioGroup.vue'
import Field from '../Field/Field.vue'

const themes = [
  { value: 'auto', label: 'Like the system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const speeds = [
  { value: 1, label: 'Express', description: 'Next working day, 12.90 EUR.' },
  { value: 3, label: 'Standard', description: 'Three working days, free from 50 EUR.' },
  { value: 7, label: 'Freight', description: 'Pallets only, not for this order.', disabled: true },
]
const plans = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
]

const theme = ref<string | number | null>('auto')
const speed = ref<string | number | null>(3)
const plan = ref<string | number | null>('free')
</script>

<template>
  <section class="stack">
    <h2>In a Field group</h2>
    <Field label="Theme" group hint="Arrow keys move the choice, Tab leaves the group.">
      <RadioGroup v-model="theme" name="theme" :options="themes" />
    </Field>
    <p class="muted">theme: {{ theme }}</p>
  </section>
  <section class="stack">
    <h2>Descriptions, number values, a disabled option</h2>
    <Field label="Delivery" group>
      <RadioGroup v-model="speed" name="delivery" :options="speeds" />
    </Field>
    <p class="muted">delivery: {{ speed }} ({{ typeof speed }})</p>
  </section>
  <section>
    <h2>Error and disabled</h2>
    <div class="row">
      <Field label="Plan" group error="The Pro plan needs a billing address.">
        <RadioGroup v-model="plan" name="plan" :options="plans" />
      </Field>
      <Field label="Region" group hint="Fixed by your administrator.">
        <RadioGroup model-value="eu" name="region" :options="[{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }]" disabled />
      </Field>
    </div>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-3); max-width: 28rem; }
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-8); align-items: flex-start; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
