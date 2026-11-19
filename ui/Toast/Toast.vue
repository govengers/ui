<script setup lang="ts">
// Toast: the host for the queue in toast.ts. Mount it ONCE in the app shell, then call toast()
// from anywhere. Danger toasts go to an assertive live region, the others to a polite one; both
// regions exist from the start so screen readers announce what is added to them.
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import { dismiss, toastItem, toasts, visibleToasts, type ToastItem, type ToastOptions } from './toast'

const props = defineProps<{
  /** Render these in the page flow instead of the queue, without timers. Docs and previews only. */
  preview?: ToastOptions[] | undefined
}>()

const { t } = useI18n()
const id = useId()
const host = ref<HTMLElement | null>(null)
const icons = { neutral: 'info', success: 'check-circle', danger: 'alert-circle' } as const

// Preview items get negative ids so they never match a queued toast; a preview shows all of them.
// The queue shows the first three of each region on its own, so an error never waits behind
// follow-ups (D93).
const shown = computed(() => props.preview?.map((options, index) => toastItem(options, -1 - index)) ?? toasts)
const cap = computed(() => (props.preview ? Infinity : visibleToasts))
const regions = computed(() => [
  { role: 'status', live: 'polite' as const, items: shown.value.filter(item => item.variant !== 'danger').slice(0, cap.value) },
  { role: 'alert', live: 'assertive' as const, items: shown.value.filter(item => item.variant === 'danger').slice(0, cap.value) },
])

// One ticking interval while there is something to count down; a hovered or focused host pauses.
// Hovered only where a pointer hovers: a touch screen keeps :hover on the last element tapped, so a
// tap on a toast's text would hold its countdown for good.
const tick = 100
const hovers = matchMedia('(hover: hover)')
let interval: ReturnType<typeof setInterval> | undefined
function countDown() {
  const element = host.value
  if (!element || (hovers.matches && element.matches(':hover')) || element.contains(document.activeElement)) return
  for (const item of regions.value.flatMap(region => region.items)) {
    item.remaining -= tick
    if (item.remaining <= 0) dismiss(item.id)
  }
}
watch(() => !props.preview && toasts.length > 0, active => {
  clearInterval(interval)
  if (active) interval = setInterval(countDown, tick)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(interval))

// Where focus was before it entered the host: it goes back there when its toast closes.
let returnTo: HTMLElement | null = null
function onFocusin(event: FocusEvent) {
  const from = event.relatedTarget as HTMLElement | null
  if (!host.value?.contains(from)) returnTo = from
}

// Enter presses a button on keydown, so after a keyboard close the key may still be down while
// focus has moved on: its repeats must not press what holds focus now. Space presses on keyup and
// a click without a key has none down, so the first key event that is not a repeat (a keyup or a
// fresh keydown) ends the guard; only repeats of a key held through the close are ever dropped.
let releaseRepeats = () => {}
function holdRepeats() {
  releaseRepeats()
  const guard = (event: KeyboardEvent) => {
    if (event.type === 'keydown' && event.repeat) {
      event.preventDefault()
      event.stopImmediatePropagation()
    } else releaseRepeats()
  }
  document.addEventListener('keydown', guard, true)
  document.addEventListener('keyup', guard, true)
  releaseRepeats = () => {
    document.removeEventListener('keydown', guard, true)
    document.removeEventListener('keyup', guard, true)
    releaseRepeats = () => {}
  }
}
onBeforeUnmount(() => releaseRepeats())

// Closing the queued toast that holds focus. By keyboard (click detail 0) focus moves to the next
// toast itself, which a second press cannot close, else back where it came from, scrolled into
// view. After a pointer close it only goes back, without scrolling the page, so a countdown that
// focus held runs again.
function close(item: ToastItem, event: MouseEvent) {
  const closing = (event.currentTarget as HTMLElement).closest('.ui-toast__item')
  if (item.id > 0 && closing?.contains(document.activeElement)) {
    const keyboard = event.detail === 0
    const others = [...host.value?.querySelectorAll<HTMLElement>('.ui-toast__item:not([inert])') ?? []].filter(other => other !== closing)
    const next = others.find(other => closing.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) ?? others.at(-1)
    if (keyboard && next) {
      // Focusable only while it holds the handed-over focus: a click on a toast's text must not
      // focus it and so hold every timer. A window switch blurs it but leaves it the active
      // element, so it stays focusable then.
      next.tabIndex = -1
      const unset = () => {
        if (document.activeElement === next) return
        next.removeAttribute('tabindex')
        next.removeEventListener('blur', unset)
      }
      next.addEventListener('blur', unset)
    }
    const target = keyboard && next ? next : returnTo
    if (target?.isConnected) {
      target.focus({ preventScroll: !keyboard })
      if (keyboard) holdRepeats()
    }
  }
  dismiss(item.id)
}

function run(item: ToastItem, event: MouseEvent) {
  // A leaving toast stays for its fade: a second press must not run the action again.
  if (item.id > 0 && !toasts.includes(item)) return
  close(item, event)
  item.action?.run()
}

// A leaving toast drops out of the flow (.ui-toast-leave-active) so the others slide into its place.
// It stays where it stood, held by its distance to the bottom of the fixed host, the one edge that
// does not move: the stack grows upwards. Inert while it fades: no press, no focus.
function pin(element: Element) {
  const item = element as HTMLElement
  item.style.insetBlockEnd = `${(item.offsetParent?.clientHeight ?? 0) - item.offsetTop - item.offsetHeight}px`
  item.setAttribute('inert', '')
}
</script>

<template>
  <div ref="host" class="ui-toast" :data-preview="preview ? '' : undefined" @focusin="onFocusin">
    <TransitionGroup
      v-for="region in regions"
      :key="region.live"
      tag="div"
      name="ui-toast"
      class="ui-toast__region"
      :role="region.role"
      :aria-live="region.live"
      @before-leave="pin"
    >
      <div
        v-for="item in region.items"
        :key="item.id"
        class="ui-toast__item"
        :data-variant="item.variant"
        role="group"
        :aria-labelledby="`${id}-${item.id}`"
      >
        <Icon :name="icons[item.variant]" class="ui-toast__icon" />
        <p :id="`${id}-${item.id}`" class="ui-toast__message">{{ item.message }}</p>
        <Button v-if="item.action" variant="ghost" size="sm" @click="run(item, $event)">{{ item.action.label }}</Button>
        <Button variant="ghost" size="sm" class="ui-toast__close" :label="t('ui.close')" @click="close(item, $event)">
          <template #icon><Icon name="x" /></template>
        </Button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ui-toast {
  position: fixed;
  inset-block-end: var(--ui-space-4);
  inset-inline-end: var(--ui-space-4);
  z-index: var(--ui-z-toast);
  display: flex;
  flex-direction: column;
  width: min(24rem, calc(100vw - 2 * var(--ui-space-4)));
  pointer-events: none;
}
.ui-toast[data-preview] { position: static; pointer-events: auto; }
.ui-toast__region { display: flex; flex-direction: column; gap: var(--ui-space-2); }
/* The gap between the regions counts toasts that stay: when the last one of a region starts to
   leave, the gap goes with it and the others slide the whole way. */
.ui-toast__region:has(> :not(.ui-toast-leave-active)) ~ .ui-toast__region:has(> :not(.ui-toast-leave-active)) {
  margin-block-start: var(--ui-space-2);
}

.ui-toast__item {
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-2);
  padding: var(--ui-space-2) var(--ui-space-2) var(--ui-space-2) var(--ui-space-3);
  background: var(--ui-surface);
  color: var(--ui-ink);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--ui-shadow-md);
  font-size: var(--ui-text-sm);
  pointer-events: auto;
  transition: opacity var(--ui-duration) var(--ui-ease), translate var(--ui-duration) var(--ui-ease);
}
/* Enter on @starting-style; TransitionGroup only fades the leaving one and moves the rest. Its move
   writes transform, so the move transitions transform, not translate. After the item rule: same
   specificity, order wins. */
@starting-style {
  .ui-toast__item { opacity: 0; translate: 0 var(--ui-space-2); }
}
.ui-toast-leave-active {
  position: absolute;
  inset-inline: 0;
  transition: opacity var(--ui-duration-fast) var(--ui-ease);
}
.ui-toast-leave-to { opacity: 0; }
.ui-toast-move { transition: transform var(--ui-duration-fast) var(--ui-ease); }
/* Closed while it still slides: it fades and ends its slide, instead of the move rule cutting the fade. */
.ui-toast-leave-active.ui-toast-move {
  transition: opacity var(--ui-duration-fast) var(--ui-ease), transform var(--ui-duration-fast) var(--ui-ease);
}
/* Icon and text line up with the first line of a small button (control-h-sm high). */
.ui-toast__icon {
  margin-block: calc((var(--ui-control-h-sm) - 1.25em) / 2);
  color: var(--ui-muted);
}
.ui-toast__item[data-variant="success"] .ui-toast__icon { color: var(--ui-success); }
.ui-toast__item[data-variant="danger"] .ui-toast__icon { color: var(--ui-danger); }
.ui-toast__message {
  flex: 1;
  min-width: 0;
  padding-block: calc((var(--ui-control-h-sm) - 1lh) / 2);
  overflow-wrap: anywhere;
}

/* Phones: bottom centre, the full width minus the page margin. */
@media (max-width: 48rem) {
  .ui-toast:not([data-preview]) { inset-inline: var(--ui-space-4); width: auto; }
}
</style>
