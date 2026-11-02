<script setup lang="ts">
// Badge: an inline label for a status, a count or a tag. Soft tokens per variant (D36), variant
// and size as attributes (D41). The dot repeats the variant in its strong colour.
withDefaults(defineProps<{
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | undefined
  size?: 'sm' | 'md' | undefined
  dot?: boolean | undefined
  pill?: boolean | undefined
}>(), { variant: 'neutral', size: 'md' })
</script>

<template>
  <span class="ui-badge" :data-variant="variant" :data-size="size" :data-pill="pill || undefined">
    <span v-if="dot" class="ui-badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-1);
  min-height: var(--ui-space-6);
  min-width: var(--ui-space-6);
  padding: 0 var(--ui-space-2);
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-medium);
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
}
.ui-badge[data-size="sm"] { min-height: var(--ui-space-5); min-width: var(--ui-space-5); padding: 0 var(--ui-space-1); }
.ui-badge[data-pill] { border-radius: var(--ui-radius-pill); padding: 0 var(--ui-space-2); }

.ui-badge[data-variant="neutral"] { background: var(--ui-surface-2); color: var(--ui-ink-2); }
.ui-badge[data-variant="accent"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-badge[data-variant="success"] { background: var(--ui-success-soft); color: var(--ui-on-success-soft); }
.ui-badge[data-variant="warning"] { background: var(--ui-warning-soft); color: var(--ui-on-warning-soft); }
.ui-badge[data-variant="danger"] { background: var(--ui-danger-soft); color: var(--ui-on-danger-soft); }

.ui-badge__dot { width: 0.5em; height: 0.5em; border-radius: var(--ui-radius-pill); background: var(--ui-muted); }
.ui-badge[data-variant="accent"] .ui-badge__dot { background: var(--ui-accent); }
.ui-badge[data-variant="success"] .ui-badge__dot { background: var(--ui-success); }
.ui-badge[data-variant="warning"] .ui-badge__dot { background: var(--ui-warning); }
.ui-badge[data-variant="danger"] .ui-badge__dot { background: var(--ui-danger); }
</style>
