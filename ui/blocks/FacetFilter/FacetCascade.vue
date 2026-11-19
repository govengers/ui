<script setup lang="ts">
// FacetCascade: the content of FacetFilter's Popover (D31). Left the facets, right the values of
// the active one with their live counts, in a fixed order; zero counts dimmed unless ticked; a
// value search on facets that are not short. Arrows move inside a column, Right and Left between
// them, Space ticks, Escape closes (the platform), Tab leaves.
import { computed, nextTick, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Badge from '../../Badge/Badge.vue'
import Icon from '../../Icon/Icon.vue'
import Input from '../../Input/Input.vue'
import type { FacetClause, FacetDefinition, FacetValue } from './facets'

const props = defineProps<{
  facets: FacetDefinition[]
  clauses: FacetClause[]
  valuesOf: (key: string) => FacetValue[]
}>()
const emit = defineEmits<{ toggle: [key: string, value: string]; leave: [] }>()

const { t, locale } = useI18n()
const id = useId()
const panel = ref<HTMLElement | null>(null)
const active = ref('')
const query = ref('')
const facet = computed(() => props.facets.find(item => item.key === active.value))
const shown = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  const values = props.valuesOf(active.value)
  return needle ? values.filter(value => value.label.toLocaleLowerCase().includes(needle)) : values
})
const ticked = (key: string): number => props.clauses.find(clause => clause.key === key)?.values.length ?? 0

function activate(key: string): void {
  if (active.value === key) return
  active.value = key
  query.value = ''
}

const items = (part: 'field' | 'value'): HTMLElement[] => [...panel.value?.querySelectorAll<HTMLElement>(`.ui-facet-cascade__${part}`) ?? []]
const search = (): HTMLElement | null => panel.value?.querySelector<HTMLElement>('.ui-facet-cascade__search input') ?? null
const focusField = (): void => items('field').find(item => item.dataset['facet'] === active.value)?.focus()
const focusValues = (): void => (search() ?? items('value')[0])?.focus()

/** Shows a facet: with focus on its values, or on the facet itself (the first one by default). */
function enter(key: string | undefined): void {
  activate(key ?? props.facets[0]?.key ?? '')
  void nextTick(key ? focusValues : focusField)
}

function choose(key: string): void {
  activate(key)
  void nextTick(focusValues)
}

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement
  if (event.key === 'Tab') return emit('leave') // closed, focus is back on the trigger, Tab moves on from there
  if (target === search()) {
    if (event.key === 'ArrowDown') items('value')[0]?.focus()
    return
  }
  const inFields = target.classList.contains('ui-facet-cascade__field')
  const list = items(inFields ? 'field' : 'value')
  const index = list.indexOf(target)
  const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 }
  const move = moves[event.key]
  if (move !== undefined) {
    event.preventDefault()
    if (move < 0 && !inFields && search()) return search()?.focus()
    const next = list[(move + list.length) % list.length]
    next?.focus()
    if (inFields && next) activate(next.dataset['facet'] ?? '')
  } else if (inFields && ['ArrowRight', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    focusValues()
  } else if (!inFields && event.key === 'ArrowLeft') {
    event.preventDefault()
    focusField()
  }
}

defineExpose({ enter })
</script>

<template>
  <div ref="panel" class="ui-facet-cascade" @keydown="onKeydown">
    <div class="ui-facet-cascade__fields" role="menu" :aria-label="t('ui.filters')">
      <button
        v-for="item in facets"
        :key="item.key"
        type="button"
        role="menuitem"
        tabindex="-1"
        aria-haspopup="menu"
        :aria-expanded="item.key === active"
        :aria-controls="id"
        class="ui-facet-cascade__field"
        :data-facet="item.key"
        :data-state="item.key === active ? 'active' : undefined"
        @pointerenter="activate(item.key)"
        @click="choose(item.key)"
      >
        <span class="ui-facet-cascade__label">{{ item.label }}</span>
        <Badge v-if="ticked(item.key)" variant="accent" size="sm" pill>{{ ticked(item.key) }}</Badge>
        <Icon name="chevron-right" size="sm" />
      </button>
    </div>
    <div class="ui-facet-cascade__values">
      <div v-if="facet && !facet.short" class="ui-facet-cascade__search">
        <Input v-model="query" type="search" size="sm" :placeholder="t('ui.search')" :aria-label="`${t('ui.search')}: ${facet.label}`" />
      </div>
      <div :id="id" class="ui-facet-cascade__list" role="menu" :aria-label="facet?.label">
        <button
          v-for="value in shown"
          :key="value.value"
          type="button"
          role="menuitemcheckbox"
          tabindex="-1"
          class="ui-facet-cascade__value"
          :aria-checked="value.selected"
          :data-value="value.value"
          :data-state="value.count === 0 && !value.selected ? 'empty' : undefined"
          @click="emit('toggle', active, value.value)"
        >
          <span class="ui-facet-cascade__box" aria-hidden="true"><Icon v-if="value.selected" name="check" size="sm" /></span>
          <span class="ui-facet-cascade__label">{{ value.label }}</span>
          <span v-if="value.count !== undefined" class="ui-facet-cascade__count">{{ value.count.toLocaleString(locale) }}</span>
        </button>
        <p v-if="shown.length === 0" class="ui-facet-cascade__empty">{{ t('ui.noMatches') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Popover's panel scrolls; the facets and the value search stay put while the values scroll. */
.ui-facet-cascade { display: flex; align-items: flex-start; }
.ui-facet-cascade__fields { position: sticky; top: 0; flex: none; min-width: 10rem; padding: var(--ui-space-1); }
.ui-facet-cascade__values { align-self: stretch; width: 16rem; min-width: 0; border-inline-start: var(--ui-border-width) solid var(--ui-divider); }
.ui-facet-cascade__search { position: sticky; top: 0; z-index: 1; padding: var(--ui-space-2) var(--ui-space-2) var(--ui-space-1); background: var(--ui-surface); }
.ui-facet-cascade__fields, .ui-facet-cascade__list { display: flex; flex-direction: column; }
.ui-facet-cascade__list { padding: var(--ui-space-1); }

.ui-facet-cascade__field, .ui-facet-cascade__value {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  flex: none;
  width: 100%;
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-3);
  background: none;
  border: 0;
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-sm);
  text-align: start;
}
@media (hover: hover) {
  .ui-facet-cascade__field:hover, .ui-facet-cascade__value:hover { background: var(--ui-surface-2); }
}
.ui-facet-cascade__field:focus-visible, .ui-facet-cascade__value:focus-visible { background: var(--ui-surface-2); }
.ui-facet-cascade__field[data-state="active"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-facet-cascade__field:focus-visible, .ui-facet-cascade__value:focus-visible { outline-offset: calc(var(--ui-border-width) * -2); }
.ui-facet-cascade__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ui-facet-cascade__box {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--ui-space-4);
  height: var(--ui-space-4);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
}
.ui-facet-cascade__value[aria-checked="true"] .ui-facet-cascade__box { background: var(--ui-accent); border-color: var(--ui-accent); color: var(--ui-on-accent); }
.ui-facet-cascade__count { color: var(--ui-muted); font-size: var(--ui-text-xs); }
.ui-facet-cascade__value[data-state="empty"] { color: var(--ui-disabled-ink); }
.ui-facet-cascade__value[data-state="empty"] .ui-facet-cascade__count { color: inherit; }
.ui-facet-cascade__empty { padding: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
