<script setup lang="ts" generic="Item">
// DetailDrawer: one record in a Sheet, with previous and next through the rows on screen (PDB's
// AgentDetailDrawer, D34). With `target` it subscribes to the open record while it is open, in an
// effect scope of its own that closing ends; without, the page passes the record as `item`.
// ArrowLeft and ArrowRight step while the focus is not in a field.
import { computed, effectScope, onScopeDispose, shallowRef, watch, type EffectScope } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { ApiError, LiveTarget, NetworkError } from '@/api/runtime'
import { useLive, useLiveConnection, type LiveRead } from '@/api/vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Sheet from '../../Sheet/Sheet.vue'
import type { TableKey } from '../../Table/Table.vue'

const props = defineProps<{
  /** The open record's id; null is closed. Use v-model. */
  modelValue: TableKey | null
  /** The ids of the rows on screen, in their order: what previous and next step through. */
  ids: TableKey[]
  title?: string | undefined
  /** The item read, e.g. `live['customers.item']`; subscribed while open. */
  target?: LiveTarget<{ id: string }, Item> | undefined
  /** The record, when the page has it and passes no target. */
  item?: Item | undefined
  /** Reads `?item=<id>` once and writes it while open. */
  syncQuery?: boolean | undefined
  /** In the page flow without a backdrop, always open; docs and previews only (Sheet's inline). */
  inline?: boolean | undefined
}>()

const emit = defineEmits<{ 'update:modelValue': [id: TableKey | null]; close: [] }>()
defineSlots<{
  default?: (props: { item: Item | undefined; loading: boolean; error: ApiError | NetworkError | undefined }) => unknown
  actions?: () => unknown
}>()

const { t } = useI18n()
const heading = computed(() => props.title ?? t('ui.details'))
const position = computed(() => (props.modelValue === null ? -1 : props.ids.indexOf(props.modelValue)))
const previous = computed(() => (position.value > 0 ? props.ids[position.value - 1] : undefined))
const next = computed(() => (position.value >= 0 ? props.ids[position.value + 1] : undefined))
const show = (id: TableKey | null) => emit('update:modelValue', id)

const connection = props.target ? useLiveConnection() : undefined
const live = shallowRef<LiveRead<Item>>()
let scope: EffectScope | undefined
watch(() => props.target !== undefined && props.modelValue !== null, (open) => {
  scope?.stop()
  scope = undefined
  live.value = undefined
  const target = props.target
  if (!open || target === undefined || connection === undefined) return
  scope = effectScope()
  live.value = scope.run(() => useLive(target, () => ({ id: String(props.modelValue ?? '') }), { connection }))
}, { immediate: true })
onScopeDispose(() => scope?.stop())

const item = computed(() => live.value?.data.value ?? props.item)
const loading = computed(() => live.value?.loading.value ?? false)
const error = computed(() => live.value?.error.value)

function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if ((event.target as Element).closest('input, textarea, select, [contenteditable], [role="menu"]')) return
  const id = event.key === 'ArrowLeft' ? previous.value : event.key === 'ArrowRight' ? next.value : undefined
  if (id === undefined) return
  event.preventDefault()
  show(id)
}

if (props.syncQuery) {
  const route = useRoute()
  const router = useRouter()
  const fromUrl = route.query['item']
  if (props.modelValue === null && typeof fromUrl === 'string' && fromUrl !== '') show(props.ids.find((id) => String(id) === fromUrl) ?? fromUrl)
  watch(() => props.modelValue, (id) => {
    const value = id === null ? undefined : String(id)
    if (route.query['item'] === value) return
    const query = { ...route.query }
    if (value === undefined) delete query['item']
    else query['item'] = value
    void router.replace({ query })
  })
}
</script>

<template>
  <Sheet class="ui-detail-drawer" :model-value="modelValue !== null" :title="heading" :inline="inline"
    @update:model-value="(open) => open || show(null)" @close="emit('close')" @keydown="onKeydown">
    <template #header>
      <div class="ui-detail-drawer__header">
        <div class="ui-detail-drawer__heading">
          <h2 class="ui-detail-drawer__title">{{ heading }}</h2>
          <p v-if="position >= 0" class="ui-detail-drawer__position">{{ t('ui.positionOf', { n: position + 1, total: ids.length }) }}</p>
        </div>
        <Button variant="ghost" :label="t('ui.previous')" :disabled="previous === undefined" @click="previous !== undefined && show(previous)">
          <template #icon><Icon name="chevron-left" /></template>
        </Button>
        <Button variant="ghost" :label="t('ui.next')" :disabled="next === undefined" @click="next !== undefined && show(next)">
          <template #icon><Icon name="chevron-right" /></template>
        </Button>
      </div>
    </template>
    <slot :item="item" :loading="loading" :error="error" />
    <template v-if="$slots.actions" #actions><slot name="actions" /></template>
  </Sheet>
</template>

<style scoped>
.ui-detail-drawer__header { display: flex; align-items: center; gap: var(--ui-space-1); }
.ui-detail-drawer__heading { flex: 1; min-width: 0; }
.ui-detail-drawer__title { overflow: hidden; font-size: var(--ui-text-lg); text-overflow: ellipsis; white-space: nowrap; }
.ui-detail-drawer__position { color: var(--ui-muted); font-size: var(--ui-text-xs); }
</style>
