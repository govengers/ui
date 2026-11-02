<script setup lang="ts">
import PageHeader from './PageHeader.vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
</script>

<template>
  <section>
    <h2>List page header</h2>
    <PageHeader title="Customers" subtitle="248 active, 12 on hold">
      <template #actions>
        <Button variant="ghost" label="Export"><template #icon><Icon name="download" /></template></Button>
        <Button variant="primary" data-action="createCustomer"><template #icon><Icon name="plus" /></template>New customer</Button>
      </template>
    </PageHeader>
  </section>
  <section>
    <h2>Detail page header with back link</h2>
    <PageHeader title="Acme GmbH" subtitle="Customer since 2019" :back="{ path: '/' }">
      <template #actions>
        <Button data-action="updateCustomer"><template #icon><Icon name="pencil" /></template>Edit</Button>
      </template>
    </PageHeader>
  </section>
</template>
