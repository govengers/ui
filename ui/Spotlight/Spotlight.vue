<script setup lang="ts">
// Spotlight: guide mode's "click here" (D25). A scrim with a cutout and an accent ring around the
// target, and a bubble beside it with the text, the step count and Back/Next. The overlay lets
// every pointer event through, so the target stays clickable; only the bubble takes input.
// Placed every frame while shown (scroll, resize, a live update moving the target), like Menu.
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import { resolveTarget, type DriveTarget } from '../agent/types'
import { placeBubble } from './spotlight'

const props = withDefaults(defineProps<{
  /** What to point at; null hides the spotlight. */
  target: DriveTarget | null
  text: string
  step?: number | undefined
  total?: number | undefined
  canBack?: boolean
  canNext?: boolean
  /** The Next button's text, default ui.next; pass ui.done on the last step, ui.go on a pause. */
  nextLabel?: string | undefined
}>(), {})

const emit = defineEmits<{ next: []; back: []; close: [] }>()

const { t } = useI18n()
const textId = useId()
const cutout = ref<HTMLElement | null>(null)
const bubble = ref<HTMLElement | null>(null)
/** Room between the target and the ring, in px. */
const pad = 4

function elementOf(target: DriveTarget | null): HTMLElement | null {
  return target ? resolveTarget(target) : null
}

// Inline style straight on the elements: placing every frame must not re-render the component.
function place() {
  if (!cutout.value || !bubble.value) return
  const rect = elementOf(props.target)?.getBoundingClientRect()
  const box = rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + 2 * pad, height: rect.height + 2 * pad } : null
  cutout.value.hidden = box === null
  if (box) Object.assign(cutout.value.style, { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` })
  const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
  const { top, left } = placeBubble(box, bubble.value.getBoundingClientRect(), viewport)
  Object.assign(bubble.value.style, { top: `${top}px`, left: `${left}px` })
}

let frame = 0
function follow() {
  place()
  frame = requestAnimationFrame(follow)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

// Shown: start following, listen for Escape, take focus. Hidden: stop, give focus back.
let opener: HTMLElement | null = null
watch(() => props.target !== null, async shown => {
  cancelAnimationFrame(frame)
  if (shown) {
    opener = document.activeElement as HTMLElement | null
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    follow()
    bubble.value?.focus({ preventScroll: true })
  } else {
    // Runs before the bubble leaves the DOM: give focus back only if the bubble still has it.
    window.removeEventListener('keydown', onKeydown)
    const lost = document.activeElement === document.body || (bubble.value?.contains(document.activeElement) ?? false)
    if (lost && opener?.isConnected) opener.focus({ preventScroll: true })
    opener = null
  }
}, { immediate: true })

// A new target scrolls into view; a target already on screen does not move.
watch(() => props.target, async target => {
  await nextTick()
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
  elementOf(target)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: smooth ? 'smooth' : 'instant' })
}, { immediate: true })

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('keydown', onKeydown)
  if (opener?.isConnected && bubble.value?.contains(document.activeElement)) opener.focus({ preventScroll: true })
})

/** Focuses the primary button (Next or Go), else the bubble: AgentCursor calls it on a pause. */
function focus() {
  const primary = bubble.value?.querySelector<HTMLElement>('[data-variant="primary"]')
  ;(primary ?? bubble.value)?.focus({ preventScroll: true })
}

defineExpose({ focus })
</script>

<template>
  <Teleport to="body">
    <div v-if="target" class="ui-spotlight">
      <div ref="cutout" class="ui-spotlight__cutout" />
      <div ref="bubble" class="ui-spotlight__bubble" role="dialog" :aria-labelledby="textId" tabindex="-1" data-agent-ui>
        <p :id="textId" class="ui-spotlight__text" aria-live="polite">{{ text }}</p>
        <div class="ui-spotlight__foot">
          <span v-if="step && total" class="ui-spotlight__count">{{ t('ui.stepOf', { n: step, total }) }}</span>
          <Button v-if="canBack" size="sm" variant="ghost" @click="emit('back')">{{ t('ui.back') }}</Button>
          <Button v-if="canNext" size="sm" variant="primary" @click="emit('next')">{{ nextLabel ?? t('ui.next') }}</Button>
        </div>
        <Button class="ui-spotlight__close" size="sm" variant="ghost" :label="t('ui.close')" @click="emit('close')">
          <template #icon><Icon name="x" /></template>
        </Button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-spotlight { position: fixed; inset: 0; z-index: var(--ui-z-agent); pointer-events: none; }

/* The scrim is the cutout's own shadow, so the hole is the target's box with control corners. */
.ui-spotlight__cutout {
  position: fixed;
  border-radius: var(--ui-radius-control);
  box-shadow: 0 0 0 2px var(--ui-accent), 0 0 0 100vmax var(--ui-scrim);
}
.ui-spotlight__cutout::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
@media (prefers-reduced-motion: no-preference) {
  .ui-spotlight__cutout::after { animation: ui-spotlight-pulse 1.6s var(--ui-ease) infinite; }
}
@keyframes ui-spotlight-pulse {
  from { box-shadow: 0 0 0 0 var(--ui-accent); }
  to { box-shadow: 0 0 0 var(--ui-space-3) transparent; }
}

.ui-spotlight__bubble {
  position: fixed;
  width: max-content;
  max-width: min(22rem, calc(100vw - 2 * var(--ui-space-3)));
  padding: var(--ui-space-4) var(--ui-space-10) var(--ui-space-3) var(--ui-space-4);
  background: var(--ui-surface);
  color: var(--ui-ink);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--ui-shadow-lg);
  pointer-events: auto;
}
/* The bubble takes focus only as a reading position for screen readers; its buttons show the ring. */
.ui-spotlight__bubble:focus { outline: none; }
.ui-spotlight__text { font-size: var(--ui-text-sm); }
.ui-spotlight__text:empty { display: none; }
.ui-spotlight__foot { display: flex; align-items: center; justify-content: flex-end; gap: var(--ui-space-2); margin-top: var(--ui-space-3); }
.ui-spotlight__foot:empty { display: none; }
.ui-spotlight__count { margin-right: auto; font-size: var(--ui-text-xs); color: var(--ui-muted); }
.ui-spotlight__close { position: absolute; top: var(--ui-space-2); right: var(--ui-space-2); }
</style>
