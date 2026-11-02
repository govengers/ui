<script setup lang="ts">
// Popover: a panel anchored to its trigger, on the native popover attribute (D9): light dismiss,
// Escape and focus return come from the platform. Script places it (below if it fits, above if
// only that fits, else the roomier side, scrolling) and follows the trigger every frame while
// open. Menu and every block with a custom dropdown (filters, pickers) build on it.
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

// The anchor is the trigger slot's root element (the wrapper is display: contents). Inline style
// straight on the element: placing every frame must not re-render the component.
function place() {
  const anchor = root.value?.firstElementChild
  const element = panel.value
  if (!anchor || !element || anchor === element) return
  const box = anchor.getBoundingClientRect()
  if (props.matchWidth) element.style.minWidth = `${box.width}px`
  const size = element.getBoundingClientRect()
  const { clientWidth: width, clientHeight: height } = document.documentElement
  const roomBelow = height - box.bottom - 2 * gap
  const roomAbove = box.top - 2 * gap
  // auto: below if it fits, above if only that fits, else the roomier side with a scrolling panel.
  const below = props.placement === 'bottom'
    || (props.placement === 'auto' && (size.height <= roomBelow || roomBelow >= roomAbove))
  const room = below ? roomBelow : roomAbove
  const left = props.align === 'end' ? box.right - size.width : box.left
  element.dataset.placement = below ? 'bottom' : 'top'
  element.style.maxHeight = `${room}px`
  element.style.top = `${below ? box.bottom + gap : box.top - gap - Math.min(size.height, room)}px`
  element.style.left = `${clamp(left, gap, width - size.width - gap)}px`
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
  <div ref="root" class="ui-popover" @pointerdown="onPress" @keydown="onKey">
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
