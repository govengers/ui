<script setup lang="ts">
// AppShell: top bar, navigation, banners, the page and the dock (D25). Sidebar on desktop, icon
// rail on tablets, bottom tabs on phones. Pages render in the default slot.
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import Icon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/icons'

export interface NavItem {
  label: string
  icon: IconName
  to: RouteLocationRaw
  count?: number
}

withDefaults(defineProps<{
  title: string
  nav: NavItem[]
  /** Hides the sidebar and the bottom tabs (login, full-screen flows). */
  bare?: boolean | undefined
}>(), {})
</script>

<template>
  <div class="ui-app-shell" :data-bare="bare || undefined" :data-dock="$slots.dock ? '' : undefined">
    <a href="#ui-main" class="ui-app-shell__skip">Skip to content</a>
    <header class="ui-app-shell__top">
      <div class="ui-app-shell__brand"><slot name="brand"><span class="ui-app-shell__title">{{ title }}</span></slot></div>
      <div class="ui-app-shell__actions"><slot name="actions" /></div>
    </header>
    <nav v-if="!bare" class="ui-app-shell__nav" aria-label="Main">
      <RouterLink v-for="item in nav" :key="item.label" :to="item.to" class="ui-app-shell__link" :title="item.label">
        <Icon :name="item.icon" />
        <span class="ui-app-shell__label">{{ item.label }}</span>
        <span v-if="item.count" class="ui-app-shell__count">{{ item.count }}</span>
      </RouterLink>
      <div v-if="$slots.navFooter" class="ui-app-shell__nav-footer"><slot name="navFooter" /></div>
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
  display: grid;
  grid-template-columns: var(--ui-sidebar-w) minmax(0, 1fr);
  grid-template-rows: var(--ui-topbar-h) minmax(0, 1fr);
  grid-template-areas: "top top" "nav body";
  min-height: 100vh;
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
.ui-app-shell__title { font-weight: var(--ui-weight-semibold); }
.ui-app-shell__actions { display: flex; align-items: center; gap: var(--ui-space-2); }

.ui-app-shell__nav {
  grid-area: nav;
  position: sticky;
  top: var(--ui-topbar-h);
  height: calc(100vh - var(--ui-topbar-h));
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
.ui-app-shell__link:hover { background: var(--ui-surface-2); color: var(--ui-ink); }
.ui-app-shell__link.router-link-active { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-app-shell__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-app-shell__count { font-size: var(--ui-text-xs); padding: 0 var(--ui-space-2); border-radius: var(--ui-radius-pill); background: var(--ui-surface-2); color: var(--ui-muted); }
.ui-app-shell__nav-footer { margin-top: auto; }

.ui-app-shell__body { grid-area: body; display: flex; flex-direction: column; min-width: 0; }
.ui-app-shell__main { flex: 1; min-width: 0; outline: none; }
.ui-app-shell__dock { grid-area: dock; position: sticky; top: var(--ui-topbar-h); height: calc(100vh - var(--ui-topbar-h)); border-left: var(--ui-border-width) solid var(--ui-divider); background: var(--ui-surface); }

@media (max-width: 64rem) {
  .ui-app-shell { grid-template-columns: var(--ui-sidebar-rail-w) minmax(0, 1fr); }
  .ui-app-shell[data-dock] { grid-template-columns: var(--ui-sidebar-rail-w) minmax(0, 1fr); grid-template-areas: "top top" "nav body"; }
  .ui-app-shell__dock { position: fixed; inset: var(--ui-topbar-h) 0 0 auto; width: min(var(--ui-dock-w), 100vw); z-index: var(--ui-z-drawer); box-shadow: var(--ui-shadow-lg); }
  .ui-app-shell__link { justify-content: center; padding: 0; }
  .ui-app-shell__label, .ui-app-shell__count { display: none; }
}
@media (max-width: 48rem) {
  .ui-app-shell, .ui-app-shell[data-dock] { grid-template-columns: minmax(0, 1fr); grid-template-rows: var(--ui-topbar-h) minmax(0, 1fr) auto; grid-template-areas: "top" "body" "nav"; }
  .ui-app-shell__nav { position: sticky; top: auto; bottom: 0; height: auto; flex-direction: row; gap: 0; padding: 0; border-right: 0; border-top: var(--ui-border-width) solid var(--ui-divider); z-index: var(--ui-z-sticky); }
  .ui-app-shell__link { flex: 1; flex-direction: column; gap: var(--ui-space-1); min-height: var(--ui-touch-min); padding: var(--ui-space-2) 0; border-radius: 0; font-size: var(--ui-text-xs); }
  .ui-app-shell__link:nth-child(n + 6), .ui-app-shell__nav-footer { display: none; }
  .ui-app-shell__label { display: block; white-space: nowrap; }
  .ui-app-shell__dock { inset: var(--ui-topbar-h) 0 0 0; width: auto; }
}
</style>
