<script setup lang="ts">
// Tabs: a tab list or, when the items carry `to`, a nav of router links (counted list tabs).
// modelValue names the active tab in both forms. The tab list uses a roving tabindex: arrows,
// Home and End move focus and select at once (automatic activation). Panels belong to the page.
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Badge from '../Badge/Badge.vue'

export interface TabItem {
  value: string
  label: string
  count?: number
  to?: RouteLocationRaw
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: TabItem[]
  modelValue?: string | undefined
  size?: 'sm' | 'md' | undefined
  /** Accessible name of the tab list or nav, needed when a page has more than one. */
  label?: string | undefined
}>(), { size: 'md' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const routed = computed(() => props.items.every(item => item.to !== undefined))
// The one tab reachable by Tab: the active one, else the first enabled one.
const tabbable = computed(() => props.items.find(item => item.value === props.modelValue && !item.disabled)?.value
  ?? props.items.find(item => !item.disabled)?.value)

function onKeydown(event: KeyboardEvent) {
  const tabs = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')]
  const index = tabs.indexOf(event.target as HTMLButtonElement)
  const moves: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1 }
  const next = moves[event.key]
  if (index < 0 || next === undefined) return
  event.preventDefault()
  const tab = tabs[(next + tabs.length) % tabs.length]!
  tab.focus()
  tab.click()
}
</script>

<template>
  <nav v-if="routed" class="ui-tabs" :data-size="size" :aria-label="label">
    <RouterLink v-for="item in items" :key="item.value" v-slot="{ href, navigate }" :to="item.to!" custom>
      <a
        class="ui-tabs__tab"
        :href="item.disabled ? undefined : href"
        :aria-current="item.value === modelValue ? 'page' : undefined"
        :aria-disabled="item.disabled || undefined"
        @click="!item.disabled && navigate($event)"
      >
        {{ item.label }}
        <Badge v-if="item.count !== undefined" size="sm" pill :variant="item.value === modelValue ? 'accent' : 'neutral'">{{ item.count }}</Badge>
      </a>
    </RouterLink>
  </nav>
  <div v-else class="ui-tabs" :data-size="size" role="tablist" :aria-label="label" @keydown="onKeydown">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      class="ui-tabs__tab"
      :aria-selected="item.value === modelValue"
      :tabindex="item.value === tabbable ? 0 : -1"
      :disabled="item.disabled"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
      <Badge v-if="item.count !== undefined" size="sm" pill :variant="item.value === modelValue ? 'accent' : 'neutral'">{{ item.count }}</Badge>
    </button>
  </div>
</template>

<style scoped>
.ui-tabs {
  display: flex;
  gap: var(--ui-space-1);
  overflow-x: auto;
  box-shadow: inset 0 calc(-1 * var(--ui-border-width)) 0 var(--ui-border);
}
.ui-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2);
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-3);
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--ui-muted);
  font-size: var(--ui-text-sm);
  font-weight: var(--ui-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--ui-duration-fast) var(--ui-ease), border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-tabs[data-size="sm"] .ui-tabs__tab { min-height: var(--ui-control-h-sm); padding: 0 var(--ui-space-2); font-size: var(--ui-text-xs); }
@media (pointer: coarse) { .ui-tabs__tab, .ui-tabs[data-size="sm"] .ui-tabs__tab { min-height: var(--ui-touch-min); } }
/* The list scrolls sideways, which clips an outside ring; draw it inside. */
.ui-tabs__tab:focus-visible { outline-offset: -0.125rem; }

.ui-tabs__tab:hover:not(:disabled, [aria-disabled]) { color: var(--ui-ink); }
.ui-tabs__tab[aria-selected="true"],
.ui-tabs__tab[aria-current="page"] { color: var(--ui-ink); border-bottom-color: var(--ui-accent); }
.ui-tabs__tab:disabled,
.ui-tabs__tab[aria-disabled] { color: var(--ui-disabled-ink); cursor: not-allowed; }
</style>
