<script setup lang="ts">
import { onUnmounted } from 'vue'
import { engine } from '@/fake/live'
import Dashboard from './Dashboard.vue'

// A random change every two seconds, so the tiles and the recent orders move.
const ticker = setInterval(() => engine.store.tick(), 2000)
onUnmounted(() => clearInterval(ticker))
</script>

<template>
  <section>
    <h2>The page, framed; a random change every two seconds</h2>
    <div class="frame"><Dashboard /></div>
  </section>
</template>

<style scoped>
/* DemoPage spaces every demo <section>; a Card rendered as a section inside the page must not get that margin. */
.frame :deep(section) { margin-bottom: 0; }
.frame { background: var(--ui-bg); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
</style>
