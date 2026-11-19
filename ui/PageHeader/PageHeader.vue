<script setup lang="ts">
// PageHeader: title, subtitle, an optional back link and the page's actions (D32). One primary
// Button at most in the actions slot.
import { type RouteLocationRaw } from 'vue-router'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

defineProps<{
  title: string
  subtitle?: string | undefined
  /** Where "back" goes; renders a ghost icon button before the title. */
  back?: RouteLocationRaw | undefined
  backLabel?: string | undefined
}>()
</script>

<template>
  <header class="ui-page-header">
    <div class="ui-page-header__lead">
      <Button v-if="back" :to="back" variant="ghost" :label="backLabel ?? 'Back'" class="ui-page-header__back">
        <template #icon><Icon name="arrow-left" /></template>
      </Button>
      <div>
        <h1 class="ui-page-header__title"><slot name="title">{{ title }}</slot></h1>
        <p v-if="subtitle || $slots.subtitle" class="ui-page-header__subtitle"><slot name="subtitle">{{ subtitle }}</slot></p>
      </div>
    </div>
    <div v-if="$slots.actions" class="ui-page-header__actions"><slot name="actions" /></div>
    <div v-if="$slots.tabs" class="ui-page-header__tabs"><slot name="tabs" /></div>
  </header>
</template>

<style scoped>
.ui-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ui-space-3) var(--ui-space-6);
}
.ui-page-header__lead { display: flex; align-items: flex-start; gap: var(--ui-space-2); min-width: 0; }
.ui-page-header__back { margin-top: -0.25rem; }
.ui-page-header__title { font-size: var(--ui-text-2xl); overflow-wrap: anywhere; }
.ui-page-header__subtitle { margin-top: var(--ui-space-1); color: var(--ui-muted); }
.ui-page-header__actions { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); align-items: center; }
/* min-width 0: the Tabs strip scrolls sideways inside the header instead of widening the page. */
.ui-page-header__tabs { flex-basis: 100%; min-width: 0; }
@media (max-width: 48rem) {
  .ui-page-header__title { font-size: var(--ui-text-xl); }
  .ui-page-header__actions { flex-basis: 100%; }
}
</style>
