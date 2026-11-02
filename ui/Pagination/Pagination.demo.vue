<script setup lang="ts">
import { ref } from 'vue'
import Pagination from './Pagination.vue'

const page = ref(2)
const pageSize = ref(25)
const cursor = ref(0)
</script>

<template>
  <section>
    <h2>Offset</h2>
    <Pagination v-model:page="page" v-model:page-size="pageSize" :total="132" />
    <p class="muted">page: {{ page }} · page size: {{ pageSize }}</p>
  </section>
  <section>
    <h2>Offset, first page and empty list</h2>
    <div class="stack">
      <Pagination :page="1" :page-size="50" :total="40" />
      <Pagination :page="1" :page-size="25" :total="0" />
    </div>
  </section>
  <section>
    <h2>Cursor</h2>
    <Pagination mode="cursor" :has-previous="cursor > 0" :has-next="cursor < 3" :label="`Batch ${cursor + 1}, 25 of many`" @previous="cursor -= 1" @next="cursor += 1" />
  </section>
  <section>
    <h2>Narrow box: wraps</h2>
    <div class="narrow"><Pagination v-model:page="page" v-model:page-size="pageSize" :total="132" /></div>
  </section>
</template>

<style scoped>
.muted { margin-top: var(--ui-space-2); color: var(--ui-muted); font-size: var(--ui-text-sm); }
.stack { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.narrow { max-width: 22rem; }
</style>
