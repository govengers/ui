<script setup lang="ts">
// Dialog: the native <dialog> opened with showModal() (D9). The platform traps focus, closes on
// Escape, puts it in the top layer and returns focus to the opener; v-model drives showModal() and
// close(), the native close event drives v-model back. `inline` shows it in the page flow.
import { onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

const props = withDefaults(defineProps<{
  /** Open state. */
  modelValue?: boolean | undefined
  title: string
  description?: string | undefined
  size?: 'sm' | 'md' | 'lg' | undefined
  variant?: 'default' | 'danger' | undefined
  /** No X button; Escape and a backdrop click do nothing. The actions are the only way out. */
  persistent?: boolean | undefined
  /** Open in the page flow without showModal(): no backdrop, no focus trap. Docs and previews only. */
  inline?: boolean | undefined
}>(), { size: 'md', variant: 'default' })

const emit = defineEmits<{ 'update:modelValue': [open: boolean]; close: [] }>()

const { t } = useI18n()
const id = useId()
const dialog = ref<HTMLDialogElement | null>(null)
// A backdrop click only counts when the press started on the backdrop too (not a drag out of a field).
let pressedBackdrop = false

function sync(open: boolean) {
  const element = dialog.value
  if (!element || props.inline) return
  if (open && !element.open) element.showModal()
  else if (!open && element.open) element.close()
}
watch(() => props.modelValue, sync)
onMounted(() => sync(props.modelValue))

function close() {
  dialog.value?.close()
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
  pressedBackdrop = event.target === dialog.value
}

// The dialog has no padding, so a click whose target is the <dialog> itself hit the backdrop.
// closedby="any" does this natively where supported; this covers the rest.
function onClick(event: MouseEvent) {
  if (!props.persistent && pressedBackdrop && event.target === dialog.value) close()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="ui-dialog"
    :data-size="size"
    :data-variant="variant"
    :data-inline="inline || undefined"
    :open="inline || undefined"
    :closedby="persistent ? 'none' : 'any'"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="description ? `${id}-description` : undefined"
    @close="onClose"
    @cancel="onCancel"
    @pointerdown="onPointerdown"
    @click="onClick"
  >
    <header class="ui-dialog__header">
      <Icon v-if="variant === 'danger'" name="alert-triangle" class="ui-dialog__icon" />
      <h2 :id="`${id}-title`" class="ui-dialog__title">{{ title }}</h2>
      <Button v-if="!persistent" variant="ghost" :label="t('ui.close')" class="ui-dialog__close" @click="close">
        <template #icon><Icon name="x" /></template>
      </Button>
    </header>
    <p v-if="description" :id="`${id}-description`" class="ui-dialog__description">{{ description }}</p>
    <div v-if="$slots.default" class="ui-dialog__body"><slot /></div>
    <footer v-if="$slots.actions" class="ui-dialog__actions"><slot name="actions" /></footer>
  </dialog>
</template>

<style scoped>
.ui-dialog {
  width: 100%;
  max-width: 32rem;
  max-height: calc(100dvh - 2 * var(--ui-space-8));
  padding: 0;
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  background: var(--ui-surface);
  color: var(--ui-ink);
  box-shadow: var(--ui-shadow-lg);
}
/* Only when open: a display value on the closed dialog would override the UA's display: none. */
.ui-dialog[open] { display: flex; flex-direction: column; }
.ui-dialog[data-size="sm"] { max-width: 24rem; }
.ui-dialog[data-size="lg"] { max-width: 48rem; }
.ui-dialog[data-inline] { position: static; margin: 0; }
.ui-dialog::backdrop { background: var(--ui-scrim); }

/* Every part pads itself; the last one closes the panel. No padding on the dialog (backdrop test). */
.ui-dialog > :last-child { padding-block-end: var(--ui-card-p); }
.ui-dialog__header {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  padding: var(--ui-card-p) var(--ui-card-p) 0;
}
.ui-dialog__title { flex: 1; min-width: 0; font-size: var(--ui-text-lg); }
.ui-dialog__icon { color: var(--ui-danger); }
.ui-dialog__close { margin-block: calc(var(--ui-space-2) * -1); margin-inline-end: calc(var(--ui-space-2) * -1); }
.ui-dialog__description { padding: var(--ui-space-2) var(--ui-card-p) 0; color: var(--ui-muted); }
.ui-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--ui-space-4) var(--ui-card-p) 0;
}
.ui-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ui-space-2);
  padding: var(--ui-space-5) var(--ui-card-p) 0;
}

/* Phones: a bottom panel, full width; the body scrolls between a fixed header and footer. */
@media (max-width: 48rem) {
  .ui-dialog:not([data-inline]) {
    max-width: none;
    max-height: 90dvh;
    margin: auto 0 0;
    border-block-end: 0;
    border-radius: var(--ui-radius-card) var(--ui-radius-card) 0 0;
  }
}
</style>
