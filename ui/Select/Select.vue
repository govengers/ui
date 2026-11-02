<script setup lang="ts">
// Select: the native <select> (D9), no custom listbox. Emits the chosen option's own value, a
// number stays a number. Takes id, describedby, invalid and required from a surrounding Field.
import { computed, useAttrs } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useField } from '../Field/field'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const controlAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')))

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  options: { value: string | number; label: string; disabled?: boolean }[]
  /** Shown as a disabled empty option while modelValue is null. */
  placeholder?: string
  name?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), { modelValue: null, size: 'md' })

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const field = useField()

// The DOM only knows strings; the index maps back to the option and its original value type.
function onChange(event: Event) {
  const index = (event.target as HTMLSelectElement).selectedIndex - (props.placeholder ? 1 : 0)
  const option = props.options[index]
  if (option) emit('update:modelValue', option.value)
}
</script>

<template>
  <div class="ui-select" :class="attrs['class']" :style="attrs['style'] as string | undefined" :data-size="size">
    <select
      v-bind="controlAttrs"
      class="ui-select__control"
      :id="field?.id"
      :name="name"
      :disabled="disabled"
      :required="field?.required.value || undefined"
      :aria-invalid="field?.invalid.value || undefined"
      :aria-describedby="field?.describedBy.value"
      @change="onChange"
    >
      <option v-if="placeholder" class="ui-select__placeholder" value="" disabled :selected="modelValue === null">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        :selected="option.value === modelValue"
      >{{ option.label }}</option>
    </select>
    <Icon name="chevron-down" class="ui-select__chevron" />
  </div>
</template>

<style scoped>
.ui-select {
  position: relative;
  display: flex;
  align-items: center;
  color: var(--ui-ink);
}
.ui-select__control {
  flex: 1;
  min-width: 0;
  min-height: var(--ui-control-h);
  /* room for the chevron: its width plus the padding on both sides of it */
  padding: 0 calc(1.25em + 2 * var(--ui-control-px)) 0 var(--ui-control-px);
  appearance: none;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-control);
  text-overflow: ellipsis;
  cursor: pointer;
  transition: border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-select[data-size="sm"] { font-size: var(--ui-text-sm); }
.ui-select[data-size="sm"] .ui-select__control { min-height: var(--ui-control-h-sm); }
.ui-select[data-size="lg"] { font-size: var(--ui-text-lg); }
.ui-select[data-size="lg"] .ui-select__control { min-height: var(--ui-control-h-lg); }
.ui-select__control:focus-visible { border-color: var(--ui-focus); outline-offset: var(--ui-border-width); }
.ui-select__control[aria-invalid="true"] { border-color: var(--ui-danger); }
.ui-select__control:has(.ui-select__placeholder:checked) { color: var(--ui-placeholder); }
.ui-select__control option { color: var(--ui-ink); }
.ui-select__control:disabled { background: var(--ui-sunk); color: var(--ui-disabled-ink); cursor: not-allowed; }

.ui-select__chevron {
  position: absolute;
  right: var(--ui-control-px);
  color: var(--ui-muted);
  pointer-events: none;
}
.ui-select__control:disabled + .ui-select__chevron { color: var(--ui-disabled-ink); }
</style>
