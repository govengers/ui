<script setup lang="ts">
// FacetFilter (D31): a filter button with a count, one chip per facet with ticked values, "Add
// filter" and Clear, and a cascade with live counts that ignore the facet's own selection. OR
// inside a facet, AND across facets, "is not" per chip. The page turns the clauses into its
// list's filter with toFilterDocument (facets.ts).
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Badge from '../../Badge/Badge.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Popover from '../../Popover/Popover.vue'
import FacetCascade from './FacetCascade.vue'
import { chipText, fromQuery, toggleValue, toQuery, valueLabel, valuesText, withQuery, type FacetClause } from './facets'
import { useFacetValues, type FacetSourceProps } from './useFacetValues'

const props = defineProps<FacetSourceProps & {
  /** Read the clauses from the URL query and write them back (`?status=active,onHold`, `?tags.not=trial`). */
  syncQuery?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [clauses: FacetClause[]] }>()

const { t, locale } = useI18n()
const valuesOf = useFacetValues(props)
const popover = ref<InstanceType<typeof Popover> | null>(null)
const cascade = ref<InstanceType<typeof FacetCascade> | null>(null)

const chips = computed(() => props.modelValue.flatMap((clause) => {
  const facet = props.facets.find(item => item.key === clause.key)
  if (!facet || clause.values.length === 0) return []
  return [{ facet, clause, text: chipText(facet, clause, t, locale.value), values: valuesText(facet, clause, t, locale.value), all: clause.values.map(value => valueLabel(facet, value)).join(', ') }]
}))
const unused = computed(() => props.facets.find(facet => !chips.value.some(chip => chip.facet.key === facet.key)))

const update = (clauses: FacetClause[]): void => emit('update:modelValue', clauses)
const toggle = (key: string, value: string): void => update(toggleValue(props.modelValue, key, value))
const negate = (key: string): void => update(props.modelValue.map(clause => (clause.key === key ? { ...clause, negate: !clause.negate } : clause)))
const remove = (key: string): void => update(props.modelValue.filter(clause => clause.key !== key))

/** Opens the cascade inside a facet; a chip or "Add filter" always opens, the button toggles. */
function openAt(key: string): void {
  popover.value?.open()
  void nextTick(() => cascade.value?.enter(key))
}
function onButton(toggleOpen: () => void): void {
  toggleOpen()
  void nextTick(() => cascade.value?.enter(undefined))
}

defineExpose({ open: openAt })

if (props.syncQuery) {
  const route = useRoute()
  const router = useRouter()
  // By path, so a catch-all route param is not re-encoded (a/b to a%2Fb).
  const write = (clauses: readonly FacetClause[]): void => { void router.replace({ path: route.path, hash: route.hash, query: withQuery(route.query, clauses, props.facets) }) }
  // Order-free: the URL lists facets in definition order, the chips keep the order they were added in.
  const key = (clauses: readonly FacetClause[]): string => JSON.stringify(Object.entries(toQuery(clauses)).sort())
  const same = (left: readonly FacetClause[], right: readonly FacetClause[]): boolean => key(left) === key(right)
  // The URL wins on load when it names a facet; a URL without one means the initial v-model.
  const initial = fromQuery(route.query, props.facets)
  if (initial.length > 0) update(initial)
  // Back and forward: the URL's clauses become the model; a change of the model replaces the URL.
  watch(() => route.query, (query) => {
    const clauses = fromQuery(query, props.facets)
    if (!same(clauses, props.modelValue)) update(clauses)
  })
  watch(() => props.modelValue, (clauses) => {
    if (!same(clauses, fromQuery(route.query, props.facets))) write(clauses)
  })
}
</script>

<template>
  <Popover ref="popover" :label="t('ui.filters')">
    <template #trigger="{ toggle: toggleOpen, expanded }">
      <div class="ui-facet-filter" role="group" :aria-label="t('ui.filters')">
        <Button data-action="filter" v-bind="expanded" @click="onButton(toggleOpen)">
          <template #icon><Icon name="filter" /></template>
          {{ t('ui.filters') }}
          <Badge v-if="chips.length" variant="accent" size="sm" pill>{{ chips.length }}</Badge>
        </Button>
        <span v-for="chip in chips" :key="chip.facet.key" class="ui-facet-filter__chip" :data-facet="chip.facet.key" :title="chip.all">
          <span class="ui-facet-filter__name">{{ chip.facet.label }}</span>
          <button type="button" class="ui-facet-filter__op" :aria-pressed="Boolean(chip.clause.negate)" :aria-label="`${chip.facet.label} ${t('ui.isNot')}`" @click="negate(chip.facet.key)">
            {{ t(chip.clause.negate ? 'ui.isNot' : 'ui.is') }}
          </button>
          <button type="button" class="ui-facet-filter__values" :aria-label="chip.text" @click="openAt(chip.facet.key)">
            {{ chip.values }}
          </button>
          <button type="button" class="ui-facet-filter__remove" :aria-label="`${t('ui.remove')}: ${chip.text}`" @click="remove(chip.facet.key)">
            <Icon name="x" size="sm" />
          </button>
        </span>
        <template v-if="chips.length">
          <Button v-if="unused" variant="ghost" size="sm" @click="openAt(unused.key)">
            <template #icon><Icon name="plus" /></template>{{ t('ui.addFilter') }}
          </Button>
          <Button variant="ghost" size="sm" @click="update([])">{{ t('ui.clear') }}</Button>
        </template>
      </div>
    </template>
    <FacetCascade ref="cascade" :facets="facets" :clauses="modelValue" :values-of="valuesOf" @toggle="toggle" @leave="popover?.close()" />
  </Popover>
</template>

<style scoped>
.ui-facet-filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-2); }

/* One chip per facet: name, the is / is not switch, the values (reopens the cascade), the cross. */
.ui-facet-filter__chip {
  display: inline-flex;
  align-items: stretch;
  min-height: var(--ui-control-h-sm);
  max-width: 100%;
  background: var(--ui-accent-soft);
  color: var(--ui-on-accent-soft);
  border-radius: var(--ui-radius-control);
  font-size: var(--ui-text-sm);
}
.ui-facet-filter__name { display: inline-flex; align-items: center; padding-inline: var(--ui-space-3) var(--ui-space-1); font-weight: var(--ui-weight-medium); }
.ui-facet-filter__op, .ui-facet-filter__values, .ui-facet-filter__remove {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--ui-space-1);
  background: none;
  border: 0;
  border-radius: var(--ui-radius-sm);
  color: inherit;
}
.ui-facet-filter__op { text-decoration: underline dotted; text-underline-offset: 0.2em; }
.ui-facet-filter__op[aria-pressed="true"] { margin-block: var(--ui-space-1); background: var(--ui-danger-soft); color: var(--ui-on-danger-soft); font-weight: var(--ui-weight-medium); }
.ui-facet-filter__values { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; line-height: var(--ui-control-h-sm); }
.ui-facet-filter__remove { padding-inline: var(--ui-space-2); }
.ui-facet-filter__op:hover, .ui-facet-filter__values:hover, .ui-facet-filter__remove:hover { background: var(--ui-surface-2); }
.ui-facet-filter__op:focus-visible, .ui-facet-filter__values:focus-visible, .ui-facet-filter__remove:focus-visible { outline-offset: calc(var(--ui-border-width) * -2); }
</style>
