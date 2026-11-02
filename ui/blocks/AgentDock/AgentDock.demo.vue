<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { calls, live } from '@/fake/api'
import { planOf, seedExchange, startFakeAgent } from '@/fake/agent'
import { engine } from '@/fake/live'
import AppShell, { type NavItem } from '../../AppShell/AppShell.vue'
import Badge from '../../Badge/Badge.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Input from '../../Input/Input.vue'
import Page from '../../Page/Page.vue'
import PageHeader from '../../PageHeader/PageHeader.vue'
import AgentDock from './AgentDock.vue'
import type { AgentMode } from './dock'

// The scripted agent answers here; one exchange is seeded so the dock opens on a conversation.
seedExchange(engine.store)
onBeforeUnmount(startFakeAgent(engine.store))

const router = useRouter()
const nav: NavItem[] = [
  { label: 'Customers', icon: 'users', to: { path: '/ui/blocks/AgentDock' } },
  { label: 'Orders', icon: 'list', to: { path: '/' } },
  { label: 'Settings', icon: 'settings', to: { path: '/' } },
]
const open = ref(true)
const running = ref(false)
const mode = ref<AgentMode>('chat')
const search = ref('')
const onlyActive = ref(true)
const note = ref('')
const customers = computed(() => engine.store.tables.customers
  .filter(customer => (!onlyActive.value || customer.status === 'active') && customer.name.toLowerCase().includes(search.value.toLowerCase()))
  .slice(0, 5))
</script>

<template>
  <section>
    <h2>In the shell's dock slot (ask "create a customer Initech", "where is the filter", "dark mode")</h2>
    <div class="frame">
      <AppShell title="Acme Console" :nav="nav" :dock-collapsed="running">
        <template #actions>
          <Button v-if="!open" variant="ghost" class="on-chrome" @click="open = true"><template #icon><Icon name="bot" /></template>Assistant</Button>
        </template>
        <Page data-page="demo.customers">
          <PageHeader title="Customers">
            <template #actions><Button variant="primary" data-action="createCustomer" @click="note = `The new-customer form would open for ${search || 'a new customer'}`">New customer</Button></template>
          </PageHeader>
          <div class="toolbar">
            <Input v-model="search" type="search" name="search" aria-label="Search customers" placeholder="Search customers" />
            <Button data-action="filter" :aria-pressed="onlyActive" @click="onlyActive = !onlyActive"><template #icon><Icon name="filter" /></template>Filter</Button>
          </div>
          <div><Badge data-facet="status" variant="accent" pill>Status is {{ onlyActive ? 'active' : 'any' }}</Badge></div>
          <p v-if="note" role="status">{{ note }}</p>
          <ul class="list">
            <li v-for="customer in customers" :key="customer.id">{{ customer.name }}</li>
            <li v-if="customers.length === 0" class="empty">No customer matches "{{ search }}"</li>
          </ul>
        </Page>
        <template v-if="open" #dock>
          <AgentDock v-model:mode="mode" :conversation="live.conversation" :send="calls.sendMessage" :plan-of="planOf" @navigate="router.push($event)" @running="running = $event" @close="open = false" />
        </template>
      </AppShell>
    </div>
  </section>
</template>

<style scoped>
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); overflow: hidden; height: 40rem; }
.frame :deep(.ui-app-shell) { min-height: 100%; height: 100%; }
.frame :deep(.ui-app-shell__nav), .frame :deep(.ui-app-shell__top), .frame :deep(.ui-app-shell__dock) { position: static; height: auto; min-height: 0; }
.on-chrome { color: var(--ui-on-chrome); }
.toolbar { display: flex; gap: var(--ui-space-2); }
.toolbar > :first-child { flex: 1; }
.list { margin: 0; padding-left: var(--ui-space-5); font-size: var(--ui-text-sm); }
.empty { color: var(--ui-muted); }
</style>
