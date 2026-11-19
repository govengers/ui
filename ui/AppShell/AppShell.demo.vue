<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell, { type NavItem } from './AppShell.vue'
import Banner from '../Banner/Banner.vue'
import Button from '../Button/Button.vue'
import Checkbox from '../Checkbox/Checkbox.vue'
import Dialog from '../Dialog/Dialog.vue'
import Field from '../Field/Field.vue'
import Icon from '../Icon/Icon.vue'
import Page from '../Page/Page.vue'
import PageHeader from '../PageHeader/PageHeader.vue'
import Popover from '../Popover/Popover.vue'
import Select from '../Select/Select.vue'
import Sheet from '../Sheet/Sheet.vue'
import Table, { type TableColumn } from '../Table/Table.vue'

// The items lead to other demos; the one that leads here is the current page.
const nav: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: { path: '/pages/Dashboard' } },
  { label: 'Customers', icon: 'users', to: { path: '/ui/AppShell' }, count: 12 },
  { label: 'Orders', icon: 'list', to: { path: '/pages/ListPage' } },
  { label: 'Files', icon: 'folder', to: { path: '/ui/blocks/FileUpload' } },
  { label: 'Settings', icon: 'settings', to: { path: '/pages/SettingsPage' } },
]

// The sixth area is this page: with six or more items it sits behind More on phones.
const areas: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: { path: '/pages/Dashboard' } },
  { label: 'Customers', icon: 'users', to: { path: '/pages/ListPage' }, count: 12 },
  { label: 'Orders', icon: 'list', to: { path: '/pages/DetailPage' } },
  { label: 'Files', icon: 'folder', to: { path: '/ui/blocks/FileUpload' } },
  { label: 'Calendar', icon: 'calendar', to: { path: '/ui/blocks/RangePicker' } },
  { label: 'Reports', icon: 'grid', to: { path: '/ui/AppShell' }, count: 3 },
  { label: 'Messages', icon: 'message-square', to: { path: '/ui/blocks/NotificationInbox' } },
  { label: 'API keys', icon: 'key', to: { path: '/ui/blocks/ApiKeyManager' } },
  { label: 'Settings', icon: 'settings', to: { path: '/pages/SettingsPage' } },
]
const counts = [4, 5, 6, 7, 9].map(n => ({ value: n, label: `${n} items` }))
const count = ref<string | number | null>(7)
const withFooter = ref(true)
const shown = computed(() => areas.slice(0, Number(count.value)))

const columns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'orders', label: 'Orders', align: 'end' },
]
const cities = ['Frankfurt', 'Zürich', 'Munich', 'Hamburg', 'Vienna']
const rows = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, name: `Customer ${index + 1}`, city: cities[index % cities.length], orders: (index * 7) % 40 }))
const dialogOpen = ref(false)
const sheetOpen = ref(false)
</script>

<template>
  <section>
    <h2>Shell with a banner and a page (framed; resize the window for rail and tabs)</h2>
    <div class="frame">
      <AppShell title="Acme Console" :nav="nav">
        <template #actions>
          <Button variant="ghost">Search</Button>
          <Button variant="ghost" label="Notifications"><template #icon><Icon name="bell" /></template></Button>
          <Popover align="end" label="Account">
            <template #trigger="{ toggle, expanded }">
              <Button variant="ghost" label="Account" v-bind="expanded" @click="toggle"><template #icon><Icon name="user" /></template></Button>
            </template>
            <div class="account">
              <span>ada@acme.example</span>
              <Button variant="ghost" size="sm">Sign out</Button>
            </div>
          </Popover>
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

  <section>
    <h2>Phone bar with More (under 48rem: four tabs and More past five items or with a footer)</h2>
    <div class="options">
      <Field label="Items"><Select v-model="count" :options="counts" /></Field>
      <Checkbox v-model="withFooter" label="Nav footer" />
    </div>
    <div class="frame">
      <AppShell title="Acme Console" :nav="shown">
        <Page data-page="demo.reports">
          <PageHeader title="Reports" subtitle="The current page; on phones it sits behind More" />
          <div class="box">page content</div>
        </Page>
        <template v-if="withFooter" #navFooter>
          <div class="footer">
            <Button variant="ghost" size="sm" to="/pages/Changelog">What's new</Button>
            <span class="version">v1.4.0</span>
          </div>
        </template>
      </AppShell>
    </div>
  </section>

  <section>
    <h2>Sticky table header below the top bar (the frame scrolls like a page; bare, so the table keeps its columns)</h2>
    <div class="scroller">
      <AppShell title="Acme Console" bare>
        <Page data-page="demo.sticky">
          <PageHeader title="Customers" subtitle="30 rows">
            <template #actions>
              <Button @click="dialogOpen = true">Table in a dialog</Button>
              <Button @click="sheetOpen = true">Table in a sheet</Button>
            </template>
          </PageHeader>
          <Table :columns="columns" :rows="rows" row-key="id" sticky-header caption="Customers" />
          <!-- Inside the shell, as a page's own dialog is: they inherit the shell's tokens. -->
          <Dialog v-model="dialogOpen" title="Customers">
            <Table :columns="columns" :rows="rows" row-key="id" sticky-header caption="Customers in a dialog" />
          </Dialog>
          <Sheet v-model="sheetOpen" title="Customers" width="60rem">
            <Table :columns="columns" :rows="rows" row-key="id" sticky-header caption="Customers in a sheet" />
          </Sheet>
        </Page>
      </AppShell>
    </div>
  </section>
</template>

<style scoped>
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); overflow: hidden; height: 36rem; }
.frame :deep(.ui-app-shell) { min-height: 100%; height: 100%; }
.frame :deep(.ui-app-shell__nav), .frame :deep(.ui-app-shell__top) { position: static; height: auto; }
/* The scroll container stands in for the page: the shell keeps its own sticky positions. */
.scroller { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); overflow: auto; height: 30rem; }
.box { background: var(--ui-surface); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); padding: var(--ui-card-p); color: var(--ui-muted); min-height: 12rem; }
.version { font-size: var(--ui-text-xs); color: var(--ui-muted); padding: var(--ui-space-2) var(--ui-space-3); display: block; }
.account { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ui-space-2); padding: var(--ui-space-3); font-size: var(--ui-text-sm); }
.options { display: flex; flex-wrap: wrap; align-items: end; gap: var(--ui-space-4); margin-bottom: var(--ui-space-3); }
.footer { display: flex; flex-direction: column; align-items: flex-start; }
</style>
