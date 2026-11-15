<script setup lang="ts">
import { releases } from '@/fake/changelog'
import Changelog from './Changelog.vue'
</script>

<template>
  <section id="changelog">
    <h2>The demo's changelog, running 2.4.1</h2>
    <div class="frame"><Changelog :releases="releases" version="2.4.1" /></div>
  </section>
  <section>
    <h2>Empty</h2>
    <div class="frame"><Changelog :releases="[]" /></div>
  </section>
</template>

<style scoped>
/* DemoPage spaces every demo <section>; a Card rendered as a section inside the page must not get that margin. */
.frame :deep(section) { margin-bottom: 0; }
.frame { background: var(--ui-bg); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
</style>
