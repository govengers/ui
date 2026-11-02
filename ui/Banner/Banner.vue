<script setup lang="ts">
// Banner: a full-width notice in the shell (connection lost, maintenance, impersonating) or at
// the top of a page (an error with retry). Variants are attributes (D41).
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'

withDefaults(defineProps<{
  variant?: 'info' | 'warning' | 'danger' | 'success' | undefined
  icon?: IconName | undefined
  /** Shows a close button; emits `dismiss`. */
  dismissible?: boolean | undefined
}>(), { variant: 'info' })

defineEmits<{ dismiss: [] }>()
const { t } = useI18n()
const icons: Record<string, IconName> = { info: 'info', warning: 'alert-triangle', danger: 'alert-circle', success: 'check-circle' }
</script>

<template>
  <div class="ui-banner" :data-variant="variant" :role="variant === 'danger' ? 'alert' : 'status'">
    <Icon :name="icon ?? icons[variant]!" class="ui-banner__icon" />
    <div class="ui-banner__text"><slot /></div>
    <div v-if="$slots.action" class="ui-banner__action"><slot name="action" /></div>
    <Button v-if="dismissible" variant="ghost" size="sm" :label="t('ui.close')" @click="$emit('dismiss')">
      <template #icon><Icon name="x" /></template>
    </Button>
  </div>
</template>

<style scoped>
.ui-banner {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  padding: var(--ui-space-2) var(--ui-space-4);
  font-size: var(--ui-text-sm);
  border-bottom: var(--ui-border-width) solid transparent;
}
.ui-banner[data-variant="info"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-banner[data-variant="warning"] { background: var(--ui-warning-soft); color: var(--ui-on-warning-soft); }
.ui-banner[data-variant="danger"] { background: var(--ui-danger-soft); color: var(--ui-on-danger-soft); }
.ui-banner[data-variant="success"] { background: var(--ui-success-soft); color: var(--ui-on-success-soft); }
.ui-banner__icon { flex: none; }
.ui-banner__text { flex: 1; min-width: 0; }
.ui-banner__action { flex: none; }
</style>
