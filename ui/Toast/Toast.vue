<script setup lang="ts">
// Toast: the host for the queue in toast.ts. Mount it ONCE in the app shell, then call toast()
// from anywhere. Danger toasts go to an assertive live region, the others to a polite one; both
// regions exist from the start so screen readers announce what is added to them.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import { dismiss, toastItem, toasts, visibleToasts, type ToastItem, type ToastOptions } from './toast'

const props = defineProps<{
  /** Render these in the page flow instead of the queue, without timers. Docs and previews only. */
  preview?: ToastOptions[] | undefined
}>()

const { t } = useI18n()
const host = ref<HTMLElement | null>(null)
const icons = { neutral: 'info', success: 'check-circle', danger: 'alert-circle' } as const

// Preview items get negative ids so they never match a queued toast.
const shown = computed(() => props.preview?.map((options, index) => toastItem(options, -1 - index)) ?? toasts.slice(0, visibleToasts))
const regions = computed(() => [
  { role: 'status', live: 'polite' as const, items: shown.value.filter(item => item.variant !== 'danger') },
  { role: 'alert', live: 'assertive' as const, items: shown.value.filter(item => item.variant === 'danger') },
])

// One ticking interval while there is something to count down; a hovered or focused host pauses.
const tick = 100
let interval: ReturnType<typeof setInterval> | undefined
function countDown() {
  const element = host.value
  if (!element || element.matches(':hover') || element.contains(document.activeElement)) return
  for (const item of toasts.slice(0, visibleToasts)) {
    item.remaining -= tick
    if (item.remaining <= 0) dismiss(item.id)
  }
}
watch(() => !props.preview && toasts.length > 0, active => {
  clearInterval(interval)
  if (active) interval = setInterval(countDown, tick)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(interval))

function run(item: ToastItem) {
  dismiss(item.id)
  item.action?.run()
}
</script>

<template>
  <div ref="host" class="ui-toast" :data-preview="preview ? '' : undefined">
    <div v-for="region in regions" :key="region.live" class="ui-toast__region" :role="region.role" :aria-live="region.live">
      <div v-for="item in region.items" :key="item.id" class="ui-toast__item" :data-variant="item.variant">
        <Icon :name="icons[item.variant]" class="ui-toast__icon" />
        <p class="ui-toast__message">{{ item.message }}</p>
        <Button v-if="item.action" variant="ghost" size="sm" @click="run(item)">{{ item.action.label }}</Button>
        <Button variant="ghost" size="sm" :label="t('ui.close')" @click="dismiss(item.id)">
          <template #icon><Icon name="x" /></template>
        </Button>
      </div>
    </div>
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
.ui-toast__region:not(:empty) ~ .ui-toast__region:not(:empty) { margin-block-start: var(--ui-space-2); }

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
@starting-style {
  .ui-toast__item { opacity: 0; translate: 0 var(--ui-space-2); }
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
