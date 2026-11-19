<script setup lang="ts">
// RangePicker: a Grafana-style time range (D34) on Popover. Quick ranges (relative, calendar)
// and an absolute form with two native datetime-local inputs. The value is livewire time values;
// the page ANDs rangeToConditions(field, range) into its filter.
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Button from '../../Button/Button.vue'
import Field from '../../Field/Field.vue'
import Icon from '../../Icon/Icon.vue'
import Input from '../../Input/Input.vue'
import Popover from '../../Popover/Popover.vue'
import { anyTime, calendarQuick, calendarRange, fromLocalInput, fromQuery, labelOf, relativeQuick, relativeRange, sameRange, toLocalInput, toQuery, type TimeRange } from './range'

const props = defineProps<{
  modelValue: TimeRange
  /** Read the range from `?t=` and write it back (`?t=-7d`, `?t=today`, `?t=<from>..<to>`; any time is no `t`). */
  syncQuery?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [range: TimeRange] }>()

const { t, locale } = useI18n()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const list = ref<HTMLElement | null>(null)
const label = computed(() => labelOf(props.modelValue, t, locale.value))
const quick = computed(() => [
  { key: 'any', group: 'any', range: anyTime },
  ...relativeQuick.map(relative => ({ key: relative, group: 'relative', range: relativeRange(relative) })),
  ...calendarQuick.map(key => ({ key, group: 'calendar', range: { from: '', to: '', calendar: key } satisfies TimeRange })),
].map(item => ({ ...item, label: labelOf(item.range, t, locale.value), current: isCurrent(item.range) })))
const from = ref('')
const to = ref('')

function isCurrent(range: TimeRange): boolean {
  return range.calendar ? props.modelValue.calendar === range.calendar : !props.modelValue.calendar && sameRange(props.modelValue, range)
}

function choose(range: TimeRange): void {
  emit('update:modelValue', range.calendar ? calendarRange(range.calendar) : range)
  popover.value?.close()
}

function apply(): void {
  if (from.value === '') return
  emit('update:modelValue', { from: fromLocalInput(from.value), to: fromLocalInput(to.value) })
  popover.value?.close()
}

/** On open: the form shows the current range as instants, focus goes to the current quick range. */
function onOpen(): void {
  from.value = toLocalInput(props.modelValue.from)
  to.value = toLocalInput(props.modelValue.to)
  void nextTick(() => (list.value?.querySelector<HTMLElement>('[aria-checked="true"]') ?? list.value?.querySelector<HTMLElement>('button'))?.focus())
}

// Like Menu: arrows, Home and End move between the quick ranges; Tab moves on into the form.
function onKeydown(event: KeyboardEvent): void {
  const items = [...list.value?.querySelectorAll<HTMLElement>('button') ?? []]
  const index = items.indexOf(event.target as HTMLElement)
  const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 }
  const move = moves[event.key]
  if (move === undefined) return
  event.preventDefault()
  items[(move + items.length) % items.length]?.focus()
}

defineExpose({ open: () => popover.value?.open() })

if (props.syncQuery) {
  const route = useRoute()
  const router = useRouter()
  // By path, so a catch-all route param is not re-encoded (a/b to a%2Fb).
  const write = (range: TimeRange): void => {
    const { t: _, ...query } = route.query
    const text = toQuery(range)
    void router.replace({ path: route.path, hash: route.hash, query: text === '' ? query : { ...query, t: text } })
  }
  // The URL wins on load when it names a range; a URL without one means the initial v-model.
  const initial = fromQuery(route.query['t'])
  if (initial) emit('update:modelValue', initial)
  watch(() => route.query['t'], (text) => {
    const range = fromQuery(text)
    if (range && toQuery(range) !== toQuery(props.modelValue)) emit('update:modelValue', range)
  })
  watch(() => props.modelValue, (range) => {
    if (toQuery(range) !== (route.query['t'] ?? '')) write(range)
  })
}
</script>

<template>
  <Popover ref="popover" :label="t('ui.timeRange')" @open="onOpen">
    <template #trigger="{ toggle, expanded }">
      <Button v-bind="expanded" class="ui-range-picker__trigger" :aria-label="`${t('ui.timeRange')}: ${label}`" @click="toggle">
        <template #icon><Icon name="clock" /></template>
        <span class="ui-range-picker__label">{{ label }}<Icon name="chevron-down" size="sm" /></span>
      </Button>
    </template>
    <div class="ui-range-picker">
      <div ref="list" class="ui-range-picker__quick" role="menu" :aria-label="t('ui.timeRange')" @keydown="onKeydown">
        <template v-for="(item, index) in quick" :key="item.key">
          <div v-if="index > 0 && item.group !== quick[index - 1]?.group" role="separator" class="ui-range-picker__separator" />
          <button
            type="button"
            role="menuitemradio"
            :tabindex="item.current || (index === 0 && !quick.some(other => other.current)) ? 0 : -1"
            class="ui-range-picker__item"
            :aria-checked="item.current"
            :data-range="item.key"
            @click="choose(item.range)"
          >
            {{ item.label }}<Icon v-if="item.current" name="check" size="sm" />
          </button>
        </template>
      </div>
      <form class="ui-range-picker__absolute" @submit.prevent="apply">
        <Field :label="t('ui.from')" required><Input v-model="from" type="datetime-local" name="from" /></Field>
        <Field :label="t('ui.to')" :hint="t('ui.now')"><Input v-model="to" type="datetime-local" name="to" /></Field>
        <Button type="submit" variant="primary" :disabled="from === ''">{{ t('ui.apply') }}</Button>
      </form>
    </div>
  </Popover>
</template>

<style scoped>
/* An absolute range is long: on a narrow phone it wraps inside the button instead of widening the page. */
.ui-range-picker__trigger { max-width: 100%; white-space: normal; line-height: var(--ui-leading-tight); text-align: start; }
.ui-range-picker__label { display: inline-flex; align-items: center; gap: var(--ui-space-2); }
.ui-range-picker { display: flex; flex-wrap: wrap; }
.ui-range-picker__quick { display: flex; flex-direction: column; min-width: 11rem; padding: var(--ui-space-1); }
.ui-range-picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-3);
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-3);
  background: none;
  border: 0;
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-sm);
  text-align: start;
  white-space: nowrap;
}
@media (hover: hover) {
  .ui-range-picker__item:hover { background: var(--ui-surface-2); }
}
.ui-range-picker__item:focus-visible { background: var(--ui-surface-2); outline-offset: calc(var(--ui-border-width) * -2); }
.ui-range-picker__item[aria-checked="true"] { color: var(--ui-accent); font-weight: var(--ui-weight-medium); }
.ui-range-picker__separator { height: var(--ui-border-width); margin: var(--ui-space-1) calc(var(--ui-space-1) * -1); background: var(--ui-divider); }
.ui-range-picker__absolute {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-3);
  width: 16rem;
  padding: var(--ui-space-4);
  border-inline-start: var(--ui-border-width) solid var(--ui-divider);
}
</style>
