<script setup lang="ts">
import { RouterLink } from 'vue-router'
import EmptyState from './EmptyState.vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
</script>

<template>
  <div class="grid">
    <section>
      <h2>Filtered list, defaults</h2>
      <div class="frame">
        <EmptyState description="No customer matches these filters.">
          <template #action><Button>Clear filters</Button></template>
        </EmptyState>
      </div>
    </section>
    <section>
      <h2>Empty list, create action</h2>
      <div class="frame">
        <EmptyState icon="users" title="No customers yet" description="Customers you create or import appear here.">
          <template #action><Button variant="primary" data-action="createCustomer"><template #icon><Icon name="plus" /></template>New customer</Button></template>
        </EmptyState>
      </div>
    </section>
    <section>
      <h2>Not found, slot description</h2>
      <div class="frame">
        <EmptyState icon="file" title="Invoice not found">
          It may have been deleted. <RouterLink to="/">Back to the index</RouterLink>
        </EmptyState>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: var(--ui-space-4); align-items: start; }
.frame { background: var(--ui-surface); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
</style>
