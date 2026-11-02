<script setup lang="ts">
import { ref } from 'vue'
import Switch from './Switch.vue'

const notifications = ref(true)
const darkMode = ref(false)
const compact = ref(false)
</script>

<template>
  <section>
    <h2>With label</h2>
    <div class="stack">
      <Switch v-model="notifications" name="notifications" label="Notifications" data-action="updateSettings" />
      <Switch v-model="darkMode" name="darkMode">Dark mode <span class="muted">(this page only)</span></Switch>
    </div>
    <p class="muted">notifications: {{ notifications }} · darkMode: {{ darkMode }}</p>
  </section>
  <section>
    <h2>Sizes, no visible label</h2>
    <div class="row">
      <Switch v-model="compact" size="sm" label="Compact" />
      <Switch v-model="compact" label="Compact" />
      <Switch v-model="compact" aria-label="Compact rows" />
    </div>
  </section>
  <section>
    <h2>Disabled</h2>
    <div class="row">
      <Switch label="Off" disabled />
      <Switch label="On" :model-value="true" disabled />
    </div>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; align-items: flex-start; }
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-4); align-items: center; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
