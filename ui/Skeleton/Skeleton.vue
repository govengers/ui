<script setup lang="ts">
// Skeleton: a shimmering placeholder while data loads, shown after --ui-loading-delay. Hidden from
// assistive technology; the container that loads says aria-busy. width and height are the one
// place inline style is allowed.
withDefaults(defineProps<{
  shape?: 'text' | 'circle' | 'rect' | undefined
  /** For `text`: the number of bars; the last of several is 60% wide. */
  lines?: number | undefined
  /** A CSS length, e.g. `12rem` or `40%`. */
  width?: string | undefined
  /** A CSS length; a circle with only a width stays round. */
  height?: string | undefined
}>(), { shape: 'text', lines: 1 })
</script>

<template>
  <span class="ui-skeleton" :data-shape="shape" :style="{ width, height }" aria-hidden="true">
    <template v-if="shape === 'text'">
      <span v-for="line in lines" :key="line" class="ui-skeleton__line" />
    </template>
  </span>
</template>

<style scoped>
.ui-skeleton { display: block; }
.ui-skeleton[data-shape="text"] { display: flex; flex-direction: column; gap: 0.75em; padding-block: 0.375em; }
.ui-skeleton[data-shape="circle"] { flex: none; width: var(--ui-control-h); aspect-ratio: 1; border-radius: var(--ui-radius-pill); }
.ui-skeleton[data-shape="rect"] { width: 100%; height: var(--ui-space-16); border-radius: var(--ui-radius-control); }
.ui-skeleton__line { height: 0.75em; border-radius: var(--ui-radius-sm); }
.ui-skeleton__line:last-child:not(:first-child) { width: 60%; }

/* The band sits outside the visible third at rest, so reduced motion shows a flat surface. */
.ui-skeleton__line,
.ui-skeleton[data-shape="circle"],
.ui-skeleton[data-shape="rect"] {
  background: linear-gradient(90deg, var(--ui-skeleton) 40%, var(--ui-skeleton-shine) 50%, var(--ui-skeleton) 60%) 100% 0 / 300% 100%;
}
.ui-skeleton__line { animation: ui-skeleton-shimmer 1.5s linear infinite; }

/* Hidden for --ui-loading-delay with its box reserved, so a fast answer shows no placeholder.
   base.css shortens durations under reduced motion, never this delay. */
.ui-skeleton { animation: ui-skeleton-appear 0s var(--ui-loading-delay) backwards; }
.ui-skeleton[data-shape="circle"],
.ui-skeleton[data-shape="rect"] {
  animation: ui-skeleton-appear 0s var(--ui-loading-delay) backwards, ui-skeleton-shimmer 1.5s linear infinite;
}
@keyframes ui-skeleton-appear { from { visibility: hidden; } }
@keyframes ui-skeleton-shimmer { to { background-position: 0 0; } }
</style>
