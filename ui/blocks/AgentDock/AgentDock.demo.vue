<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { mutation, uuidv7, type LiveConnection, type LivePair, type MutationTarget, type NoParameters } from '@/api/runtime'
import { livePairKey } from '@/api/vue'
import { calls, live, type Message } from '@/fake/api'
import { planOf, seedExchange, startFakeAgent } from '@/fake/agent'
import { engine, pair } from '@/fake/live'
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
let stopAgent = startFakeAgent(engine.store)

// A long answer streams in steps, as a real agent's pushes do (D26): the browser check of D98.
const answerText = Array.from({ length: 12 }, (_, step) => `Step ${step + 1}: open the customer list, narrow it with the search field and the status filter, then check the rows before you change anything. Every change shows up for everyone at once.`).join('\n\n')
const streamId = ref<string>()
let streamTimer: ReturnType<typeof setInterval> | undefined

function streamAnswer() {
  const words = answerText.split(' ')
  const id = uuidv7()
  let shown = 0
  const row: Message & { streaming: boolean } = { id, role: 'agent', text: '', createdAt: new Date().toISOString(), streaming: true }
  engine.store.insert('conversation', row)
  streamId.value = id
  streamTimer = setInterval(() => {
    shown += 3
    if (shown < words.length) engine.store.update('conversation', id, { text: words.slice(0, shown).join(' ') })
    else endStream(answerText)
  }, 120)
}

function endStream(text?: string) {
  clearInterval(streamTimer)
  const id = streamId.value
  streamId.value = undefined
  const end = { text: text ?? engine.store.tables.conversation.find(message => message.id === id)?.text ?? '', streaming: false }
  if (id !== undefined) engine.store.update('conversation', id, end)
}

// Demo only: the fake api has no call that stops an answer, so the connection handed to the dock
// answers cancelAnswer here (ends the stream, or drops the scripted agent's pending reply); every
// other call goes to the fake engine.
const cancelAnswer = mutation<NoParameters, undefined, unknown>({ name: 'cancelAnswer', method: 'POST', path: '/conversation/cancel', pathParameters: [], body: false, content: false })
const real = pair.value.connection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function answer(target: MutationTarget<any, any, unknown>, parameters: any, body: any): Promise<unknown> {
  if (target.name !== cancelAnswer.name) return real.call(target, parameters, body)
  await new Promise(resolve => setTimeout(resolve, 150))
  if (streamId.value !== undefined) return endStream()
  stopAgent()
  stopAgent = startFakeAgent(engine.store)
  engine.store.insert('conversation', { id: uuidv7(), role: 'agent', text: 'Stopped.', createdAt: new Date().toISOString() })
  return undefined
}
const connection = new Proxy(real, { get: (target, key) => (key === 'call' ? answer : Reflect.get(target, key)) }) as LiveConnection
provide(livePairKey, shallowRef<LivePair>({ ...pair.value, connection }))
onBeforeUnmount(() => {
  stopAgent()
  endStream()
})

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
    <p class="stream"><Button :disabled="streamId !== undefined" @click="streamAnswer">Stream a long answer</Button> Scroll the thread up while it streams: it stays put and offers Jump to latest. Stop ends the answer.</p>
    <div class="frame">
      <AppShell title="Acme Console" :nav="nav" :dock-collapsed="running">
        <template #actions>
          <Button v-if="!open" variant="ghost" @click="open = true"><template #icon><Icon name="bot" /></template>Assistant</Button>
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
          <AgentDock v-model:mode="mode" :conversation="live.conversation" :send="calls.sendMessage" :cancel="cancelAnswer" :plan-of="planOf" @navigate="router.push($event)" @running="running = $event" @close="open = false" />
        </template>
      </AppShell>
    </div>
  </section>
</template>

<style scoped>
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); overflow: hidden; height: 40rem; }
.frame :deep(.ui-app-shell) { min-height: 100%; height: 100%; }
.frame :deep(.ui-app-shell__nav), .frame :deep(.ui-app-shell__top), .frame :deep(.ui-app-shell__dock) { position: static; height: auto; min-height: 0; }
/* Where the shell lays the dock over the page, it does so over the frame, not the demo page. */
@media (max-width: 64rem) {
  .frame { position: relative; }
  .frame :deep(.ui-app-shell__dock) { position: absolute; }
}
.stream { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); margin-bottom: var(--ui-space-3); font-size: var(--ui-text-sm); color: var(--ui-muted); }
.toolbar { display: flex; gap: var(--ui-space-2); }
.toolbar > :first-child { flex: 1; }
.list { margin: 0; padding-left: var(--ui-space-5); font-size: var(--ui-text-sm); }
.empty { color: var(--ui-muted); }
</style>
