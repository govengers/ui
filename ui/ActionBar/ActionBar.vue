<script setup lang="ts">
// ActionBar: the sticky row of a form's actions (save, cancel). It must come AFTER the content
// in DOM order: position sticky only engages with preceding scrollable content.
withDefaults(defineProps<{
  /** Sticks to the bottom of the viewport while the form scrolls. */
  sticky?: boolean | undefined
  align?: 'start' | 'end' | 'between' | undefined
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
/* Above what else sticks to the bottom: AppShell's phone bar sets --ui-sticky-bottom. */
.ui-action-bar[data-sticky] { position: sticky; bottom: var(--ui-sticky-bottom, 0px); z-index: var(--ui-z-sticky); }
/* A field the browser (native validation), a script or Tab focuses scrolls clear of the bar and of
   what it stands on, with a little room for the field's error line (WCAG 2.2 SC 2.4.11): the scroll
   padding of the box the bar sticks in. The page's, unless the bar sits in a dialog or a popover,
   whose bodies scroll themselves; a body that sets --ui-sticky-bottom below 0 (flush) pads 0. */
:global(:root:has(.ui-action-bar[data-sticky]:not(dialog *, [popover] *))),
:global(:is(.ui-dialog__body, .ui-sheet__body):has(.ui-action-bar[data-sticky])) {
  scroll-padding-bottom: calc(max(0px, var(--ui-sticky-bottom, 0px)) + var(--ui-control-h) + 3 * var(--ui-space-3) + var(--ui-border-width));
}
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
