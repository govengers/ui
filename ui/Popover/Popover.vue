<script setup lang="ts">
// Popover: a panel anchored to its trigger, on the native popover attribute (D9): light dismiss,
// Escape and focus return come from the platform. Script places it with place.ts (below if it
// fits, above if only that fits, else the roomier side, scrolling) and follows the trigger every
// frame while open. Menu and every block with a custom dropdown (filters, pickers) build on it.
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { place as placePanel } from './place'

const props = withDefaults(defineProps<{
  placement?: 'auto' | 'bottom' | 'top' | undefined
  /** Which edge of the panel lines up with the trigger. */
  align?: 'start' | 'end' | undefined
  /** The panel is at least as wide as the trigger (selects, pickers). */
  matchWidth?: boolean | undefined
  role?: 'dialog' | 'menu' | 'listbox' | undefined
  /** The panel's accessible name. */
  label?: string | undefined
  /** Move focus to the first focusable element in the panel on open. */
  autofocus?: boolean | undefined
}>(), { placement: 'auto', align: 'start', role: 'dialog' })

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ open: []; close: [] }>()

const id = useId()
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const expanded = computed(() => ({ 'aria-expanded': open.value, 'aria-haspopup': props.role, 'aria-controls': id }))
const gap = 4
const focusable = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

function isOpen() {
  return panel.value?.matches(':popover-open') ?? false
}

// A press on the trigger while the panel is open closes it by light dismiss before the click
// arrives; without this the click would open it again. A key press starts a fresh gesture.
let openOnPress = false
function onPress(event: PointerEvent) {
  openOnPress = isOpen() && !panel.value?.contains(event.target as Node)
}
function onKey() {
  openOnPress = false
}

function show() {
  if (!panel.value || isOpen()) return
  panel.value.showPopover()
  place()
  if (props.autofocus) panel.value.querySelector<HTMLElement>(focusable)?.focus({ preventScroll: true })
}

function hide() {
  if (isOpen()) panel.value?.hidePopover()
}

/** Tab leaving the panel and the trigger closes it, as light dismiss does for a click outside. */
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && !root.value?.contains(next)) hide()
}

function toggle() {
  const wasOpen = openOnPress || isOpen()
  openOnPress = false
  if (wasOpen) hide()
  else show()
}

watch(open, value => (value ? show() : hide()))
onMounted(() => {
  if (open.value) show()
})

// The anchor is the trigger slot's root element (the wrapper is display: contents).
function place() {
  const anchor = root.value?.firstElementChild
  const element = panel.value
  if (!anchor || !element || anchor === element) return
  placePanel(anchor, element, { placement: props.placement, align: props.align, matchWidth: props.matchWidth, gap })
}

// While open, re-place every frame: covers scroll (of any container), resize, and a live update
// that moves the trigger's row. Two rect reads per frame, only while a popover is open.
let frame = 0
function follow() {
  place()
  frame = requestAnimationFrame(follow)
}
onBeforeUnmount(() => cancelAnimationFrame(frame))

// Every way of opening and closing (toggle, v-model, light dismiss, Escape) ends here.
function onToggle(event: Event) {
  const opened = (event as ToggleEvent).newState === 'open'
  cancelAnimationFrame(frame)
  if (opened) frame = requestAnimationFrame(follow)
  open.value = opened
  if (opened) emit('open')
  else emit('close')
}

defineExpose({ open: show, close: hide, toggle, panel })
</script>

<template>
  <div ref="root" class="ui-popover" @pointerdown="onPress" @keydown="onKey" @focusout="onFocusOut">
    <slot name="trigger" :open="open" :toggle="toggle" :close="hide" :expanded="expanded" />
    <div :id="id" ref="panel" popover class="ui-popover__panel" :role="role" :aria-label="label" @toggle="onToggle">
      <slot :close="hide" />
    </div>
  </div>
</template>

<style scoped>
/* No box of its own: the trigger lays out as if it were the parent's child (full-width fields). */
.ui-popover { display: contents; }

/* The UA centres a popover (inset: 0, margin: auto); the script sets top, left and max-height. */
.ui-popover__panel {
  inset: auto;
  z-index: var(--ui-z-overlay);
  width: max-content;
  max-width: calc(100vw - 2 * var(--ui-space-2));
  margin: 0;
  padding: 0;
  overflow: auto;
  overscroll-behavior: contain;
  background: var(--ui-surface);
  color: var(--ui-ink);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--ui-shadow-md);
}
</style>
