<script setup lang="ts">
import Icon from './Icon.vue'
import { icons, type IconName } from './icons'

const names = Object.keys(icons) as IconName[]
</script>

<template>
  <section>
    <h2>All icons</h2>
    <div class="grid">
      <div v-for="name in names" :key="name" class="cell">
        <Icon :name="name" size="lg" />
        <code>{{ name }}</code>
      </div>
    </div>
  </section>
  <section>
    <h2>Sizes and label</h2>
    <p>
      <Icon name="search" size="sm" /> small, <Icon name="search" /> medium, <Icon name="search" size="lg" /> large,
      <Icon name="alert-circle" label="Warning" /> labelled
    </p>
  </section>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: var(--ui-space-3); }
.cell { display: flex; flex-direction: column; align-items: center; gap: var(--ui-space-2); padding: var(--ui-space-3); background: var(--ui-surface); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
code { font-size: var(--ui-text-xs); color: var(--ui-muted); }
</style>
