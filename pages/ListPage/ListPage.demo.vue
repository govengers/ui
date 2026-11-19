<script setup lang="ts">
// The recipe against the fake api, framed like a page in the shell. The demo router has no
// customers routes, so they are added here: Edit and Open in the list lead to the DetailPage
// recipe. The page renders once ?country=DE is in the URL, so a facet chip shows from the start.
// "Without customers" shows the first run: the page on a pair of its own over an engine whose
// customers were removed, with the URL emptied first.
import { computed, defineComponent, onScopeDispose, provide, ref, shallowRef, type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createLivePair, type LivePair } from '@/api/runtime'
import { livePairKey } from '@/api/vue'
import { createFakeEngine } from '@/fake/engine'
import { engine } from '@/fake/live'
import Button from '../../ui/Button/Button.vue'
import Icon from '../../ui/Icon/Icon.vue'
import DetailPage from '../DetailPage/DetailPage.vue'
import ListPage from './ListPage.vue'

const router = useRouter()
const route = useRoute()
if (!router.hasRoute('customers.list')) router.addRoute({ name: 'customers.list', path: '/customers', component: ListPage })
if (!router.hasRoute('customers.detail')) router.addRoute({ name: 'customers.detail', path: '/customers/:id', component: DetailPage, props: true })
// There is no orders page in the demo; the SearchTable demo shows the orders list.
if (!router.hasRoute('orders.list')) router.addRoute({ name: 'orders.list', path: '/orders', redirect: '/ui/blocks/SearchTable' })

const ready = ref(Object.keys(route.query).length > 0)
if (!ready.value) void router.replace({ query: { country: 'DE' } }).then(() => (ready.value = true))

const bare = shallowRef<LivePair | null>(null)
let barePair: LivePair | undefined
async function toggleFirstRun(): Promise<void> {
  await router.replace({ query: {} })
  if (barePair === undefined) {
    const empty = createFakeEngine()
    for (const customer of [...empty.store.tables.customers]) empty.store.remove('customers', customer.id)
    barePair = createLivePair({ identity: () => 'demo:ada', client: { baseURL: '/api/v1', fetch: empty.fetch }, connection: { url: 'ws://fake/api/v1/socket', WebSocket: empty.WebSocket } })
  }
  bare.value = bare.value ? null : barePair
}
onScopeDispose(() => barePair?.end())
const WithPair = defineComponent({
  props: { pair: { type: Object as PropType<LivePair>, required: true } },
  setup(props, { slots }) {
    provide(livePairKey, computed(() => props.pair))
    return () => slots.default?.()
  },
})
</script>

<template>
  <section>
    <h2>Customers, a country chip preset through the URL; live changes arrive as pushes</h2>
    <div class="bar">
      <Button size="sm" variant="ghost" data-action="tick" :disabled="bare !== null" @click="engine.store.tick()">
        <template #icon><Icon name="refresh" /></template>Random change
      </Button>
      <Button size="sm" variant="ghost" :aria-pressed="bare !== null" @click="toggleFirstRun">
        <template #icon><Icon name="users" /></template>Without customers
      </Button>
    </div>
    <div class="frame">
      <WithPair v-if="bare" :pair="bare"><ListPage /></WithPair>
      <ListPage v-else-if="ready" />
    </div>
  </section>
</template>

<style scoped>
.bar { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); margin-bottom: var(--ui-space-3); }
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); background: var(--ui-bg); }
</style>
