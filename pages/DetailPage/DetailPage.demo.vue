<script setup lang="ts">
// The recipe against the fake api, framed like a page in the shell: a seeded customer with
// orders, then an id that does not exist. The demo router has no customers routes, so they are
// added here; the back link leads to the ListPage recipe.
import { useRouter } from 'vue-router'
import { engine } from '@/fake/live'
import Button from '../../ui/Button/Button.vue'
import Icon from '../../ui/Icon/Icon.vue'
import ListPage from '../ListPage/ListPage.vue'
import DetailPage from './DetailPage.vue'

const router = useRouter()
if (!router.hasRoute('customers.list')) router.addRoute({ name: 'customers.list', path: '/customers', component: ListPage })
if (!router.hasRoute('customers.detail')) router.addRoute({ name: 'customers.detail', path: '/customers/:id', component: DetailPage, props: true })
// There is no orders page in the demo; the SearchTable demo shows the orders list.
if (!router.hasRoute('orders.list')) router.addRoute({ name: 'orders.list', path: '/orders', redirect: '/ui/blocks/SearchTable' })

// The customer of the newest order, so the orders card has rows.
const id = engine.store.tables.orders.at(-1)?.customerId ?? 'cus-001'
</script>

<template>
  <section>
    <h2>A seeded customer: edit a field and save, move the status, live changes arrive as pushes</h2>
    <div class="bar">
      <Button size="sm" variant="ghost" data-action="tick" @click="engine.store.tick()">
        <template #icon><Icon name="refresh" /></template>Random change
      </Button>
    </div>
    <div class="frame"><DetailPage :id="id" /></div>
  </section>
  <section>
    <h2>An id that does not exist: not found</h2>
    <div class="frame"><DetailPage id="cus-missing" /></div>
  </section>
</template>

<style scoped>
.bar { margin-bottom: var(--ui-space-3); }
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); background: var(--ui-bg); }
</style>
