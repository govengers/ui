<script setup lang="ts">
// EmptyState: the centred message where a list has nothing to show or a thing was not found.
// The title defaults to ui.noResults, the icon to 'search': the filtered-list case.
import { useI18n } from 'vue-i18n'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'

withDefaults(defineProps<{
  title?: string | undefined
  description?: string | undefined
  icon?: IconName | undefined
}>(), { icon: 'search' })

const { t } = useI18n()
</script>

<template>
  <div class="ui-empty-state">
    <span class="ui-empty-state__icon"><Icon :name="icon" size="lg" /></span>
    <p class="ui-empty-state__title">{{ title ?? t('ui.noResults') }}</p>
    <div v-if="$slots.default || description" class="ui-empty-state__description"><slot>{{ description }}</slot></div>
    <div v-if="$slots.action" class="ui-empty-state__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.ui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ui-space-2);
  padding: var(--ui-space-12) var(--ui-space-6);
  text-align: center;
  color: var(--ui-muted);
}
.ui-empty-state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ui-space-16);
  height: var(--ui-space-16);
  margin-bottom: var(--ui-space-2);
  border-radius: var(--ui-radius-pill);
  background: var(--ui-surface-2);
}
.ui-empty-state__title { color: var(--ui-ink); font-size: var(--ui-text-md); font-weight: var(--ui-weight-semibold); }
.ui-empty-state__description { max-width: 40ch; font-size: var(--ui-text-sm); }
.ui-empty-state__action { margin-top: var(--ui-space-4); }
</style>
