<script setup lang="ts">
// AppShell: top bar, navigation, banners, the page and the dock (D25, D92). Sidebar on desktop,
// icon rail on tablets (names through Tooltip), bottom tabs on phones: with more than five items
// or a navFooter, four tabs and More, a Sheet with the rest. Pages render in the default slot.
import { onBeforeUnmount, ref, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'
import Sheet from '../Sheet/Sheet.vue'
import Tooltip from '../Tooltip/Tooltip.vue'
import { useMore } from './more'

export interface NavItem {
  label: string
  icon: IconName
  to: RouteLocationRaw
  count?: number
}

const props = withDefaults(defineProps<{
  title: string
  nav?: NavItem[] | undefined
  /** Hides the sidebar and the bottom tabs (login, full-screen flows). */
  bare?: boolean | undefined
  /** On tablets and phones the dock shrinks to a strip so a guide or drive plan can reach the page. */
  dockCollapsed?: boolean | undefined
}>(), { nav: () => [] })

const slots = useSlots()
const { t } = useI18n()

/** A media query as a ref that follows the viewport. */
function media(query: string) {
  const list = window.matchMedia(query)
  const matches = ref(list.matches)
  const update = () => { matches.value = list.matches }
  list.addEventListener('change', update)
  onBeforeUnmount(() => list.removeEventListener('change', update))
  return matches
}
const rail = media('(min-width: 48.0625rem) and (max-width: 64rem)')
const phone = media('(max-width: 48rem)')

/** Phones: more than five items or a footer do not fit the bar, so four tabs and More (D92). */
const overflowing = () => props.nav.length > 5 || !!slots.navFooter

// The More tab's state, guards and focus hand-over live in more.ts.
const navEl = ref<HTMLElement | null>(null)
const { more, moreCurrent, sheetFooter, open, swallowRepeat, holdMore, onFocusOut } = useMore(navEl, phone)
</script>

<template>
  <div class="ui-app-shell" :data-bare="bare || undefined" :data-dock="$slots.dock ? '' : undefined" :data-dock-collapsed="dockCollapsed || undefined">
    <a href="#ui-main" class="ui-app-shell__skip">{{ t('ui.skipToContent') }}</a>
    <header class="ui-app-shell__top">
      <div class="ui-app-shell__brand"><slot name="brand"><span class="ui-app-shell__title">{{ title }}</span></slot></div>
      <div class="ui-app-shell__actions"><slot name="actions" /></div>
    </header>
    <nav v-if="!bare" ref="navEl" class="ui-app-shell__nav" :aria-label="t('ui.mainNav')" @focusout="onFocusOut">
      <RouterLink v-for="(item, index) in nav" :key="item.label" :to="item.to" class="ui-app-shell__link" :data-overflow="(index >= 4 && overflowing()) || undefined">
        <Icon :name="item.icon" />
        <span class="ui-app-shell__label">{{ item.label }}</span>
        <span v-if="item.count" class="ui-app-shell__count">{{ item.count }}</span>
        <Tooltip v-if="rail" :text="item.label" kind="label" placement="end" />
      </RouterLink>
      <template v-if="overflowing()">
        <button type="button" class="ui-app-shell__link ui-app-shell__more" aria-haspopup="dialog" :aria-expanded="more" :aria-current="moreCurrent ? 'true' : undefined" @click="open" @keydown="holdMore">
          <Icon name="more-horizontal" />
          <span class="ui-app-shell__label">{{ t('ui.more') }}</span>
        </button>
        <Sheet v-model="more" :title="t('ui.more')" @click.capture="swallowRepeat" @keydown.capture="swallowRepeat" @keyup.capture="swallowRepeat">
          <div class="ui-app-shell__more-list">
            <RouterLink v-for="item in nav.slice(4)" :key="item.label" :to="item.to" class="ui-app-shell__link">
              <Icon :name="item.icon" />
              <span class="ui-app-shell__label">{{ item.label }}</span>
              <span v-if="item.count" class="ui-app-shell__count">{{ item.count }}</span>
            </RouterLink>
          </div>
          <div v-if="$slots.navFooter" ref="sheetFooter" class="ui-app-shell__more-footer" />
        </Sheet>
      </template>
      <!-- One footer node: moved into the sheet on phones, in the nav elsewhere, never mounted again. -->
      <Teleport v-if="$slots.navFooter" :to="sheetFooter" :disabled="!phone || !sheetFooter">
        <div class="ui-app-shell__nav-footer"><slot name="navFooter" /></div>
      </Teleport>
    </nav>
    <div class="ui-app-shell__body">
      <div v-if="$slots.banners" class="ui-app-shell__banners"><slot name="banners" /></div>
      <main id="ui-main" class="ui-app-shell__main" tabindex="-1"><slot /></main>
    </div>
    <aside v-if="$slots.dock" class="ui-app-shell__dock"><slot name="dock" /></aside>
  </div>
</template>

<style scoped>
.ui-app-shell {
  /* A sticky Table header sits below the top bar; a scroll box that is not the page resets it (D92). */
  --ui-sticky-top: var(--ui-topbar-h);
  display: grid;
  grid-template-columns: var(--ui-sidebar-w) minmax(0, 1fr);
  grid-template-rows: var(--ui-topbar-h) minmax(0, 1fr);
  grid-template-areas: "top top" "nav body";
  min-height: 100dvh;
}
.ui-app-shell[data-dock] { grid-template-columns: var(--ui-sidebar-w) minmax(0, 1fr) var(--ui-dock-w); grid-template-areas: "top top top" "nav body dock"; }
.ui-app-shell[data-bare] { grid-template-columns: minmax(0, 1fr); grid-template-areas: "top" "body"; }

.ui-app-shell__skip { position: absolute; left: var(--ui-space-2); top: -100%; z-index: var(--ui-z-overlay); background: var(--ui-surface); color: var(--ui-ink); padding: var(--ui-space-2) var(--ui-space-3); border-radius: var(--ui-radius-control); }
.ui-app-shell__skip:focus { top: var(--ui-space-2); }

.ui-app-shell__top {
  grid-area: top;
  position: sticky;
  top: 0;
  z-index: var(--ui-z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-4);
  padding: 0 var(--ui-space-4);
  background: var(--ui-chrome);
  color: var(--ui-on-chrome);
}
.ui-app-shell__brand { display: flex; align-items: center; gap: var(--ui-space-2); min-width: 0; }
/* A crowded actions slot keeps its buttons; the title gives way with an ellipsis. */
.ui-app-shell__title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--ui-weight-semibold); }
.ui-app-shell__actions { display: flex; align-items: center; gap: var(--ui-space-2); }
/* Ghost Buttons on the chrome read its ink at rest through the property Button offers for it, so
   nothing else inside them changes; hover keeps --ui-ink on --ui-surface-2. A panel that only
   lives in the slot's DOM (a popover, a dialog) sits on a surface and resets it (D102). */
.ui-app-shell__actions { --ui-button-ghost-ink: var(--ui-on-chrome); }
.ui-app-shell__actions :deep(:is([popover], dialog)) { --ui-button-ghost-ink: initial; }
/* Their ground changes without a fade: their ink turns from light to dark with it, and a ground
   fading under ink that flips at once hides the label for a frame or two in light themes. */
.ui-app-shell__actions :deep(.ui-button[data-variant="ghost"]:where(:not([popover] *, dialog *))) { transition: none; }
/* A ring on the chrome is drawn against the chrome, where --ui-focus can vanish (paper light 1:1). */
.ui-app-shell__top :deep(:focus-visible:where(:not([popover] *, dialog *))) { outline-color: var(--ui-on-chrome); }

.ui-app-shell__nav {
  /* Its own scroll box: nothing in it sits below the top bar. */
  --ui-sticky-top: 0px;
  grid-area: nav;
  position: sticky;
  top: var(--ui-topbar-h);
  height: calc(100dvh - var(--ui-topbar-h));
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-1);
  padding: var(--ui-space-3);
  background: var(--ui-surface);
  border-right: var(--ui-border-width) solid var(--ui-divider);
}
.ui-app-shell__link {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-3);
  border-radius: var(--ui-radius-control);
  color: var(--ui-ink-2);
  text-decoration: none;
  font-size: var(--ui-text-sm);
  font-weight: var(--ui-weight-medium);
}
/* Only the phone bar shows More. */
.ui-app-shell__more { display: none; border: 0; background: transparent; }
@media (hover: hover) {
  .ui-app-shell__link:hover { background: var(--ui-surface-2); color: var(--ui-ink); }
}
.ui-app-shell__link.router-link-active, .ui-app-shell__more[aria-current] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-app-shell__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-app-shell__count { font-size: var(--ui-text-xs); padding: 0 var(--ui-space-2); border-radius: var(--ui-radius-pill); background: var(--ui-surface-2); color: var(--ui-muted); }
.ui-app-shell__nav-footer { margin-top: auto; }
.ui-app-shell__more-list { display: flex; flex-direction: column; gap: var(--ui-space-1); }
.ui-app-shell__more-footer { margin-top: var(--ui-space-3); padding-top: var(--ui-space-3); border-top: var(--ui-border-width) solid var(--ui-divider); }

.ui-app-shell__body { grid-area: body; display: flex; flex-direction: column; min-width: 0; }
.ui-app-shell__main { flex: 1; min-width: 0; outline: none; }
.ui-app-shell__dock { --ui-sticky-top: 0px; grid-area: dock; position: sticky; top: var(--ui-topbar-h); height: calc(100dvh - var(--ui-topbar-h)); border-left: var(--ui-border-width) solid var(--ui-divider); background: var(--ui-surface); }

/* The rail and bar rules reach the nav's own items only, not the links in the More sheet. */
@media (max-width: 64rem) {
  .ui-app-shell { grid-template-columns: var(--ui-sidebar-rail-w) minmax(0, 1fr); }
  .ui-app-shell[data-dock] { grid-template-columns: var(--ui-sidebar-rail-w) minmax(0, 1fr); grid-template-areas: "top top" "nav body"; }
  .ui-app-shell__dock { position: fixed; inset: var(--ui-topbar-h) 0 0 auto; width: min(var(--ui-dock-w), 100dvw); z-index: var(--ui-z-drawer); box-shadow: var(--ui-shadow-lg); }
  .ui-app-shell[data-dock-collapsed] .ui-app-shell__dock { inset: auto 0 0 auto; height: var(--ui-control-h-lg); overflow: hidden; }
  .ui-app-shell__nav > .ui-app-shell__link { justify-content: center; padding: 0; }
}
/* Rail: label and count leave the screen, not the link's name; the Tooltip shows the label. */
@media (min-width: 48.0625rem) and (max-width: 64rem) {
  .ui-app-shell__nav > .ui-app-shell__link > :is(.ui-app-shell__label, .ui-app-shell__count) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  /* A 4rem rail with the sidebar's padding leaves a link 39 px wide, under the touch floor. */
  .ui-app-shell__nav { padding-inline: var(--ui-space-2); }
}
@media (max-width: 48rem) {
  .ui-app-shell, .ui-app-shell[data-dock] { grid-template-columns: minmax(0, 1fr); grid-template-rows: var(--ui-topbar-h) minmax(0, 1fr) auto; grid-template-areas: "top" "body" "nav"; }
  /* What sticks to the page's bottom (ActionBar, the collapsed dock strip) stands on the bar. Set on
     the root, the page's scroll box, so its scroll padding can read it too (ActionBar); no bar (bare,
     or no tab to show), no inset. The bar's height is a token, not its content's, so everything that
     stacks on it agrees at any text size; below the tabs it pads the bottom safe-area inset, which is
     0 unless the page's viewport meta tag sets viewport-fit=cover. */
  :global(:root:has(.ui-app-shell:not([data-bare]) > .ui-app-shell__nav > .ui-app-shell__link)) { --ui-sticky-bottom: calc(var(--ui-tabbar-h) + env(safe-area-inset-bottom, 0px)); }
  .ui-app-shell__nav { position: sticky; top: auto; bottom: 0; height: calc(var(--ui-tabbar-h) + env(safe-area-inset-bottom, 0px)); flex-direction: row; gap: 0; padding: 0 0 env(safe-area-inset-bottom, 0px); border-right: 0; border-top: var(--ui-border-width) solid var(--ui-divider); z-index: var(--ui-z-sticky); }
  /* Tabs share the bar whatever their label: a long or enlarged label ends in an ellipsis, so More stays on screen. */
  .ui-app-shell__nav > .ui-app-shell__link { flex: 1; flex-direction: column; gap: var(--ui-space-1); min-width: 0; min-height: var(--ui-touch-min); padding: var(--ui-space-2) 0; border-radius: 0; font-size: var(--ui-text-xs); }
  .ui-app-shell__nav > .ui-app-shell__link > .ui-app-shell__label { flex: none; max-width: 100%; }
  /* The bar scrolls its overflow, which would cut a ring drawn outside the tab; on the current tab
     the ring takes that ground's own ink. */
  .ui-app-shell__nav > .ui-app-shell__link:focus-visible { outline-offset: -2px; }
  .ui-app-shell__nav > :is(.router-link-active, [aria-current]):focus-visible { outline-color: var(--ui-on-accent-soft); }
  .ui-app-shell__nav > [data-overflow] { display: none; }
  .ui-app-shell__nav:not(:has(> .ui-app-shell__link)) { display: none; }
  .ui-app-shell__nav > .ui-app-shell__more { display: flex; }
  .ui-app-shell__nav > .ui-app-shell__link > .ui-app-shell__count { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .ui-app-shell__dock { inset: var(--ui-topbar-h) 0 0 0; width: auto; }
  .ui-app-shell[data-dock-collapsed] .ui-app-shell__dock { inset: auto 0 var(--ui-sticky-bottom) 0; height: var(--ui-control-h-lg); }
}
</style>
