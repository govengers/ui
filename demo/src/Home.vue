<script setup lang="ts">
import { demos } from './demos'
</script>

<template>
  <h1>govengers/ui</h1>
  <p class="lead">
    Browsable, copy-paste Vue components, blocks and page recipes. Switch the preset, theme and
    density in the top bar; every piece on the left follows. Nothing here is a package: a coding
    agent copies the directory it needs into the target project's <code>src/ui/</code>.
  </p>
  <p class="muted">{{ demos.length }} demos. Start with the card next to each component: <code>ui/&lt;Name&gt;/&lt;Name&gt;.md</code>.</p>
</template>

<style scoped>
h1 { font-size: var(--ui-text-2xl); margin-bottom: var(--ui-space-4); }
.lead { max-width: var(--ui-content-max); font-size: var(--ui-text-lg); color: var(--ui-ink-2); margin-bottom: var(--ui-space-4); }
.muted { color: var(--ui-muted); }
</style>
