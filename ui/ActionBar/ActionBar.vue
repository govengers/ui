<script setup lang="ts">
// ActionBar: the sticky row of a form's actions (save, cancel). It must come AFTER the content
// in DOM order: position sticky only engages with preceding scrollable content (Paloma lesson).
withDefaults(defineProps<{
  /** Sticks to the bottom of the viewport while the form scrolls. */
  sticky?: boolean
  align?: 'start' | 'end' | 'between'
}>(), { sticky: true, align: 'end' })
</script>

<template>
  <div class="ui-action-bar" :data-sticky="sticky || undefined" :data-align="align">
    <div v-if="$slots.lead" class="ui-action-bar__lead"><slot name="lead" /></div>
    <div class="ui-action-bar__actions"><slot /></div>
  </div>
</template>

<style scoped>
.ui-action-bar {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  padding: var(--ui-space-3) 0;
  background: var(--ui-bg);
  border-top: var(--ui-border-width) solid var(--ui-divider);
}
.ui-action-bar[data-sticky] { position: sticky; bottom: 0; z-index: var(--ui-z-sticky); }
.ui-action-bar[data-align="end"] { justify-content: flex-end; }
.ui-action-bar[data-align="start"] { justify-content: flex-start; }
.ui-action-bar[data-align="between"] { justify-content: space-between; }
.ui-action-bar__lead { color: var(--ui-muted); font-size: var(--ui-text-sm); margin-right: auto; }
.ui-action-bar__actions { display: flex; gap: var(--ui-space-2); flex-wrap: wrap; }
@media (max-width: 48rem) {
  .ui-action-bar[data-sticky] { margin: 0 calc(-1 * var(--ui-page-p)); padding: var(--ui-space-3) var(--ui-page-p); }
  .ui-action-bar__actions { width: 100%; }
  .ui-action-bar__actions > :deep(*) { flex: 1; }
}
</style>
