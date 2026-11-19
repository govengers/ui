<script setup lang="ts">
// ColumnsPicker (D34): which columns a table shows, as a Menu-like Popover of Checkboxes with a
// Reset item. Optionally remembered in localStorage per storageKey. Required columns stay on.
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../../Button/Button.vue'
import Checkbox from '../../Checkbox/Checkbox.vue'
import Icon from '../../Icon/Icon.vue'
import Popover from '../../Popover/Popover.vue'
import { defaultStorage, normalize, readStored, writeStored, type ColumnOption } from './columns'

const props = defineProps<{
  columns: ColumnOption[]
  /** The visible column keys (v-model). */
  modelValue: string[]
  /** Remembers the choice in localStorage under this key; Reset forgets it. */
  storageKey?: string | undefined
}>()
const emit = defineEmits<{ 'update:modelValue': [visible: string[]] }>()

const { t } = useI18n()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const list = ref<HTMLElement | null>(null)
// Reset goes back to what the page started with, not to what storage restored.
const defaults = normalize(props.modelValue, props.columns)
const storage = defaultStorage()

const set = (visible: string[]): void => emit('update:modelValue', normalize(visible, props.columns))

if (props.storageKey) {
  const stored = readStored(storage, props.storageKey, props.columns)
  if (stored) set(stored)
  // Only a choice that differs from the page's defaults is kept, so new defaults reach everyone else.
  watch(() => props.modelValue, (visible) => {
    const next = normalize(visible, props.columns)
    writeStored(storage, props.storageKey!, next.join() === defaults.join() ? null : next)
  })
}

function reset(): void {
  set(defaults)
  popover.value?.close()
}

const items = (): HTMLElement[] => [...list.value?.querySelectorAll<HTMLElement>('input:not(:disabled), button') ?? []]
const focusFirst = (): void => void nextTick(() => items()[0]?.focus())

// Like Menu: arrows, Home and End move, Space ticks (native), Tab leaves.
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab') return popover.value?.close()
  const all = items()
  const index = all.indexOf(event.target as HTMLElement)
  const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: all.length - 1 }
  const move = moves[event.key]
  if (move === undefined) return
  event.preventDefault()
  all[(move + all.length) % all.length]?.focus()
}

defineExpose({ open: () => popover.value?.open() })
</script>

<template>
  <Popover ref="popover" align="end" :label="t('ui.columns')" @open="focusFirst">
    <template #trigger="{ toggle, expanded }">
      <Button variant="ghost" :label="t('ui.columns')" v-bind="expanded" @click="toggle">
        <template #icon><Icon name="columns" /></template>
      </Button>
    </template>
    <div ref="list" class="ui-columns-picker" @keydown="onKeydown">
      <Checkbox
        v-for="column in columns"
        :key="column.key"
        :model-value="modelValue"
        :value="column.key"
        :label="column.label"
        :disabled="column.required"
        :data-column="column.key"
        @update:model-value="visible => set((visible as string[]))"
      />
      <div role="separator" class="ui-columns-picker__separator" />
      <button type="button" class="ui-columns-picker__reset" @click="reset">
        <Icon name="refresh" size="sm" />{{ t('ui.reset') }}
      </button>
    </div>
  </Popover>
</template>

<style scoped>
.ui-columns-picker { display: flex; flex-direction: column; min-width: 12rem; padding: var(--ui-space-1) var(--ui-space-3); }
.ui-columns-picker__separator { height: var(--ui-border-width); margin: var(--ui-space-1) calc(var(--ui-space-3) * -1); background: var(--ui-divider); }
.ui-columns-picker__reset {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  min-height: var(--ui-control-h);
  margin-inline: calc(var(--ui-space-2) * -1);
  padding: 0 var(--ui-space-2);
  background: none;
  border: 0;
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-sm);
}
@media (hover: hover) {
  .ui-columns-picker__reset:hover { background: var(--ui-surface-2); }
}
.ui-columns-picker__reset:focus-visible { background: var(--ui-surface-2); }
</style>
