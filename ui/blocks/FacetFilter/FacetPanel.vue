<script setup lang="ts">
// FacetPanel (D31): the short facets as checkbox lists with live counts, beside a list on wide
// screens. Same model and reads as FacetFilter; its Clear removes only its own facets.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../../Button/Button.vue'
import Checkbox from '../../Checkbox/Checkbox.vue'
import Field from '../../Field/Field.vue'
import type { FacetClause } from './facets'
import { useFacetValues, type FacetSourceProps } from './useFacetValues'

const props = defineProps<FacetSourceProps>()
const emit = defineEmits<{ 'update:modelValue': [clauses: FacetClause[]] }>()

const { t, locale } = useI18n()
const valuesOf = useFacetValues(props)
const short = computed(() => props.facets.filter(facet => facet.short))
const clauseOf = (key: string): FacetClause | undefined => props.modelValue.find(clause => clause.key === key)
const own = computed(() => props.modelValue.some(clause => short.value.some(facet => facet.key === clause.key) && clause.values.length > 0))

/** The facet's ticked values as one clause; none drops it, the facet order of the model is kept. */
function set(key: string, values: (string | number)[]): void {
  const next = values.map(String)
  const current = clauseOf(key)
  const clauses = current
    ? props.modelValue.map(clause => (clause === current ? { ...clause, values: next } : clause))
    : [...props.modelValue, { key, values: next }]
  emit('update:modelValue', clauses.filter(clause => clause.values.length > 0))
}

function clear(): void {
  emit('update:modelValue', props.modelValue.filter(clause => !short.value.some(facet => facet.key === clause.key)))
}
</script>

<template>
  <div class="ui-facet-panel" role="group" :aria-label="t('ui.filters')">
    <Field v-for="facet in short" :key="facet.key" :label="clauseOf(facet.key)?.negate ? `${facet.label} ${t('ui.isNot')}` : facet.label" group class="ui-facet-panel__facet" :data-facet="facet.key">
      <Checkbox
        v-for="value in valuesOf(facet.key)"
        :key="value.value"
        :model-value="clauseOf(facet.key)?.values ?? []"
        :value="value.value"
        :data-state="value.count === 0 && !value.selected ? 'empty' : undefined"
        @update:model-value="values => set(facet.key, values as (string | number)[])"
      >
        <span class="ui-facet-panel__value">{{ value.label }}</span>
        <span v-if="value.count !== undefined" class="ui-facet-panel__count">{{ value.count.toLocaleString(locale) }}</span>
      </Checkbox>
    </Field>
    <Button v-if="own" variant="ghost" size="sm" @click="clear">{{ t('ui.clear') }}</Button>
  </div>
</template>

<style scoped>
.ui-facet-panel { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ui-space-4); }
.ui-facet-panel__facet { align-self: stretch; }
.ui-facet-panel__value { margin-inline-end: var(--ui-space-2); }
.ui-facet-panel__count { color: var(--ui-muted); font-size: var(--ui-text-xs); }
.ui-facet-panel [data-state="empty"] { color: var(--ui-disabled-ink); }
.ui-facet-panel [data-state="empty"] .ui-facet-panel__count { color: inherit; }
</style>
