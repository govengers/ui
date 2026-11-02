<script setup lang="ts">
// Switch: an on/off setting that applies at once, a <button role="switch">. Space and Enter toggle
// natively. With `name`, a hidden input inside the button carries the state into a form post and
// the button carries `data-field` so an agent target by field name reaches the clickable element
// (a hidden input is not interactive content, so it may sit in a button).
withDefaults(defineProps<{
  modelValue?: boolean | undefined
  label?: string | undefined
  disabled?: boolean | undefined
  size?: 'sm' | 'md' | undefined
  name?: string | undefined
}>(), { size: 'md' })

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :data-field="name"
    class="ui-switch"
    :data-size="size"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="ui-switch__track"><span class="ui-switch__thumb" /></span>
    <span v-if="label || $slots.default" class="ui-switch__label"><slot>{{ label }}</slot></span>
    <input v-if="name" type="hidden" :name="name" :value="modelValue" :disabled="disabled">
  </button>
</template>

<style scoped>
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-3);
  min-width: var(--ui-control-h);
  min-height: var(--ui-control-h);
  padding: 0;
  background: none;
  border: 0;
  font-size: var(--ui-text-sm);
  text-align: start;
}
.ui-switch:disabled { cursor: not-allowed; opacity: var(--ui-disabled-opacity); }
/* The ring goes around the track, not the whole row. */
.ui-switch:focus-visible { outline: 0; }
.ui-switch:focus-visible > .ui-switch__track {
  outline: calc(2 * var(--ui-border-width)) solid var(--ui-focus);
  outline-offset: calc(2 * var(--ui-border-width));
}

/* Thumb = track height minus a quarter space; it travels the track width minus the track height. */
.ui-switch__track {
  display: flex;
  align-items: center;
  flex: none;
  width: var(--ui-space-10);
  height: var(--ui-space-6);
  padding: calc(var(--ui-space-1) / 2);
  background: var(--ui-border-strong);
  border-radius: var(--ui-radius-pill);
  transition: background-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-switch__thumb {
  width: calc(var(--ui-space-6) - var(--ui-space-1));
  height: calc(var(--ui-space-6) - var(--ui-space-1));
  background: var(--ui-on-accent);
  border-radius: var(--ui-radius-pill);
  box-shadow: var(--ui-shadow-sm);
  transition: transform var(--ui-duration-fast) var(--ui-ease);
}
.ui-switch[aria-checked="true"] > .ui-switch__track { background: var(--ui-accent); }
.ui-switch[aria-checked="true"] .ui-switch__thumb { transform: translateX(calc(var(--ui-space-10) - var(--ui-space-6))); }

.ui-switch[data-size="sm"] > .ui-switch__track { width: var(--ui-space-8); height: var(--ui-space-5); }
.ui-switch[data-size="sm"] .ui-switch__thumb { width: calc(var(--ui-space-5) - var(--ui-space-1)); height: calc(var(--ui-space-5) - var(--ui-space-1)); }
.ui-switch[data-size="sm"][aria-checked="true"] .ui-switch__thumb { transform: translateX(calc(var(--ui-space-8) - var(--ui-space-5))); }
</style>
