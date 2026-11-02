<script setup lang="ts">
// Button: the one button (D22). Variants and sizes are attributes (D41). Renders a RouterLink
// with `to`, an anchor with `href`, else a <button>. `data-action` passes through to the root.
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Icon from '../Icon/Icon.vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** Accessible name for an icon-only button (no default slot). */
  label?: string | undefined
  to?: RouteLocationRaw | undefined
  href?: string | undefined
}>(), { variant: 'secondary', size: 'md', type: 'button' })

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const inert = computed(() => props.disabled || props.loading)

/** A link cannot be disabled natively: swallow the click while inert. */
function guard(event: MouseEvent): void {
  if (inert.value && tag.value !== 'button') {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
}
</script>

<template>
  <component
    :is="tag"
    class="ui-button"
    :data-variant="variant"
    :data-size="size"
    :data-block="block || undefined"
    :type="tag === 'button' ? type : undefined"
    :to="to"
    :href="href"
    :disabled="tag === 'button' ? inert : undefined"
    :aria-disabled="tag !== 'button' && inert ? 'true' : undefined"
    :aria-busy="loading || undefined"
    :aria-label="label"
    @click.capture="guard"
  >
    <Icon v-if="loading" name="loader" class="ui-button__spinner" />
    <slot v-else name="icon" />
    <span v-if="$slots.default" class="ui-button__label"><slot /></span>
  </component>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  min-height: var(--ui-control-h);
  min-width: var(--ui-control-h);
  padding: 0 var(--ui-control-px);
  border: var(--ui-border-width) solid transparent;
  border-radius: var(--ui-radius-control);
  font-weight: var(--ui-weight-medium);
  font-size: var(--ui-text-sm);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--ui-duration-fast) var(--ui-ease), border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-button[data-size="sm"] { min-height: var(--ui-control-h-sm); min-width: var(--ui-control-h-sm); padding: 0 var(--ui-space-2); font-size: var(--ui-text-xs); }
.ui-button[data-size="lg"] { min-height: var(--ui-control-h-lg); min-width: var(--ui-control-h-lg); padding: 0 var(--ui-space-4); font-size: var(--ui-text-md); }
.ui-button[data-block] { display: flex; width: 100%; }

.ui-button[data-variant="primary"] { background: var(--ui-accent); color: var(--ui-on-accent); }
.ui-button[data-variant="primary"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-accent-hover); }
.ui-button[data-variant="secondary"] { background: var(--ui-surface); color: var(--ui-ink); border-color: var(--ui-border-strong); }
.ui-button[data-variant="secondary"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-surface-2); }
.ui-button[data-variant="ghost"] { background: transparent; color: var(--ui-ink-2); }
.ui-button[data-variant="ghost"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-surface-2); color: var(--ui-ink); }
.ui-button[data-variant="danger"] { background: var(--ui-danger); color: var(--ui-on-danger); }
.ui-button[data-variant="danger"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-danger-hover); }

.ui-button:disabled, .ui-button[aria-disabled] { cursor: not-allowed; opacity: var(--ui-disabled-opacity); }
.ui-button__spinner { animation: ui-spin 0.8s linear infinite; }
@keyframes ui-spin { to { transform: rotate(360deg); } }
</style>
