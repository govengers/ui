<script setup lang="ts">
// Field: label, hint and error around one control. Wires id, aria-describedby, aria-invalid and
// required into the control through field.ts; the control does not need to know its label.
// `group` makes it a fieldset with a legend for a set of checkboxes or radios.
import { computed, provide, toRef } from 'vue'
import { fieldId, fieldKey } from './field'

const props = withDefaults(defineProps<{
  label: string
  hint?: string | undefined
  /** The error sentence; its presence marks the control invalid. */
  error?: string | undefined
  required?: boolean
  /** Hide the label visually; it stays for assistive technology. */
  hideLabel?: boolean
  /** A fieldset with a legend, for a group of checkboxes or radios. */
  group?: boolean
}>(), {})

const id = fieldId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined))
const invalid = computed(() => Boolean(props.error))

provide(fieldKey, { id, describedBy, invalid, required: toRef(props, 'required') })
</script>

<template>
  <component :is="group ? 'fieldset' : 'div'" class="ui-field" :data-invalid="invalid || undefined" :aria-describedby="group ? describedBy : undefined">
    <component :is="group ? 'legend' : 'label'" :for="group ? undefined : id" class="ui-field__label" :data-hidden="hideLabel || undefined">
      {{ label }}<span v-if="required" class="ui-field__required" aria-hidden="true"> *</span>
    </component>
    <slot />
    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="ui-field__hint">{{ hint }}</p>
  </component>
</template>

<style scoped>
.ui-field { display: flex; flex-direction: column; gap: var(--ui-space-1); min-width: 0; margin: 0; padding: 0; border: 0; }
.ui-field__label { font-size: var(--ui-text-sm); font-weight: var(--ui-weight-medium); color: var(--ui-ink-2); padding: 0; }
.ui-field__label[data-hidden] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ui-field__required { color: var(--ui-danger); }
.ui-field__hint, .ui-field__error { font-size: var(--ui-text-xs); }
.ui-field__hint { color: var(--ui-muted); }
.ui-field__error { color: var(--ui-danger); }
</style>
