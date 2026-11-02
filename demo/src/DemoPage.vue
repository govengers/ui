<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { demos } from './demos'

const props = defineProps<{ group: string; name: string }>()
const demo = computed(() => demos.find(item => item.group === props.group && item.name === props.name))
const view = computed(() => (demo.value ? defineAsyncComponent(demo.value.load) : null))
</script>

<template>
  <article v-if="demo" class="demo" :data-demo="demo.name">
    <header class="head">
      <h1>{{ demo.name }}</h1>
      <a :href="`https://github.com/govengers/ui/blob/main/${demo.group}/${demo.name}/${demo.name}.md`" class="card-link">card</a>
    </header>
    <component :is="view" :key="demo.name" />
  </article>
  <p v-else>No demo named {{ name }} in {{ group }}.</p>
</template>

<style scoped>
.head { display: flex; align-items: baseline; gap: var(--ui-space-4); margin-bottom: var(--ui-space-6); }
h1 { font-size: var(--ui-text-xl); }
.card-link { font-size: var(--ui-text-sm); }
.demo :deep(section) { margin-bottom: var(--ui-space-8); }
.demo :deep(section > h2) { font-size: var(--ui-text-sm); text-transform: uppercase; letter-spacing: var(--ui-tracking-caps); color: var(--ui-muted); margin-bottom: var(--ui-space-3); }
</style>
