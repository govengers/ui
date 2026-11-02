<script setup lang="ts">
// Pagination: offset pages (range, rows per page, first/previous/next/last) or a cursor (previous
// and next only, for lists without a total). Controlled: it emits, the page fetches.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

const props = withDefaults(defineProps<{
  mode?: 'offset' | 'cursor' | undefined
  /** Offset mode: the current page, 1-based. */
  page?: number | undefined
  pageSize?: number | undefined
  total?: number | undefined
  pageSizes?: number[] | undefined
  /** Cursor mode: whether a page exists before and after this one. */
  hasPrevious?: boolean | undefined
  hasNext?: boolean | undefined
  /** Cursor mode: optional text on the left, e.g. "25 of many". */
  label?: string | undefined
}>(), { mode: 'offset', page: 1, pageSize: 25, total: 0, pageSizes: () => [25, 50, 100] })

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
  previous: []
  next: []
}>()

const { t } = useI18n()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.page * props.pageSize, props.total))
const sizes = computed(() => (props.pageSizes.includes(props.pageSize) ? props.pageSizes : [...props.pageSizes, props.pageSize].sort((a, b) => a - b)))

function resize(event: Event) {
  const size = Number((event.target as HTMLSelectElement).value)
  emit('update:pageSize', size)
  // Keep the first visible row on screen instead of landing past the end.
  emit('update:page', Math.floor(Math.max(from.value - 1, 0) / size) + 1)
}
</script>

<template>
  <nav class="ui-pagination" :aria-label="t('ui.pagination')">
    <template v-if="mode === 'offset'">
      <p class="ui-pagination__text" aria-live="polite">{{ t('ui.rangeOf', { from, to, total }) }}</p>
      <div class="ui-pagination__controls">
        <label class="ui-pagination__size">
          {{ t('ui.rowsPerPage') }}
          <select class="ui-pagination__select" :value="pageSize" @change="resize">
            <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <div class="ui-pagination__pages">
          <Button variant="ghost" :label="t('ui.first')" :disabled="page <= 1" @click="emit('update:page', 1)"><template #icon><Icon name="chevrons-left" /></template></Button>
          <Button variant="ghost" :label="t('ui.previous')" :disabled="page <= 1" @click="emit('update:page', page - 1)"><template #icon><Icon name="chevron-left" /></template></Button>
          <span class="ui-pagination__page">{{ t('ui.pageOf', { page, pages }) }}</span>
          <Button variant="ghost" :label="t('ui.next')" :disabled="page >= pages" @click="emit('update:page', page + 1)"><template #icon><Icon name="chevron-right" /></template></Button>
          <Button variant="ghost" :label="t('ui.last')" :disabled="page >= pages" @click="emit('update:page', pages)"><template #icon><Icon name="chevrons-right" /></template></Button>
        </div>
      </div>
    </template>
    <template v-else>
      <p v-if="label" class="ui-pagination__text">{{ label }}</p>
      <div class="ui-pagination__controls">
        <Button variant="ghost" :label="t('ui.previous')" :disabled="!hasPrevious" @click="emit('previous')"><template #icon><Icon name="chevron-left" /></template></Button>
        <Button variant="ghost" :label="t('ui.next')" :disabled="!hasNext" @click="emit('next')"><template #icon><Icon name="chevron-right" /></template></Button>
      </div>
    </template>
  </nav>
</template>

<style scoped>
.ui-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-2) var(--ui-space-4);
  color: var(--ui-muted);
  font-size: var(--ui-text-sm);
}
.ui-pagination__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-1); margin-inline-start: auto; }
.ui-pagination__pages { display: flex; align-items: center; gap: var(--ui-space-1); }
.ui-pagination__size { display: inline-flex; align-items: center; gap: var(--ui-space-2); margin-inline-end: var(--ui-space-3); }
.ui-pagination__select {
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-2);
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-control);
  color: var(--ui-ink);
}
.ui-pagination__page { padding: 0 var(--ui-space-2); color: var(--ui-ink-2); white-space: nowrap; }
</style>
