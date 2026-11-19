<script setup lang="ts">
// RadioGroup: native radios under one name, drawn with CSS (appearance: none) like Checkbox, one
// label row per option. The browser moves the choice with the arrow keys; the caller wraps it in
// `Field group` for the legend, and the group takes the Field's invalid and required state.
import { computed, nextTick, ref, useId } from 'vue'
import { useField } from '../Field/field'

const props = withDefaults(defineProps<{
  modelValue?: string | number | null | undefined
  options: { value: string | number; label: string; description?: string; disabled?: boolean }[]
  /** Shared by every radio; a generated id when not set. */
  name?: string | undefined
  disabled?: boolean | undefined
}>(), { modelValue: null })

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const field = useField()
const id = useId()
const groupName = computed(() => props.name ?? id)
const root = ref<HTMLElement | null>(null)

// Vue patches `checked` only when modelValue changes, so a parent that keeps its value would leave
// the clicked radio checked: after the parent had its turn, every radio follows modelValue again.
async function choose(value: string | number): Promise<void> {
  emit('update:modelValue', value)
  await nextTick()
  root.value?.querySelectorAll<HTMLInputElement>('.ui-radio-group__control').forEach((input, index) => {
    input.checked = props.options[index]?.value === props.modelValue
  })
}
</script>

<template>
  <div ref="root" class="ui-radio-group">
    <label v-for="(option, index) in options" :key="option.value" class="ui-radio-group__option">
      <input
        type="radio"
        class="ui-radio-group__control"
        :name="groupName"
        :value="option.value"
        :checked="option.value === modelValue"
        :disabled="disabled || option.disabled"
        :required="field?.required.value || undefined"
        :aria-labelledby="`${id}-${index}`"
        :aria-describedby="option.description ? `${id}-${index}-description` : undefined"
        :aria-invalid="field?.invalid.value || undefined"
        @change="choose(option.value)"
      >
      <span :id="`${id}-${index}`" class="ui-radio-group__text">{{ option.label }}</span>
      <span v-if="option.description" :id="`${id}-${index}-description`" class="ui-radio-group__description">{{ option.description }}</span>
    </label>
  </div>
</template>

<style scoped>
.ui-radio-group { display: flex; flex-direction: column; }

/* The row is the click target: a control's height, the circle centred on the first line (as Checkbox). */
.ui-radio-group__option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: var(--ui-space-3);
  align-items: start;
  width: fit-content;
  min-height: var(--ui-control-h);
  padding-block: calc((var(--ui-control-h) - 1lh) / 2);
  font-size: var(--ui-text-sm);
  color: var(--ui-ink);
  cursor: pointer;
}
.ui-radio-group__option:has(.ui-radio-group__control:disabled) { cursor: not-allowed; opacity: var(--ui-disabled-opacity); }

/* Checked: the border grows inward to a ring, leaving a dot; a border survives forced colours, a shadow does not. */
.ui-radio-group__control {
  width: var(--ui-space-5);
  height: var(--ui-space-5);
  margin: calc((1lh - var(--ui-space-5)) / 2) 0 0;
  appearance: none;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-pill);
  cursor: inherit;
  transition: border-color var(--ui-duration-fast) var(--ui-ease), border-width var(--ui-duration-fast) var(--ui-ease);
}
.ui-radio-group__control[aria-invalid="true"], .ui-radio-group__control:user-invalid { border-color: var(--ui-danger); }
.ui-radio-group__control:checked { background: var(--ui-on-accent); border: calc(var(--ui-space-5) * 0.3) solid var(--ui-accent); }

.ui-radio-group__description { grid-column: 2; color: var(--ui-muted); }
</style>
