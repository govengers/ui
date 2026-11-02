<script setup lang="ts">
import { computed, ref } from 'vue'
import Checkbox from './Checkbox.vue'
import Field from '../Field/Field.vue'

const terms = ref(false)
const digest = ref(true)
const channels = ['email', 'sms', 'push']
const selected = ref<string[]>(['email'])
const all = computed(() => selected.value.length === channels.length)
const some = computed(() => selected.value.length > 0 && !all.value)
</script>

<template>
  <section>
    <h2>Boolean, description, slot label</h2>
    <Checkbox v-model="digest" name="digest" label="Weekly digest" description="One email every Monday, no marketing." />
    <Checkbox v-model="terms" name="terms">I accept the <a href="https://github.com/govengers/ui">terms of use</a></Checkbox>
    <p class="muted">digest: {{ digest }} · terms: {{ terms }}</p>
  </section>
  <section>
    <h2>Group in a Field, select all with indeterminate</h2>
    <Field label="Notify me by" :error="selected.length === 0 ? 'Choose at least one channel.' : ''" hint="You can change this later.">
      <div>
        <Checkbox
          label="All channels"
          :model-value="all"
          :indeterminate="some"
          @update:model-value="selected = all ? [] : [...channels]"
        />
        <Checkbox v-for="channel in channels" :key="channel" v-model="selected" name="channels" :value="channel" :label="channel" />
      </div>
    </Field>
    <p class="muted">channels: {{ selected.join(', ') || 'none' }}</p>
  </section>
  <section>
    <h2>Disabled</h2>
    <Checkbox label="Disabled" disabled />
    <Checkbox label="Disabled and checked" :model-value="true" disabled />
  </section>
</template>

<style scoped>
.muted { margin-top: var(--ui-space-2); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
