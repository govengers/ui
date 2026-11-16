<script setup lang="ts">
import Card from './Card.vue'
import Badge from '../Badge/Badge.vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

const rows = [
  { name: 'Acme GmbH', city: 'Frankfurt', status: 'Active' },
  { name: 'Globex AG', city: 'Munich', status: 'Active' },
  { name: 'Initech SE', city: 'Berlin', status: 'Paused' },
]
</script>

<template>
  <section>
    <h2>Title, actions, footer</h2>
    <div class="grid">
      <Card title="Billing address">
        <template #actions><Button size="sm" variant="ghost"><template #icon><Icon name="pencil" /></template>Edit</Button></template>
        <p>Acme GmbH<br>Hauptstraße 1<br>60311 Frankfurt</p>
        <template #footer>
          <Button size="sm">Cancel</Button>
          <Button size="sm" variant="primary" data-action="updateBillingAddress">Save</Button>
        </template>
      </Card>
      <Card as="article">
        <template #header><h3 class="custom">Header slot <Badge size="sm" variant="success">New</Badge></h3></template>
        <p>The header slot replaces the title, for another heading level or a title with a badge.</p>
      </Card>
      <Card>
        <p>A body only, no header and no footer.</p>
      </Card>
    </div>
  </section>
  <section>
    <h2>Flush body</h2>
    <Card title="Customers" flush class="narrow">
      <table class="table">
        <thead><tr><th>Name</th><th>City</th><th>Status</th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name"><td>{{ row.name }}</td><td>{{ row.city }}</td><td><Badge size="sm" :variant="row.status === 'Active' ? 'success' : 'neutral'">{{ row.status }}</Badge></td></tr>
        </tbody>
      </table>
    </Card>
  </section>
  <section>
    <h2>Link card and interactive</h2>
    <div class="grid">
      <Card :to="{ path: '/' }" title="Open the index">
        <p>The whole card is a router link.</p>
      </Card>
      <Card interactive title="Interactive">
        <template #actions><Button size="sm" variant="ghost">Open</Button></template>
        <p>Hover lift only; the action is also a real control.</p>
      </Card>
    </div>
  </section>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: var(--ui-space-4); align-items: start; }
.narrow { max-width: 36rem; }
.custom { display: flex; align-items: center; gap: var(--ui-space-2); font-size: var(--ui-text-md); }
p { color: var(--ui-ink-2); font-size: var(--ui-text-sm); }
.table { width: 100%; border-collapse: collapse; font-size: var(--ui-text-sm); }
.table th, .table td { text-align: left; padding: var(--ui-space-2) var(--ui-card-p); border-top: var(--ui-border-width) solid var(--ui-divider); }
.table th { color: var(--ui-muted); font-weight: var(--ui-weight-medium); background: var(--ui-sunk); }
</style>
