<script setup lang="ts">
import AppShell, { type NavItem } from './AppShell.vue'
import Banner from '../Banner/Banner.vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import Page from '../Page/Page.vue'
import PageHeader from '../PageHeader/PageHeader.vue'

const nav: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: { path: '/' } },
  { label: 'Customers', icon: 'users', to: { path: '/ui/AppShell' }, count: 12 },
  { label: 'Orders', icon: 'list', to: { path: '/orders' } },
  { label: 'Files', icon: 'folder', to: { path: '/files' } },
  { label: 'Settings', icon: 'settings', to: { path: '/settings' } },
]
</script>

<template>
  <section>
    <h2>Shell with a banner and a page (framed; resize the window for rail and tabs)</h2>
    <div class="frame">
      <AppShell title="Acme Console" :nav="nav">
        <template #actions>
          <Button variant="ghost" label="Notifications" class="on-chrome"><template #icon><Icon name="bell" /></template></Button>
          <Button variant="ghost" label="Account" class="on-chrome"><template #icon><Icon name="user" /></template></Button>
        </template>
        <template #banners>
          <Banner variant="warning">Connection lost, showing the last known data.<template #action><Button size="sm">Retry</Button></template></Banner>
        </template>
        <Page data-page="demo.shell">
          <PageHeader title="Customers" subtitle="248 active">
            <template #actions><Button variant="primary" data-action="createCustomer">New customer</Button></template>
          </PageHeader>
          <div class="box">page content</div>
        </Page>
        <template #navFooter><span class="version">v1.4.0</span></template>
      </AppShell>
    </div>
  </section>
</template>

<style scoped>
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); overflow: hidden; height: 36rem; }
.frame :deep(.ui-app-shell) { min-height: 100%; height: 100%; }
.frame :deep(.ui-app-shell__nav), .frame :deep(.ui-app-shell__top) { position: static; height: auto; }
.on-chrome { color: var(--ui-on-chrome); }
.box { background: var(--ui-surface); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); padding: var(--ui-card-p); color: var(--ui-muted); min-height: 12rem; }
.version { font-size: var(--ui-text-xs); color: var(--ui-muted); padding: var(--ui-space-2) var(--ui-space-3); display: block; }
</style>
