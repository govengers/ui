<script setup lang="ts">
// Icon: one inline SVG from the curated set in icons.ts (D43). Decorative by default; give it a
// label when it is the only content of a control.
import { computed } from 'vue'
import { icons, type IconName } from './icons'

const props = withDefaults(defineProps<{
  name: IconName
  size?: 'sm' | 'md' | 'lg'
  label?: string | undefined
}>(), { size: 'md' })

const markup = computed(() => icons[props.name])
</script>

<template>
  <svg
    class="ui-icon"
    :data-size="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    v-html="markup"
  />
</template>

<style scoped>
.ui-icon {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  flex: none;
  vertical-align: -0.3em;
}
.ui-icon[data-size="sm"] { width: 1em; height: 1em; vertical-align: -0.15em; }
.ui-icon[data-size="lg"] { width: 1.75em; height: 1.75em; }
</style>
