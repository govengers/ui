<script setup lang="ts">
// CommandPalette: the Cmd/Ctrl+K dialog. Empty, it offers the recent picks and the quick actions
// of the agent action registry; typing searches every group (one livewire query each, newest
// answer wins) and filters the actions. One keydown handler on the dialog runs the keyboard.
import { computed, onMounted, onScopeDispose, ref, shallowRef, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLiveConnection } from '@/api/vue'
import Icon from '../../Icon/Icon.vue'
import type { IconName } from '../../Icon/icons'
import { boundActions, type BoundAction } from '../../agent/registry'
import { addRecent, humanize, matchActions, moveActive, readRecent, type PaletteGroup, type PaletteResult, type RecentPick } from './palette'

const props = withDefaults(defineProps<{
  groups: PaletteGroup[]
  /** The key that opens it with Cmd or Ctrl; empty for none. */
  hotkey?: string | undefined
  /** The localStorage key of the recent picks; empty keeps none. */
  storageKey?: string | undefined
  placeholder?: string | undefined
  /** Shown in the page flow without showModal(): no backdrop, no focus trap. Docs and previews only. */
  inline?: boolean | undefined
}>(), { hotkey: 'k', storageKey: 'ui.palette.recent' })

const emit = defineEmits<{ select: [pick: RecentPick] }>()
const open = defineModel<boolean>('open', { default: false })

interface Option {
  id: string
  icon: IconName
  label: string
  hint: string | undefined
  /** The action's livewire call name, as data-action (D23). */
  action?: string | undefined
  run: () => void
}
interface Section {
  key: string
  label: string
  options: Option[]
  state: 'ready' | 'loading' | 'failed'
}

const { t } = useI18n()
const uid = useId()
const connection = useLiveConnection()
const dialog = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const text = ref('')
const active = ref(-1)
const storage = (): Storage | undefined => (typeof localStorage === 'undefined' ? undefined : localStorage)
const recent = ref<RecentPick[]>(props.storageKey ? readRecent(storage(), props.storageKey) : [])
const found = shallowRef<Record<string, { state: Section['state']; results: PaletteResult[] }>>({})

// Searches: 150 ms after the last key, every group at once; a newer text aborts the older reads.
let debounce: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
watch(text, (value) => {
  clearTimeout(debounce)
  controller?.abort()
  active.value = value.trim() === '' ? -1 : 0
  if (value.trim() === '') {
    found.value = {}
    return
  }
  found.value = Object.fromEntries(props.groups.map((group) => [group.key, { state: 'loading' as const, results: found.value[group.key]?.results ?? [] }]))
  debounce = setTimeout(() => search(value.trim()), 150)
})

function search(query: string): void {
  const current = new AbortController()
  controller = current
  for (const group of props.groups) {
    group.search(connection.value, query, current.signal).then(
      (results) => settle(group.key, current, { state: 'ready', results }),
      () => settle(group.key, current, { state: 'failed', results: [] }),
    )
  }
}

function settle(key: string, from: AbortController, entry: { state: Section['state']; results: PaletteResult[] }): void {
  if (from !== controller || from.signal.aborted) return
  found.value = { ...found.value, [key]: entry }
}

function pick(group: string, result: PaletteResult): void {
  const entry: RecentPick = { group, ...result }
  recent.value = addRecent(recent.value, entry)
  if (props.storageKey) storage()?.setItem(props.storageKey, JSON.stringify(recent.value))
  close()
  emit('select', entry)
}

function runAction(action: BoundAction): void {
  close()
  void action.run({})
}

const actionOptions = computed<Option[]>(() => matchActions(boundActions(), text.value).slice(0, 8).map((action) => ({
  id: `action:${action.name}`, icon: 'zap', label: humanize(action.name), hint: action.description, action: action.name, run: () => runAction(action),
})))

const sections = computed<Section[]>(() => {
  const empty = text.value.trim() === ''
  const groupLabel = (key: string): string => props.groups.find((group) => group.key === key)?.label ?? key
  const out: Section[] = []
  if (empty && recent.value.length > 0) {
    out.push({ key: 'recent', label: t('ui.recent'), state: 'ready', options: recent.value.map((entry) => ({
      id: `recent:${entry.group}:${entry.id}`, icon: 'history', label: entry.label, hint: entry.hint ?? groupLabel(entry.group), run: () => pick(entry.group, entry),
    })) })
  }
  if (actionOptions.value.length > 0) out.push({ key: 'actions', label: t('ui.quickActions'), state: 'ready', options: actionOptions.value })
  if (!empty) {
    for (const group of props.groups) {
      const entry = found.value[group.key] ?? { state: 'loading' as const, results: [] }
      out.push({ key: group.key, label: group.label, state: entry.state, options: entry.results.map((result) => ({
        id: `${group.key}:${result.id}`, icon: 'arrow-right', label: result.label, hint: result.hint, run: () => pick(group.key, result),
      })) })
    }
  }
  return out
})
const options = computed(() => sections.value.flatMap((section) => section.options))
const optionId = (index: number): string => `${uid}-option-${index}`
const indexOf = (option: Option): number => options.value.indexOf(option)
const nothing = computed(() => text.value.trim() !== '' && options.value.length === 0 && sections.value.every((section) => section.state !== 'loading'))
watch(() => options.value.length, (count) => {
  if (active.value >= count) active.value = count - 1
})

// One handler on the dialog: arrows, Home, End and Enter; Escape is the dialog's own cancel.
function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing) return
  if (event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    options.value[active.value]?.run()
    return
  }
  const next = moveActive(active.value, options.value.length, event.key)
  if (next === undefined || ((event.key === 'Home' || event.key === 'End') && text.value !== '')) return
  event.preventDefault()
  event.stopPropagation()
  active.value = next
  document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' })
}

function close(): void {
  input.value?.blur()
  open.value = false
}

function sync(value: boolean): void {
  const element = dialog.value
  if (props.inline) return
  if (value && element && !element.open) {
    text.value = ''
    active.value = -1
    element.showModal()
    input.value?.focus()
  } else if (!value && element?.open) {
    element.close()
  }
}
watch(open, sync, { flush: 'post' })
onMounted(() => sync(open.value))

function onGlobalKey(event: KeyboardEvent): void {
  if (!props.hotkey || event.isComposing || event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey)) return
  if (event.key.toLowerCase() !== props.hotkey.toLowerCase()) return
  event.preventDefault()
  open.value = !open.value
}
window.addEventListener('keydown', onGlobalKey)
onScopeDispose(() => {
  window.removeEventListener('keydown', onGlobalKey)
  clearTimeout(debounce)
  controller?.abort()
})

// A backdrop click closes only when the press started on the backdrop too (not a drag out of the input).
let pressedBackdrop = false
function onPointerdown(event: PointerEvent): void {
  pressedBackdrop = event.target === dialog.value
}
function onBackdropClick(event: MouseEvent): void {
  if (!props.inline && pressedBackdrop && event.target === dialog.value) close()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="ui-command-palette"
    :open="inline || undefined"
    :data-inline="inline || undefined"
    :aria-label="t('ui.commandPalette')"
    @close="open = false"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @click="onBackdropClick"
  >
    <div class="ui-command-palette__search">
      <Icon name="search" class="ui-command-palette__icon" />
      <input
        ref="input"
        v-model="text"
        class="ui-command-palette__input"
        type="text"
        name="palette"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        aria-autocomplete="list"
        aria-expanded="true"
        :aria-controls="`${uid}-list`"
        :aria-activedescendant="active >= 0 ? optionId(active) : undefined"
        :aria-label="t('ui.commandPalette')"
        :placeholder="placeholder ?? t('ui.paletteSearch')"
      >
      <kbd class="ui-command-palette__kbd">Esc</kbd>
    </div>
    <div :id="`${uid}-list`" class="ui-command-palette__list" role="listbox" :aria-label="t('ui.results')">
      <div v-for="section in sections" :key="section.key" role="group" class="ui-command-palette__group" :aria-labelledby="`${uid}-${section.key}`">
        <div :id="`${uid}-${section.key}`" role="presentation" class="ui-command-palette__heading">
          {{ section.label }}
          <Icon v-if="section.state === 'loading'" name="loader" size="sm" class="ui-command-palette__spinner" />
          <span v-else-if="section.state === 'failed'" class="ui-command-palette__failed">{{ t('ui.searchFailed') }}</span>
        </div>
        <div
          v-for="option in section.options"
          :id="optionId(indexOf(option))"
          :key="option.id"
          role="option"
          class="ui-command-palette__option"
          :aria-selected="indexOf(option) === active"
          :data-action="option.action"
          @pointermove="active = indexOf(option)"
          @mousedown.prevent
          @click="option.run()"
        >
          <Icon :name="option.icon" size="sm" class="ui-command-palette__option-icon" />
          <span class="ui-command-palette__label">{{ option.label }}</span>
          <span v-if="option.hint" class="ui-command-palette__hint">{{ option.hint }}</span>
        </div>
      </div>
      <p v-if="nothing" class="ui-command-palette__nothing" role="status">{{ t('ui.noResults') }}</p>
      <p v-else-if="options.length === 0 && text.trim() === ''" class="ui-command-palette__nothing">{{ t('ui.paletteEmpty') }}</p>
    </div>
    <p class="ui-command-palette__footer">{{ t('ui.paletteKeys') }}</p>
  </dialog>
</template>

<style scoped>
.ui-command-palette {
  width: calc(100% - 2 * var(--ui-space-4));
  max-width: 40rem;
  max-height: min(32rem, calc(100dvh - 2 * var(--ui-space-8)));
  margin: 12dvh auto auto;
  padding: 0;
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  background: var(--ui-surface);
  color: var(--ui-ink);
  box-shadow: var(--ui-shadow-lg);
}
.ui-command-palette[open] { display: flex; flex-direction: column; }
.ui-command-palette[data-inline] { position: static; margin: 0; }
.ui-command-palette::backdrop { background: var(--ui-scrim); }
.ui-command-palette__search { display: flex; align-items: center; gap: var(--ui-space-3); padding: 0 var(--ui-space-4); border-block-end: var(--ui-border-width) solid var(--ui-divider); }
.ui-command-palette__icon { flex: none; color: var(--ui-muted); }
.ui-command-palette__input { flex: 1; min-width: 0; height: var(--ui-control-h-lg); padding: 0; border: 0; background: none; font-size: var(--ui-text-lg); }
.ui-command-palette__input:focus-visible { outline: none; }
.ui-command-palette__kbd, .ui-command-palette__footer { color: var(--ui-muted); font-size: var(--ui-text-xs); }
.ui-command-palette__kbd { padding: 0 var(--ui-space-1); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-sm); }
.ui-command-palette__list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: var(--ui-space-2); }
.ui-command-palette__group + .ui-command-palette__group { margin-block-start: var(--ui-space-2); }
.ui-command-palette__heading {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  padding: var(--ui-space-1) var(--ui-space-2);
  color: var(--ui-muted);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-semibold);
  letter-spacing: var(--ui-tracking-caps);
  text-transform: uppercase;
}
.ui-command-palette__failed { color: var(--ui-danger); text-transform: none; letter-spacing: normal; font-weight: var(--ui-weight-normal); }
.ui-command-palette__option {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-2);
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
}
.ui-command-palette__option[aria-selected="true"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-command-palette__option-icon { flex: none; color: var(--ui-muted); }
.ui-command-palette__label { flex: none; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-command-palette__hint { flex: 1; min-width: 0; overflow: hidden; color: var(--ui-muted); font-size: var(--ui-text-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-command-palette__option[aria-selected="true"] :is(.ui-command-palette__hint, .ui-command-palette__option-icon) { color: inherit; }
.ui-command-palette__nothing { padding: var(--ui-space-6) var(--ui-space-2); color: var(--ui-muted); text-align: center; }
.ui-command-palette__footer { padding: var(--ui-space-2) var(--ui-space-4); border-block-start: var(--ui-border-width) solid var(--ui-divider); }
@media (prefers-reduced-motion: no-preference) {
  .ui-command-palette__spinner { animation: ui-command-palette-spin 1s linear infinite; }
}
@keyframes ui-command-palette-spin { to { transform: rotate(360deg); } }
</style>
