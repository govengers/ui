<script setup lang="ts">
import Skeleton from './Skeleton.vue'
</script>

<template>
  <section>
    <h2>Text</h2>
    <div class="stack">
      <Skeleton width="12rem" class="title" />
      <Skeleton :lines="3" />
    </div>
  </section>
  <section>
    <h2>Circle and rect</h2>
    <div class="row">
      <Skeleton shape="circle" width="1.75rem" />
      <Skeleton shape="circle" />
      <Skeleton shape="circle" width="3.5rem" />
      <Skeleton shape="rect" width="16rem" height="6rem" />
    </div>
  </section>
  <section>
    <h2>A loading list row</h2>
    <div class="list" aria-busy="true">
      <div v-for="row in 3" :key="row" class="item">
        <Skeleton shape="circle" />
        <Skeleton :lines="2" class="grow" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-2); max-width: 32rem; }
.title { font-size: var(--ui-text-xl); }
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-4); align-items: center; }
.list { display: flex; flex-direction: column; gap: var(--ui-space-4); max-width: 32rem; padding: var(--ui-card-p); background: var(--ui-surface); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
.item { display: flex; gap: var(--ui-space-3); align-items: center; }
.grow { flex: 1; }
</style>
