<script setup lang="ts">
// Avatar: a person's picture, or their initials when there is none or it fails to load, with an
// optional presence dot. The root is one image to assistive technology: name plus status.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  name: string
  src?: string | undefined
  /** The accessible name; defaults to `name`. */
  alt?: string | undefined
  size?: 'sm' | 'md' | 'lg' | undefined
  status?: 'online' | 'offline' | 'busy' | 'none' | undefined
}>(), { size: 'md', status: 'none' })

const { t } = useI18n()
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const initials = computed(() => props.name.trim().split(/\s+/).slice(0, 2).map(word => [...word][0] ?? '').join('').toUpperCase())
const statusLabel = computed(() => ({ online: t('ui.online'), offline: t('ui.offline'), busy: t('ui.busy'), none: '' })[props.status])
const label = computed(() => [props.alt ?? props.name, statusLabel.value].filter(Boolean).join(', '))
</script>

<template>
  <span class="ui-avatar" :data-size="size" role="img" :aria-label="label">
    <img v-if="src && !failed" class="ui-avatar__image" :src="src" alt="" @error="failed = true">
    <span v-else class="ui-avatar__initials">{{ initials }}</span>
    <span v-if="status !== 'none'" class="ui-avatar__status" :data-status="status" />
  </span>
</template>

<style scoped>
.ui-avatar {
  position: relative;
  display: inline-flex;
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  font-size: var(--ui-text-sm);
  vertical-align: middle;
}
.ui-avatar[data-size="sm"] { width: 1.75rem; height: 1.75rem; font-size: var(--ui-text-xs); }
.ui-avatar[data-size="lg"] { width: 3.5rem; height: 3.5rem; font-size: var(--ui-text-lg); }

.ui-avatar__image,
.ui-avatar__initials { width: 100%; height: 100%; border-radius: var(--ui-radius-pill); }
.ui-avatar__image { object-fit: cover; }
.ui-avatar__initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-accent-soft);
  color: var(--ui-on-accent-soft);
  font-weight: var(--ui-weight-semibold);
  line-height: 1;
  user-select: none;
}

.ui-avatar__status {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28%;
  height: 28%;
  border-radius: var(--ui-radius-pill);
  box-shadow: 0 0 0 2px var(--ui-surface);
}
.ui-avatar__status[data-status="online"] { background: var(--ui-success); }
.ui-avatar__status[data-status="offline"] { background: var(--ui-muted); }
.ui-avatar__status[data-status="busy"] { background: var(--ui-danger); }
</style>
