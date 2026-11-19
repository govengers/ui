<script setup lang="ts">
import { ref } from 'vue'
import Input from './Input.vue'
import Icon from '../Icon/Icon.vue'

const text = ref('')
const password = ref('hunter2')
const amount = ref<number | null>(42)
const date = ref('2026-11-02')
</script>

<template>
  <section class="stack">
    <h2>Types with prefix and suffix</h2>
    <Input v-model="text" name="q" type="search" placeholder="Search"><template #prefix><Icon name="search" /></template></Input>
    <Input v-model="password" name="password" type="password" />
    <Input v-model="amount" name="amount" type="number" step="0.01"><template #suffix>EUR</template></Input>
    <Input v-model="date" name="date" type="date" />
    <p class="muted">text: {{ text }} · amount: {{ amount }} · date: {{ date }}</p>
  </section>
  <section class="stack">
    <h2>Read only and disabled</h2>
    <Input model-value="Read only" readonly />
    <Input model-value="Disabled" disabled />
  </section>
  <section>
    <h2>Sizes</h2>
    <div class="row">
      <Input size="sm" placeholder="Small" />
      <Input placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-3); max-width: 28rem; }
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
