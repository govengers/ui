<script setup lang="ts">
// Tooltip: one plain sentence on hover and keyboard focus (D90, APG Tooltip pattern). It wraps one
// element (the default slot) or, without a slot, sits inside its trigger. The panel is a manual
// popover rendered only while shown and placed by Popover's place.ts; touch shows nothing.
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useId, useSlots } from 'vue'
import { boxed, place } from '../Popover/place'
import { claim, focusVisible, modalOpening, release, tooltipDelay, tooltipGrace } from './tooltip'

const props = withDefaults(defineProps<{
  text: string
  /** description: the trigger's aria-describedby names the panel. label: the trigger names itself, the panel is hidden from assistive technology. */
  kind?: 'description' | 'label' | undefined
  placement?: 'auto' | 'bottom' | 'top' | 'end' | undefined
}>(), { kind: 'description', placement: 'auto' })

const slots = useSlots()
const id = useId()
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const shown = ref(false)
const gap = 4
let trigger: Element | null = null
let delay: ReturnType<typeof setTimeout> | undefined
let grace: ReturnType<typeof setTimeout> | undefined
let frame = 0
/** Shown by keyboard focus: it stays until blur or Escape, wherever the pointer goes (APG). */
let focused = false
/** A pointer pressed the trigger: hover shows nothing until it left, so nothing comes back over what the press opened. */
let pressed = false

function onOver(event: PointerEvent) {
  if (event.pointerType === 'touch' || pressed) return
  clearTimeout(grace)
  if (!shown.value && delay === undefined) delay = setTimeout(show, tooltipDelay)
}

// pointerover and pointerout bubble: a move between children of the trigger or onto the panel is no leave.
function onOut(event: PointerEvent) {
  const next = event.relatedTarget as Node | null
  if (next && (trigger?.contains(next) || panel.value?.contains(next))) return
  pressed = false
  clearTimeout(delay)
  delay = undefined
  if (shown.value && !focused) {
    clearTimeout(grace)
    grace = setTimeout(hide, tooltipGrace)
  }
}

function keep() {
  clearTimeout(grace)
}

// A press on the panel, a child of the trigger in the inside form, leaves the pointer off the trigger.
function onPress(event: PointerEvent) {
  pressed = !panel.value?.contains(event.target as Node)
  hide()
}

// The trigger's own menu or popover is open (Popover binds aria-haspopup and aria-expanded on it):
// a tooltip would lie over it and take the first Escape.
function popupOpen() {
  return !!trigger?.hasAttribute('aria-haspopup') && trigger.getAttribute('aria-expanded') === 'true'
}

function onFocusIn(event: FocusEvent) {
  if (!trigger || popupOpen() || !focusVisible(event.target as Element) || modalOpening(trigger, event.relatedTarget as Node | null)) return
  focused = true
  void show()
}

function onFocusOut(event: FocusEvent) {
  if (!trigger?.contains(event.relatedTarget as Node | null)) hide()
}

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  // Cancelled, so a modal dialog or a popover under the tooltip stays for the next Escape.
  event.preventDefault()
  hide()
}

// The trigger's own ids stay; the panel's id is in the list only while the panel exists.
function describe(on: boolean) {
  if (!trigger) return
  const ids = (trigger.getAttribute('aria-describedby') ?? '').split(' ').filter(token => token && token !== id)
  if (on) ids.push(id)
  if (ids.length > 0) trigger.setAttribute('aria-describedby', ids.join(' '))
  else trigger.removeAttribute('aria-describedby')
}

// While shown, re-place every frame, as Popover does: the trigger may scroll or move.
function follow() {
  if (trigger && panel.value) place(trigger, panel.value, { placement: props.placement, align: 'start', matchWidth: false, gap })
  frame = requestAnimationFrame(follow)
}

async function show() {
  clearTimeout(delay)
  delay = undefined
  clearTimeout(grace)
  if (shown.value || popupOpen()) return
  claim(hide)
  shown.value = true
  // Capture: a piece that stops Escape on its way up must not keep the tooltip open.
  document.addEventListener('keydown', onKey, true)
  await nextTick()
  if (!shown.value || !panel.value) return
  panel.value.showPopover()
  if (props.kind === 'description') describe(true)
  // A show, hide and show in one task reaches this line twice: one loop only.
  cancelAnimationFrame(frame)
  follow()
}

function hide() {
  clearTimeout(delay)
  delay = undefined
  clearTimeout(grace)
  focused = false
  if (!shown.value) return
  shown.value = false
  release(hide)
  document.removeEventListener('keydown', onKey, true)
  cancelAnimationFrame(frame)
  describe(false)
}

// Listeners sit on the trigger itself, never on a common ancestor, so they hold in both forms. A
// click is a press by any means: Enter and Space hide it too.
function listen(element: Element, add: boolean) {
  for (const [type, listener] of [['pointerover', onOver], ['pointerout', onOut], ['focusin', onFocusIn], ['focusout', onFocusOut], ['pointerdown', onPress], ['click', hide]] as const) {
    if (add) element.addEventListener(type, listener as EventListener)
    else element.removeEventListener(type, listener as EventListener)
  }
}

// The trigger: the slot's first element with a box, or the element this Tooltip sits in. Checked
// again after every render, so a slot that swaps its element keeps its tooltip.
function bind() {
  const first = root.value?.firstElementChild
  const found = (slots.default ? first && boxed(first) : root.value?.parentElement) ?? null
  const next = found === panel.value ? null : found
  if (next === trigger) return
  hide()
  if (trigger) listen(trigger, false)
  trigger = next
  pressed = false
  if (trigger) listen(trigger, true)
}

onMounted(bind)
onUpdated(bind)
onBeforeUnmount(() => {
  hide()
  if (trigger) listen(trigger, false)
  trigger = null
})
</script>

<template>
  <span ref="root" class="ui-tooltip">
    <slot />
    <span
      v-if="shown"
      :id="id"
      ref="panel"
      popover="manual"
      role="tooltip"
      class="ui-tooltip__panel"
      :style="{ '--ui-tooltip-gap': `${gap}px` }"
      :aria-hidden="kind === 'label' || !$slots.default ? 'true' : undefined"
      @pointerover="keep"
      @pointerout="onOut"
      @pointerdown="hide"
    >{{ text }}</span>
  </span>
</template>

<style scoped>
/* No box of its own: in the wrapper form the trigger lays out as the parent's child. */
.ui-tooltip { display: contents; }

/* The UA centres a popover (inset: 0, margin: auto); place.ts sets top and left. Inside a button
   or a table header the panel would inherit their font, colour and case, so it sets them. The
   panel inverts the page (D106): on the Card, Dialog or Table it mostly sits on, a surface ground
   would match what is under it. The border is the page's surface colour: an edge where the panel
   meets the top bar's chrome, which equals the ink in light themes; forced colours draw it too. */
.ui-tooltip__panel {
  inset: auto;
  z-index: var(--ui-z-overlay);
  width: max-content;
  max-width: var(--ui-tooltip-w);
  margin: 0;
  padding: var(--ui-space-1) var(--ui-space-2);
  background: var(--ui-ink);
  color: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-surface);
  border-radius: var(--ui-radius-control);
  box-shadow: var(--ui-shadow-md);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-normal);
  line-height: var(--ui-leading);
  letter-spacing: normal;
  text-align: start;
  text-transform: none;
  white-space: normal;
  overflow-wrap: anywhere;
  overflow: visible;
}

/* A bridge over the gap to the trigger is part of the panel, so a pointer of any speed reaches it
   (WCAG 2.2 SC 1.4.13, hoverable). Its depth is the script's gap (--ui-tooltip-gap, set on the
   panel from the same constant place.ts gets) plus the border, at any root font size; it lives as
   long as the panel and a press on it hides the panel. */
.ui-tooltip__panel::before { content: ""; position: absolute; }
.ui-tooltip__panel[data-placement="bottom"]::before { inset: calc(-1 * (var(--ui-tooltip-gap) + var(--ui-border-width))) 0 100%; }
.ui-tooltip__panel[data-placement="top"]::before { inset: 100% 0 calc(-1 * (var(--ui-tooltip-gap) + var(--ui-border-width))); }
.ui-tooltip__panel[data-placement="end"]::before { inset-block: 0; inset-inline: calc(-1 * (var(--ui-tooltip-gap) + var(--ui-border-width))) 100%; }
.ui-tooltip__panel[data-placement="start"]::before { inset-block: 0; inset-inline: 100% calc(-1 * (var(--ui-tooltip-gap) + var(--ui-border-width))); }
</style>
