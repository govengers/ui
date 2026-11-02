<script setup lang="ts">
// Card: one surface with an optional header (title and actions), a body and a footer. With `to`
// the whole card is a RouterLink. `flush` drops the body padding so a Table fills the card.
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  title?: string
  as?: 'div' | 'article' | 'section'
  flush?: boolean
  interactive?: boolean
  to?: RouteLocationRaw
}>(), { as: 'div' })

const tag = computed(() => (props.to ? RouterLink : props.as))
</script>

<template>
  <component
    :is="tag"
    class="ui-card"
    :to="to"
    :data-flush="flush || undefined"
    :data-interactive="interactive || to ? true : undefined"
  >
    <div v-if="title || $slots.header || $slots.actions" class="ui-card__header">
      <slot name="header"><h2 v-if="title" class="ui-card__title">{{ title }}</h2></slot>
      <div v-if="$slots.actions" class="ui-card__actions"><slot name="actions" /></div>
    </div>
    <div class="ui-card__body"><slot /></div>
    <div v-if="$slots.footer" class="ui-card__footer"><slot name="footer" /></div>
  </component>
</template>

<style scoped>
.ui-card {
  display: flex;
  flex-direction: column;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--ui-shadow-sm);
  color: var(--ui-ink);
  text-decoration: none;
  overflow: hidden;
}
.ui-card[data-interactive] {
  cursor: pointer;
  transition: box-shadow var(--ui-duration-fast) var(--ui-ease), transform var(--ui-duration-fast) var(--ui-ease), border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-card[data-interactive]:hover { box-shadow: var(--ui-shadow-md); border-color: var(--ui-border-strong); transform: translateY(-0.125rem); }

.ui-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-3);
  padding: var(--ui-card-p) var(--ui-card-p) 0;
}
.ui-card[data-flush] .ui-card__header { padding-bottom: var(--ui-card-p); }
.ui-card__title { font-size: var(--ui-text-lg); }
.ui-card__actions { display: flex; align-items: center; gap: var(--ui-space-2); margin-left: auto; margin-block: calc(-1 * var(--ui-space-2)); }

.ui-card__body { flex: 1; padding: var(--ui-card-p); }
.ui-card[data-flush] .ui-card__body { padding: 0; }

.ui-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ui-space-2);
  padding: var(--ui-space-3) var(--ui-card-p);
  border-top: var(--ui-border-width) solid var(--ui-divider);
}
</style>
