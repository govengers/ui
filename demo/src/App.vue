<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import Icon from '../../ui/Icon/Icon.vue'
import { demos } from './demos'
import { density, preset, presets, theme } from './presets'

const groups = computed(() => {
  const out = new Map<string, typeof demos>()
  for (const demo of demos) out.set(demo.group, [...(out.get(demo.group) ?? []), demo])
  return [...out.entries()]
})
const groupTitle: Record<string, string> = { ui: 'Components', 'ui/blocks': 'Blocks', pages: 'Page recipes' }
</script>

<template>
  <div class="shell">
    <header class="top">
      <RouterLink to="/" class="brand"><Icon name="sparkles" /> govengers/ui</RouterLink>
      <div class="controls">
        <label>Preset
          <select v-model="preset">
            <option v-for="name in presets" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <label>Theme
          <select v-model="theme">
            <option value="auto">auto</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label>Density
          <select v-model="density">
            <option value="comfortable">comfortable</option>
            <option value="compact">compact</option>
          </select>
        </label>
      </div>
    </header>
    <nav class="side" aria-label="Demos">
      <template v-for="[group, items] in groups" :key="group">
        <h2>{{ groupTitle[group] ?? group }}</h2>
        <RouterLink v-for="demo in items" :key="demo.name" :to="`/${demo.group}/${demo.name}`">{{ demo.name }}</RouterLink>
      </template>
    </nav>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: var(--ui-sidebar-w) 1fr;
  grid-template-rows: var(--ui-topbar-h) 1fr;
  min-height: 100vh;
}
.top {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--ui-space-4);
  background: var(--ui-chrome);
  color: var(--ui-on-chrome);
  position: sticky;
  top: 0;
  z-index: var(--ui-z-sticky);
}
.brand { display: inline-flex; align-items: center; gap: var(--ui-space-2); color: inherit; text-decoration: none; font-weight: var(--ui-weight-semibold); }
.controls { display: flex; gap: var(--ui-space-4); font-size: var(--ui-text-sm); }
.controls label { display: inline-flex; align-items: center; gap: var(--ui-space-2); }
.controls select { background: var(--ui-surface); color: var(--ui-ink); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-control); padding: var(--ui-space-1) var(--ui-space-2); }
.side {
  display: flex;
  flex-direction: column;
  padding: var(--ui-space-4);
  border-right: var(--ui-border-width) solid var(--ui-divider);
  background: var(--ui-surface);
  position: sticky;
  top: var(--ui-topbar-h);
  height: calc(100vh - var(--ui-topbar-h));
  overflow: auto;
}
.side h2 { font-size: var(--ui-text-xs); text-transform: uppercase; letter-spacing: var(--ui-tracking-caps); color: var(--ui-muted); margin: var(--ui-space-4) 0 var(--ui-space-2); }
.side a { color: var(--ui-ink-2); text-decoration: none; padding: var(--ui-space-1) var(--ui-space-2); border-radius: var(--ui-radius-sm); font-size: var(--ui-text-sm); }
.side a:hover { background: var(--ui-surface-2); color: var(--ui-ink); }
.side a.router-link-active { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
/* min-width 0: a demo wider than the column overflows inside it, where it shows, instead of widening the page. */
.main { padding: var(--ui-page-p); max-width: var(--ui-page-max); width: 100%; min-width: 0; }
@media (max-width: 48rem) {
  .shell { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .top { flex-wrap: wrap; padding: var(--ui-space-2) var(--ui-space-3); gap: var(--ui-space-2); position: static; }
  .controls { gap: var(--ui-space-2); flex-wrap: wrap; }
  .side { position: static; height: auto; border-right: 0; border-bottom: var(--ui-border-width) solid var(--ui-divider); }
}
</style>
