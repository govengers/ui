<script setup lang="ts">
// Checkbox: the native checkbox, drawn with CSS (appearance: none), with its own label. Binds a
// boolean, or toggles `value` in an array like Vue's v-model on native checkboxes. Takes
// describedby and invalid from a surrounding Field (a group's hint and error), never its id.
import { computed } from 'vue'
import Icon from '../Icon/Icon.vue'
import { fieldId, useField } from '../Field/field'

const props = withDefaults(defineProps<{
  modelValue?: boolean | (string | number)[] | undefined
  /** The value this checkbox stands for: toggled in an array model, posted with the form. */
  value?: string | number | undefined
  label?: string | undefined
  /** A second, muted line under the label. */
  description?: string | undefined
  indeterminate?: boolean | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  /** Keep the label for assistive technology only (a table's row selector). */
  hideLabel?: boolean | undefined
}>(), { modelValue: false })

const emit = defineEmits<{ 'update:modelValue': [value: boolean | (string | number)[]] }>()

const field = useField()
const id = fieldId()
const labelId = `${id}-label`
const descriptionId = `${id}-description`
const describedBy = computed(() => [props.description && descriptionId, field?.describedBy.value].filter(Boolean).join(' ') || undefined)
const checked = computed(() => (Array.isArray(props.modelValue)
  ? props.value !== undefined && props.modelValue.includes(props.value)
  : props.modelValue))

function onChange(event: Event) {
  const on = (event.target as HTMLInputElement).checked
  const model = props.modelValue
  if (!Array.isArray(model)) emit('update:modelValue', on)
  else if (props.value !== undefined) emit('update:modelValue', on ? [...model, props.value] : model.filter(item => item !== props.value))
}
</script>

<template>
  <label class="ui-checkbox">
    <span class="ui-checkbox__box">
      <input
        type="checkbox"
        class="ui-checkbox__control"
        :name="name"
        :value="value"
        :checked="checked"
        :indeterminate.prop="indeterminate"
        :disabled="disabled"
        :aria-labelledby="label || $slots.default ? labelId : undefined"
        :aria-describedby="describedBy"
        :aria-invalid="field?.invalid.value || undefined"
        @change="onChange"
      >
      <Icon :name="indeterminate ? 'minus' : 'check'" size="sm" class="ui-checkbox__mark" />
    </span>
    <span v-if="label || $slots.default || description" class="ui-checkbox__text" :data-hidden="hideLabel || undefined">
      <span v-if="label || $slots.default" :id="labelId" class="ui-checkbox__label"><slot>{{ label }}</slot></span>
      <span v-if="description" :id="descriptionId" class="ui-checkbox__description">{{ description }}</span>
    </span>
  </label>
</template>

<style scoped>
/* The row is the click target: a control's height (44px on touch screens through the tokens), the box centred on the first line. */
.ui-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-3);
  width: fit-content;
  min-height: var(--ui-control-h);
  padding-block: calc((var(--ui-control-h) - 1lh) / 2);
  font-size: var(--ui-text-sm);
  color: var(--ui-ink);
  cursor: pointer;
}
.ui-checkbox:has(.ui-checkbox__control:disabled) { cursor: not-allowed; opacity: var(--ui-disabled-opacity); }

.ui-checkbox__box {
  display: grid;
  flex: none;
  margin-top: calc((1lh - var(--ui-space-5)) / 2);
}
.ui-checkbox__box > * { grid-area: 1 / 1; }
.ui-checkbox__control {
  width: var(--ui-space-5);
  height: var(--ui-space-5);
  margin: 0;
  appearance: none;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  cursor: inherit;
  transition: background-color var(--ui-duration-fast) var(--ui-ease), border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-checkbox__control[aria-invalid="true"] { border-color: var(--ui-danger); }
.ui-checkbox__control:checked, .ui-checkbox__control:indeterminate { background: var(--ui-accent); border-color: var(--ui-accent); }
.ui-checkbox__mark { place-self: center; color: var(--ui-on-accent); pointer-events: none; visibility: hidden; }
.ui-checkbox__control:checked + .ui-checkbox__mark,
.ui-checkbox__control:indeterminate + .ui-checkbox__mark { visibility: visible; }

.ui-checkbox__text { display: flex; flex-direction: column; }
.ui-checkbox__text[data-hidden] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ui-checkbox__description { color: var(--ui-muted); }
</style>
