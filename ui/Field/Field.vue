<script setup lang="ts">
// Field: label, hint and error around one control. Wires id, aria-describedby, aria-invalid and
// required into the control through field.ts; the control does not need to know its label.
import { computed, provide, ref, toRef } from 'vue'
import { fieldId, fieldKey } from './field'

const props = withDefaults(defineProps<{
  label: string
  hint?: string
  /** The error sentence; its presence marks the control invalid. */
  error?: string
  required?: boolean
  /** Hide the label visually; it stays for assistive technology. */
  hideLabel?: boolean
}>(), {})

const id = fieldId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const describedBy = computed(() => [props.error && errorId, props.hint && hintId].filter(Boolean).join(' ') || undefined)
const invalid = computed(() => Boolean(props.error))

provide(fieldKey, { id, describedBy, invalid, required: toRef(props, 'required') as unknown as typeof invalid })
const live = ref(false)
</script>

<template>
  <div class="ui-field" :data-invalid="invalid || undefined">
    <label :for="id" class="ui-field__label" :class="{ 'ui-visually-hidden': hideLabel }">
      {{ label }}<span v-if="required" class="ui-field__required" aria-hidden="true"> *</span>
    </label>
    <slot />
    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="ui-field__hint">{{ hint }}</p>
    <span v-if="live" hidden />
  </div>
</template>

<style scoped>
.ui-field { display: flex; flex-direction: column; gap: var(--ui-space-1); }
.ui-field__label { font-size: var(--ui-text-sm); font-weight: var(--ui-weight-medium); color: var(--ui-ink-2); }
.ui-field__required { color: var(--ui-danger); }
.ui-field__hint, .ui-field__error { font-size: var(--ui-text-xs); }
.ui-field__hint { color: var(--ui-muted); }
.ui-field__error { color: var(--ui-danger); }
</style>
