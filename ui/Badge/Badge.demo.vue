<script setup lang="ts">
import Badge from './Badge.vue'
</script>

<template>
  <section>
    <h2>Variants</h2>
    <div class="row">
      <Badge>Draft</Badge>
      <Badge variant="accent">In review</Badge>
      <Badge variant="success">Paid</Badge>
      <Badge variant="warning">Due soon</Badge>
      <Badge variant="danger">Overdue</Badge>
    </div>
  </section>
  <section>
    <h2>With dot</h2>
    <div class="row">
      <Badge dot>Offline</Badge>
      <Badge dot variant="accent">Syncing</Badge>
      <Badge dot variant="success">Online</Badge>
      <Badge dot variant="warning">Degraded</Badge>
      <Badge dot variant="danger">Down</Badge>
    </div>
  </section>
  <section>
    <h2>Pill and sizes</h2>
    <div class="row">
      <Badge pill>md</Badge>
      <Badge pill size="sm">sm</Badge>
      <Badge pill variant="accent">12</Badge>
      <Badge pill size="sm" variant="accent">3</Badge>
      <Badge pill size="sm">128</Badge>
      <Badge size="sm" variant="success">Paid</Badge>
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; }
</style>
