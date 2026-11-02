<script setup lang="ts">
// The recipe against the fake api, framed like a page in the shell. The demo router has no
// customers routes, so they are added here: Edit and Open in the list lead to the DetailPage
// recipe. The page renders once ?country=DE is in the URL, so a facet chip shows from the start.
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
</script>

<template>
  <section>
    <h2>Customers, a country chip preset through the URL; live changes arrive as pushes</h2>
    <div class="bar">
      <Button size="sm" variant="ghost" data-action="tick" @click="engine.store.tick()">
        <template #icon><Icon name="refresh" /></template>Random change
      </Button>
    </div>
    <div class="frame"><ListPage v-if="ready" /></div>
  </section>
</template>

<style scoped>
.bar { margin-bottom: var(--ui-space-3); }
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); background: var(--ui-bg); }
</style>
