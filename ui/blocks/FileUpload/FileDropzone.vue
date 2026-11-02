<script setup lang="ts">
// FileDropzone: FileUpload's drop target. A <label> around the native file input, so a click,
// Enter or Space opens the picker natively and the label's text names the input; a drop hands
// over the dropped files. It checks nothing: FileUpload does.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '../../Icon/Icon.vue'

defineProps<{
  name: string
  accept: string
  multiple: boolean
  /** The limits, under the button. */
  hint?: string | undefined
  /** The id of the problems FileUpload says about the last choice. */
  describedBy?: string | undefined
}>()

const emit = defineEmits<{ add: [files: File[]] }>()

const { t } = useI18n()
const over = ref(false)

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  emit('add', [...(input.files ?? [])])
  input.value = '' // the same file can be chosen again
}

function onDrop(event: DragEvent): void {
  over.value = false
  emit('add', [...(event.dataTransfer?.files ?? [])])
}

function onLeave(event: DragEvent): void {
  if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) over.value = false
}
</script>

<template>
  <label
    class="ui-file-dropzone"
    :data-state="over ? 'over' : undefined"
    @dragenter.prevent="over = true"
    @dragover.prevent
    @dragleave="onLeave"
    @drop.prevent="onDrop"
  >
    <input class="ui-file-dropzone__input" type="file" :name="name" :accept="accept" :multiple="multiple" :aria-describedby="describedBy" @change="onChange">
    <Icon name="upload" size="lg" />
    <span class="ui-file-dropzone__title">{{ t('ui.dropFiles') }}</span>
    <span class="ui-file-dropzone__browse">{{ t('ui.browse') }}</span>
    <span v-if="hint" class="ui-file-dropzone__hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.ui-file-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ui-space-2);
  padding: var(--ui-space-8) var(--ui-space-4);
  background: var(--ui-surface);
  border: 2px dashed var(--ui-border-strong);
  border-radius: var(--ui-radius-card);
  color: var(--ui-ink-2);
  text-align: center;
  cursor: pointer;
  transition: border-color var(--ui-duration-fast) var(--ui-ease), background-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-file-dropzone:hover { border-color: var(--ui-accent); }
.ui-file-dropzone[data-state="over"] { border-color: var(--ui-accent); background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-file-dropzone:focus-within { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.ui-file-dropzone__input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; clip: rect(0 0 0 0); }
.ui-file-dropzone__title { font-weight: var(--ui-weight-medium); color: var(--ui-ink); }
.ui-file-dropzone__browse {
  display: inline-flex;
  align-items: center;
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-control-px);
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-control);
  color: var(--ui-ink);
  font-size: var(--ui-text-sm);
  font-weight: var(--ui-weight-medium);
}
.ui-file-dropzone__hint { font-size: var(--ui-text-xs); color: var(--ui-muted); }
.ui-file-dropzone[data-state="over"] .ui-file-dropzone__title,
.ui-file-dropzone[data-state="over"] .ui-file-dropzone__hint { color: inherit; }
</style>
