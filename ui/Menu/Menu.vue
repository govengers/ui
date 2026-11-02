<script setup lang="ts">
// Menu: a dropdown list of actions on Popover (role menu): Popover opens, places, follows and
// closes it; Menu renders the items and moves focus with the arrow keys. A '-' item is a divider.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import Popover from '../Popover/Popover.vue'
import type { IconName } from '../Icon/icons'

export interface MenuItem {
  /** The text; '-' renders a separator. */
  label: string
  icon?: IconName | undefined
  danger?: boolean | undefined
  disabled?: boolean | undefined
  /** The livewire call name, rendered as data-action (D23). */
  action?: string | undefined
  to?: RouteLocationRaw | undefined
  run?: (() => void) | undefined
}

withDefaults(defineProps<{
  items: MenuItem[]
  /** Which edge of the menu lines up with the trigger. */
  align?: 'start' | 'end' | undefined
  /** Accessible name of the default trigger and of the menu; default ui.actions. */
  label?: string | undefined
}>(), { align: 'end' })

const { t } = useI18n()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const list = ref<HTMLElement | null>(null)

function enabledItems() {
  return [...(list.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])]
}

const moves: Record<string, (current: number, count: number) => number> = {
  ArrowDown: current => current + 1,
  ArrowUp: (current, count) => (current < 0 ? count : current) - 1,
  Home: () => 0,
  End: (_, count) => count - 1,
}

function onKeydown(event: KeyboardEvent) {
  const move = moves[event.key]
  if (move) {
    event.preventDefault()
    const items = enabledItems()
    const next = move(items.indexOf(document.activeElement as HTMLElement), items.length)
    items[(next + items.length) % items.length]?.focus()
  } else if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
    // Space activates a link item like a button item (Enter already does).
    event.preventDefault()
    event.target.click()
  } else if (event.key === 'Tab') {
    // Leave the menu: focus goes back to the trigger, then Tab moves on from there.
    popover.value?.close()
  }
}

// Close first so focus is back on the trigger before run() opens, say, a confirm Dialog.
function activate(item: MenuItem) {
  popover.value?.close()
  item.run?.()
}

defineExpose({ toggle: () => popover.value?.toggle() })
</script>

<template>
  <Popover ref="popover" class="ui-menu" role="menu" :align="align" :label="label ?? t('ui.actions')" autofocus>
    <template #trigger="{ open, toggle, expanded }">
      <slot name="trigger" :open="open" :toggle="toggle" :expanded="expanded">
        <Button variant="ghost" :label="label ?? t('ui.actions')" v-bind="expanded" @click="toggle">
          <template #icon><Icon name="more-vertical" /></template>
        </Button>
      </slot>
    </template>
    <div ref="list" class="ui-menu__list" @keydown="onKeydown">
      <template v-for="(item, index) in items" :key="index">
        <div v-if="item.label === '-'" role="separator" class="ui-menu__separator" />
        <RouterLink
          v-else-if="item.to && !item.disabled"
          :to="item.to"
          role="menuitem"
          tabindex="-1"
          class="ui-menu__item"
          :data-variant="item.danger ? 'danger' : undefined"
          :data-action="item.action"
          @click="activate(item)"
        >
          <Icon v-if="item.icon" :name="item.icon" />{{ item.label }}
        </RouterLink>
        <button
          v-else
          type="button"
          role="menuitem"
          tabindex="-1"
          class="ui-menu__item"
          :data-variant="item.danger ? 'danger' : undefined"
          :data-action="item.action"
          :disabled="item.disabled"
          @click="activate(item)"
        >
          <Icon v-if="item.icon" :name="item.icon" />{{ item.label }}
        </button>
      </template>
    </div>
  </Popover>
</template>

<style scoped>
.ui-menu__list {
  min-width: 12rem;
  max-width: 20rem;
  padding: var(--ui-space-1);
}

.ui-menu__item {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  width: 100%;
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-3);
  background: none;
  border: 0;
  border-radius: var(--ui-radius-sm);
  color: var(--ui-ink);
  font-size: var(--ui-text-sm);
  text-align: start;
  text-decoration: none;
  white-space: nowrap;
}
.ui-menu__item:hover:not(:disabled), .ui-menu__item:focus-visible { background: var(--ui-surface-2); }
.ui-menu__item:focus-visible { outline-offset: calc(var(--ui-border-width) * -2); }
.ui-menu__item[data-variant="danger"] { color: var(--ui-danger); }
.ui-menu__item:disabled { color: var(--ui-disabled-ink); cursor: not-allowed; }

.ui-menu__separator {
  height: var(--ui-border-width);
  margin: var(--ui-space-1) calc(var(--ui-space-1) * -1);
  background: var(--ui-divider);
}
</style>
