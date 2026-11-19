<script setup lang="ts">
// Button: the one button (D22). Variants and sizes are attributes (D41). Renders a RouterLink
// with `to`, an anchor with `href`, else a <button>. `data-action` passes through to the root.
// Only the attributes of the chosen form are bound: an `href: undefined` fallthrough would
// override RouterLink's own href and leave the link without one. A loading Button keeps its
// focus and swallows clicks, and so does one disabled while it holds the focus, until the focus
// leaves (D91); an icon-only Button shows its `label` through Tooltip.
import { computed, ref, watch } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Icon from '../Icon/Icon.vue'
import Tooltip from '../Tooltip/Tooltip.vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | undefined
  size?: 'sm' | 'md' | 'lg' | undefined
  type?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean | undefined
  loading?: boolean | undefined
  block?: boolean | undefined
  /** Accessible name for an icon-only button (no default slot), shown as its tooltip. */
  label?: string | undefined
  to?: RouteLocationRaw | undefined
  href?: string | undefined
}>(), { variant: 'secondary', size: 'md', type: 'button' })

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const root = ref<unknown>(null)
/**
 * Disabled while it held the focus (a load that ends with `disabled` set): native disabled would drop
 * the focus to the page, so it stays aria-disabled and guarded until the focus leaves. Sync: the
 * focus is read before the render that would disable it.
 */
const held = ref(false)
watch(() => props.disabled && !props.loading, (off) => {
  held.value = off && root.value instanceof HTMLButtonElement && root.value === document.activeElement
}, { flush: 'sync' })
/** Native disabled drops the focus to the page: only for `disabled` on a <button> that does not hold it, and loading wins. */
const native = computed(() => tag.value === 'button' && props.disabled && !props.loading && !held.value)
/** Loading in every form, a disabled link, which cannot be disabled natively, and a held button: aria-disabled and the guard. */
const inert = computed(() => props.loading || (props.disabled && !native.value))

/** The focus left. A blur while it is still the document's focus is the window losing focus: the hold stays. */
function release(event: FocusEvent): void {
  if (event.target !== document.activeElement) held.value = false
}

/**
 * Swallows the click while loading or disabled. A form's implicit submit (Enter in a field) is a
 * click on its submit button, so it stops that too; a middle click on a link is an auxclick. It
 * reads the props, not `inert`: a blur ends the hold one render before `disabled` reaches the DOM.
 */
function guard(event: MouseEvent): void {
  if (!props.loading && !props.disabled) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
</script>

<template>
  <component
    :is="tag"
    ref="root"
    class="ui-button"
    :data-variant="variant"
    :data-size="size"
    :data-block="block || undefined"
    :data-state="loading ? 'loading' : undefined"
    v-bind="tag === 'button' ? { type } : tag === 'a' ? { href } : { to }"
    :disabled="native || undefined"
    :aria-disabled="inert ? 'true' : undefined"
    :aria-busy="loading || undefined"
    :aria-label="label"
    @click.capture="guard"
    @auxclick.capture="guard"
    @blur="release"
  >
    <slot name="icon" />
    <span v-if="$slots.default" class="ui-button__label"><slot /></span>
    <Icon v-if="loading" name="loader" class="ui-button__spinner" />
    <Tooltip v-if="label && !$slots.default" :text="label" kind="label" />
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
.ui-button[data-variant="secondary"] { background: var(--ui-surface); color: var(--ui-ink); border-color: var(--ui-border-strong); }
/* A surrounding that changes the ground (AppShell's top bar) sets the ghost ink at rest (D102). */
.ui-button[data-variant="ghost"] { background: transparent; color: var(--ui-button-ghost-ink, var(--ui-ink-2)); }
.ui-button[data-variant="danger"] { background: var(--ui-danger); color: var(--ui-on-danger); }
@media (hover: hover) {
  .ui-button[data-variant="primary"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-accent-hover); }
  .ui-button[data-variant="secondary"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-surface-2); }
  .ui-button[data-variant="ghost"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-surface-2); color: var(--ui-ink); }
  .ui-button[data-variant="danger"]:hover:not(:disabled, [aria-disabled]) { background: var(--ui-danger-hover); }
}
/* Pressed (D104): one colour step past hover, nothing moves. Secondary and ghost set the ink too:
   a ghost Button on a ground that sets its ink at rest (the top bar, D102) gets no hover rule
   before a press on a touch screen. Same specificity as hover, so these win by order. The press
   shows in its first frame, without the fade: a fading ground under ink that flips at once would
   hide the label for a frame on the top bar, where the ink turns from light to dark. */
.ui-button:active:not(:disabled, [aria-disabled]) { transition: none; }
.ui-button[data-variant="primary"]:active:not(:disabled, [aria-disabled]) { background: var(--ui-accent-active); }
.ui-button:is([data-variant="secondary"], [data-variant="ghost"]):active:not(:disabled, [aria-disabled]) { background: var(--ui-surface-3); color: var(--ui-ink); }
.ui-button[data-variant="danger"]:active:not(:disabled, [aria-disabled]) { background: var(--ui-danger-active); }

.ui-button:disabled, .ui-button[aria-disabled]:not([data-state="loading"]) { cursor: not-allowed; opacity: var(--ui-disabled-opacity); }
/* A held Button and a focused disabled link have the focus: the ring is never dimmed (WCAG 2.2 SC
   2.4.7, 3:1 by SC 1.4.11). The dimming moves from the element to its fill, border and content, to
   the look the element's opacity gives: a fill at the disabled opacity over the page is that look;
   the content of a filled Button is the page's colour (on-accent, on-danger), so it already reads
   so over that fill and stays; the content of the others, which sit on the page, dims. */
.ui-button[aria-disabled]:focus-visible:not([data-state="loading"]) { opacity: 1; }
.ui-button[aria-disabled]:focus-visible:not([data-state="loading"], [data-variant="primary"], [data-variant="danger"]) > :deep(:not(.ui-tooltip)) { opacity: var(--ui-disabled-opacity); }
.ui-button[data-variant="primary"][aria-disabled]:focus-visible:not([data-state="loading"]) { background: color-mix(in srgb, var(--ui-accent) calc(var(--ui-disabled-opacity) * 100%), transparent); }
.ui-button[data-variant="secondary"][aria-disabled]:focus-visible:not([data-state="loading"]) { background: color-mix(in srgb, var(--ui-surface) calc(var(--ui-disabled-opacity) * 100%), transparent); border-color: color-mix(in srgb, var(--ui-border-strong) calc(var(--ui-disabled-opacity) * 100%), transparent); }
.ui-button[data-variant="danger"][aria-disabled]:focus-visible:not([data-state="loading"]) { background: color-mix(in srgb, var(--ui-danger) calc(var(--ui-disabled-opacity) * 100%), transparent); }

/* Loading (D91): the content keeps its place and stays the accessible name, so the width never
   changes. After --ui-loading-delay the spinner shows over it and the content turns invisible, both
   at once, so a fast answer shows nothing. Opacity, not a transparent colour: forced colours (Windows
   contrast themes) override colours and would paint the label under the spinner. Never visibility
   or display on the content. */
.ui-button[data-state="loading"] { position: relative; cursor: progress; }
.ui-button[data-state="loading"] > :deep(:not(.ui-button__spinner, .ui-tooltip)) { animation: ui-button-cover 0s var(--ui-loading-delay) forwards; }
.ui-button__spinner {
  position: absolute;
  inset: 0;
  margin: auto;
  animation: ui-button-wait 0s var(--ui-loading-delay) backwards, ui-spin 0.8s linear infinite;
}
@keyframes ui-button-cover { to { opacity: 0; } }
@keyframes ui-button-wait { from { visibility: hidden; } }
@keyframes ui-spin { to { transform: rotate(360deg); } }
</style>
