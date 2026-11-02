<script setup lang="ts">
// Sheet: a side panel on desktop, a bottom sheet on phones. The native <dialog> with showModal()
// (D9) like Dialog: focus trap, Escape, top layer and focus return come from the platform. It
// slides in by CSS (@starting-style); `inline` shows it in the page flow.
import { onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

const props = withDefaults(defineProps<{
  /** Open state. */
  modelValue?: boolean
  /** The accessible name; shown as the heading unless the header slot replaces it. */
  title: string
  /** Desktop only; phones always get a bottom sheet. */
  side?: 'right' | 'left'
  /** A CSS length; desktop only. */
  width?: string
  /** No X button; Escape and a backdrop click do nothing. The actions are the only way out. */
  persistent?: boolean
  /** Open in the page flow without showModal(): no backdrop, no focus trap. Docs and previews only. */
  inline?: boolean
}>(), { side: 'right', width: '28rem' })

const emit = defineEmits<{ 'update:modelValue': [open: boolean]; close: [] }>()

const { t } = useI18n()
const id = useId()
const sheet = ref<HTMLDialogElement | null>(null)
// A backdrop click only counts when the press started on the backdrop too (not a drag out of a field).
let pressedBackdrop = false

function sync(open: boolean) {
  const element = sheet.value
  if (!element || props.inline) return
  if (open && !element.open) element.showModal()
  else if (!open && element.open) element.close()
}
watch(() => props.modelValue, sync)
onMounted(() => sync(props.modelValue))

function close() {
  sheet.value?.close()
}

function onClose() {
  if (props.modelValue) emit('update:modelValue', false)
  emit('close')
}

// Escape. closedby="none" stops it natively where supported; this covers the rest.
function onCancel(event: Event) {
  if (props.persistent) event.preventDefault()
}

function onPointerdown(event: PointerEvent) {
  pressedBackdrop = event.target === sheet.value
}

// The sheet has no padding, so a click whose target is the <dialog> itself hit the backdrop.
// closedby="any" does this natively where supported; this covers the rest.
function onClick(event: MouseEvent) {
  if (!props.persistent && pressedBackdrop && event.target === sheet.value) close()
}
</script>

<template>
  <dialog
    ref="sheet"
    class="ui-sheet"
    :data-side="side"
    :data-inline="inline || undefined"
    :open="inline || undefined"
    :style="{ '--ui-sheet-w': width }"
    :closedby="persistent ? 'none' : 'any'"
    :aria-labelledby="$slots.header ? undefined : `${id}-title`"
    :aria-label="$slots.header ? title : undefined"
    @close="onClose"
    @cancel="onCancel"
    @pointerdown="onPointerdown"
    @click="onClick"
  >
    <header class="ui-sheet__header">
      <div class="ui-sheet__heading">
        <slot name="header"><h2 :id="`${id}-title`" class="ui-sheet__title">{{ title }}</h2></slot>
      </div>
      <Button v-if="!persistent" variant="ghost" :label="t('ui.close')" @click="close">
        <template #icon><Icon name="x" /></template>
      </Button>
    </header>
    <div class="ui-sheet__body"><slot /></div>
    <footer v-if="$slots.actions" class="ui-sheet__actions"><slot name="actions" /></footer>
  </dialog>
</template>

<style scoped>
.ui-sheet {
  /* --ui-sheet-w comes from the width prop; --ui-sheet-from is where the slide starts and ends. */
  --ui-sheet-from: 100% 0;
  position: fixed;
  inset: 0 0 0 auto;
  width: min(var(--ui-sheet-w), 100%);
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-inline-start: var(--ui-border-width) solid var(--ui-border);
  background: var(--ui-surface);
  color: var(--ui-ink);
  box-shadow: var(--ui-shadow-lg);
  translate: var(--ui-sheet-from);
  transition:
    translate var(--ui-duration) var(--ui-ease),
    display var(--ui-duration) allow-discrete,
    overlay var(--ui-duration) allow-discrete;
}
.ui-sheet[data-side="left"] {
  --ui-sheet-from: -100% 0;
  inset: 0 auto 0 0;
  border-inline-start: 0;
  border-inline-end: var(--ui-border-width) solid var(--ui-border);
}
/* Only when open: a display value on the closed dialog would override the UA's display: none. */
.ui-sheet[open] { display: flex; flex-direction: column; translate: 0 0; }
.ui-sheet::backdrop {
  background: var(--ui-scrim);
  opacity: 0;
  transition:
    opacity var(--ui-duration) var(--ui-ease),
    display var(--ui-duration) allow-discrete,
    overlay var(--ui-duration) allow-discrete;
}
.ui-sheet[open]::backdrop { opacity: 1; }
/* After the [open] rules: starting styles win by order, not by specificity. */
@starting-style {
  .ui-sheet[open] { translate: var(--ui-sheet-from); }
  .ui-sheet[open]::backdrop { opacity: 0; }
}
.ui-sheet[data-inline] {
  position: static;
  height: auto;
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--ui-shadow-md);
}

.ui-sheet__header {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  min-height: var(--ui-topbar-h);
  padding: var(--ui-space-2) var(--ui-space-3) var(--ui-space-2) var(--ui-card-p);
  border-block-end: var(--ui-border-width) solid var(--ui-divider);
}
.ui-sheet__heading { flex: 1; min-width: 0; }
.ui-sheet__title { font-size: var(--ui-text-lg); }
.ui-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--ui-card-p);
}
.ui-sheet__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ui-space-2);
  padding: var(--ui-space-3) var(--ui-card-p);
  border-block-start: var(--ui-border-width) solid var(--ui-divider);
}

/* Phones: a bottom sheet, full width, up to 90% of the screen high; side and width do not apply. */
@media (max-width: 48rem) {
  .ui-sheet[data-side]:not([data-inline]) {
    --ui-sheet-from: 0 100%;
    inset: auto 0 0;
    width: 100%;
    height: auto;
    max-height: 90dvh;
    border: 0;
    border-block-start: var(--ui-border-width) solid var(--ui-border);
    border-radius: var(--ui-radius-card) var(--ui-radius-card) 0 0;
  }
}
</style>
