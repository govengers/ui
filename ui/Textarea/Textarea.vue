<script setup lang="ts">
// Textarea: multi-line text that grows with its content through CSS `field-sizing` (no JS), from
// `rows` lines up to a max height, then scrolls. Takes id, describedby, invalid and required from
// a surrounding Field.
import { ref } from 'vue'
import { useField } from '../Field/field'

withDefaults(defineProps<{
  modelValue?: string | undefined
  name?: string | undefined
  rows?: number | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  readonly?: boolean | undefined
  maxlength?: number | undefined
}>(), { modelValue: '', rows: 3 })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const field = useField()
const textarea = ref<HTMLTextAreaElement | null>(null)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <textarea
    ref="textarea"
    class="ui-textarea"
    :style="{ '--ui-textarea-rows': rows }"
    :id="field?.id"
    :name="name"
    :rows="rows"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :required="field?.required.value || undefined"
    :aria-invalid="field?.invalid.value || undefined"
    :aria-describedby="field?.describedBy.value"
    @input="onInput"
  />
</template>

<style scoped>
.ui-textarea {
  display: block;
  width: 100%;
  /* `rows` lines plus padding and border: field-sizing ignores the rows attribute. */
  min-height: calc(var(--ui-textarea-rows) * 1lh + 2 * var(--ui-space-2) + 2 * var(--ui-border-width));
  max-height: calc(var(--ui-control-h) * 8);
  padding: var(--ui-space-2) var(--ui-control-px);
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-control);
  color: var(--ui-ink);
  /* At least 1rem on touch screens, or the phone zooms the page on focus (D84). */
  font-size: max(var(--ui-field-text-min), 1em);
  resize: vertical;
  transition: border-color var(--ui-duration-fast) var(--ui-ease);
}
@supports (field-sizing: content) {
  .ui-textarea { field-sizing: content; resize: none; }
}
.ui-textarea:focus-visible { border-color: var(--ui-focus); outline-offset: var(--ui-border-width); }
.ui-textarea[aria-invalid="true"], .ui-textarea:user-invalid { border-color: var(--ui-danger); }
.ui-textarea:disabled { background: var(--ui-sunk); color: var(--ui-disabled-ink); cursor: not-allowed; }
</style>
