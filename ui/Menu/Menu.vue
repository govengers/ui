<script setup lang="ts">
// Menu: a dropdown on the native popover attribute (D9): light dismiss, Escape and focus return
// come from the platform. Script places it from the trigger's box (below, flipped above when there
// is no room, kept inside the viewport) and follows the trigger while open; arrow keys move focus.
import { onBeforeUnmount, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
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

const props = withDefaults(defineProps<{
  items: MenuItem[]
  /** Which edge of the menu lines up with the trigger. */
  align?: 'start' | 'end'
  /** Accessible name of the default trigger and of the menu; default ui.actions. */
  label?: string | undefined
}>(), { align: 'end' })

const { t } = useI18n()
const id = useId()
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const open = ref(false)
const gap = 4

function isOpen() {
  return panel.value?.matches(':popover-open') ?? false
}

function enabledItems() {
  return [...(panel.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])]
}

// A press on the trigger while the menu is open closes it by light dismiss before the click
// arrives; without this the click would open it again. A key press starts a fresh gesture.
let openOnPress = false
function onPress(event: PointerEvent) {
  openOnPress = isOpen() && !panel.value?.contains(event.target as Node)
}
function onKey() {
  openOnPress = false
}

function toggle() {
  const wasOpen = openOnPress || isOpen()
  openOnPress = false
  if (wasOpen) hide()
  else show()
}

function show() {
  panel.value?.showPopover()
  place()
  enabledItems()[0]?.focus({ preventScroll: true })
}

function hide() {
  if (isOpen()) panel.value?.hidePopover()
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

// Inline style straight on the element: placing every frame must not re-render the component.
function place() {
  if (!root.value || !panel.value) return
  const anchor = root.value.getBoundingClientRect()
  const menu = panel.value.getBoundingClientRect()
  const { clientWidth: width, clientHeight: height } = document.documentElement
  const roomBelow = height - anchor.bottom - 2 * gap
  const roomAbove = anchor.top - 2 * gap
  // Below if it fits, above if only that fits, else the roomier side with a scrolling menu.
  const below = menu.height <= roomBelow || roomBelow >= roomAbove
  const room = below ? roomBelow : roomAbove
  const top = below ? anchor.bottom + gap : anchor.top - gap - Math.min(menu.height, room)
  const left = props.align === 'end' ? anchor.right - menu.width : anchor.left
  panel.value.style.maxHeight = `${room}px`
  panel.value.style.top = `${top}px`
  panel.value.style.left = `${clamp(left, gap, width - menu.width - gap)}px`
}

// While open, re-place every frame: covers scroll (of any container), resize, and a live update
// that moves the trigger's row. Two rect reads per frame, only while a menu is open.
let frame = 0
function follow() {
  place()
  frame = requestAnimationFrame(follow)
}
onBeforeUnmount(() => cancelAnimationFrame(frame))

function onToggle(event: Event) {
  open.value = (event as ToggleEvent).newState === 'open'
  cancelAnimationFrame(frame)
  if (open.value) frame = requestAnimationFrame(follow)
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
    const list = enabledItems()
    const next = move(list.indexOf(document.activeElement as HTMLElement), list.length)
    list[(next + list.length) % list.length]?.focus()
  } else if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
    // Space activates a link item like a button item (Enter already does).
    event.preventDefault()
    event.target.click()
  } else if (event.key === 'Tab') {
    // Leave the menu: focus goes back to the trigger, then Tab moves on from there.
    hide()
  }
}

// Close first so focus is back on the trigger before run() opens, say, a confirm Dialog.
function activate(item: MenuItem) {
  hide()
  item.run?.()
}

defineExpose({ toggle })
</script>

<template>
  <span ref="root" class="ui-menu" @pointerdown="onPress" @keydown="onKey">
    <slot name="trigger" :open="open" :toggle="toggle">
      <Button
        variant="ghost"
        :label="label ?? t('ui.actions')"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-controls="id"
        @click="toggle"
      >
        <template #icon><Icon name="more-vertical" /></template>
      </Button>
    </slot>
    <div
      :id="id"
      ref="panel"
      popover
      class="ui-menu__panel"
      role="menu"
      :aria-label="label ?? t('ui.actions')"
      @toggle="onToggle"
      @keydown="onKeydown"
    >
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
  </span>
</template>

<style scoped>
.ui-menu { display: inline-flex; }

/* The UA centres a popover (inset: 0, margin: auto); script sets top and left instead. */
.ui-menu__panel {
  inset: auto;
  width: max-content;
  min-width: 12rem;
  max-width: min(20rem, calc(100vw - 2 * var(--ui-space-2)));
  margin: 0;
  padding: var(--ui-space-1);
  overflow: auto;
  background: var(--ui-surface);
  color: var(--ui-ink);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-control);
  box-shadow: var(--ui-shadow-md);
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
