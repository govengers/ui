<script setup lang="ts">
// Input: the one text-like input. Native types only (D9); a password gets a reveal toggle.
// Takes id, describedby, invalid and required from a surrounding Field. Attributes (aria-label,
// data-action, autofocus) land on the <input>, class and style on the wrapper.
import { computed, ref, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '../Icon/Icon.vue'
import { useField } from '../Field/field'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number | null | undefined
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel' | 'date' | 'time' | 'datetime-local' | undefined
  name?: string | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  readonly?: boolean | undefined
  size?: 'sm' | 'md' | 'lg' | undefined
  autocomplete?: string | undefined
  min?: number | string | undefined
  max?: number | string | undefined
  step?: number | string | undefined
}>(), { type: 'text', size: 'md', modelValue: '' })

const attrs = useAttrs()
const controlAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')))

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const { t } = useI18n()
const field = useField()
const revealed = ref(false)
const actualType = computed(() => (props.type === 'password' && revealed.value ? 'text' : props.type))
const input = ref<HTMLInputElement | null>(null)

function onInput(event: Event) {
  const element = event.target as HTMLInputElement
  if (props.type === 'number') {
    emit('update:modelValue', element.value === '' ? null : element.valueAsNumber)
  } else {
    emit('update:modelValue', element.value)
  }
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="ui-input" :class="attrs['class']" :style="attrs['style'] as string | undefined" :data-size="size" :data-invalid="field?.invalid.value || undefined">
    <span v-if="$slots.prefix" class="ui-input__affix"><slot name="prefix" /></span>
    <input
      ref="input"
      v-bind="controlAttrs"
      class="ui-input__control"
      :id="field?.id"
      :type="actualType"
      :name="name"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="field?.required.value || Boolean(attrs['required']) || undefined"
      :aria-invalid="field?.invalid.value || undefined"
      :aria-describedby="field?.describedBy.value"
      :autocomplete="autocomplete"
      :min="min"
      :max="max"
      :step="step"
      @input="onInput"
    >
    <button
      v-if="type === 'password'"
      type="button"
      class="ui-input__reveal"
      :aria-label="revealed ? t('ui.hidePassword') : t('ui.showPassword')"
      :aria-pressed="revealed"
      @click="revealed = !revealed"
    >
      <Icon :name="revealed ? 'eye-off' : 'eye'" />
    </button>
    <span v-else-if="$slots.suffix" class="ui-input__affix"><slot name="suffix" /></span>
  </div>
</template>

<style scoped>
.ui-input {
  display: flex;
  align-items: center;
  min-height: var(--ui-control-h);
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-control);
  color: var(--ui-ink);
  transition: border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-input[data-size="sm"] { min-height: var(--ui-control-h-sm); font-size: var(--ui-text-sm); }
.ui-input[data-size="lg"] { min-height: var(--ui-control-h-lg); font-size: var(--ui-text-lg); }
.ui-input:focus-within { border-color: var(--ui-focus); outline: 2px solid var(--ui-focus); outline-offset: 1px; }
/* :user-invalid: a native constraint failed after the user left the field or submitted (D95). */
.ui-input[data-invalid], .ui-input:has(.ui-input__control:user-invalid) { border-color: var(--ui-danger); }
.ui-input:has(.ui-input__control:disabled) { background: var(--ui-sunk); color: var(--ui-disabled-ink); cursor: not-allowed; }

.ui-input__control {
  flex: 1;
  min-width: 0;
  padding: 0 var(--ui-control-px);
  background: none;
  border: 0;
  outline: 0;
  min-height: inherit;
  /* At least 1rem on touch screens, or the phone zooms the page on focus (D84). */
  font-size: max(var(--ui-field-text-min), 1em);
}
.ui-input__control:disabled { cursor: not-allowed; }
.ui-input__affix { display: inline-flex; align-items: center; padding: 0 var(--ui-space-3); color: var(--ui-muted); }
.ui-input__affix + .ui-input__control { padding-left: 0; }
.ui-input__reveal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--ui-control-h);
  min-height: inherit;
  background: none;
  border: 0;
  color: var(--ui-muted);
  border-radius: var(--ui-radius-control);
}
@media (hover: hover) {
  .ui-input__reveal:hover { color: var(--ui-ink); }
}
</style>
