<script setup lang="ts">
import ActionBar from './ActionBar.vue'
import Button from '../Button/Button.vue'
</script>

<template>
  <section>
    <h2>Form actions, not sticky in the demo</h2>
    <ActionBar :sticky="false">
      <template #lead>2 unsaved changes</template>
      <Button>Cancel</Button>
      <Button variant="primary" type="submit" data-action="updateCustomer">Save</Button>
    </ActionBar>
  </section>
  <section>
    <h2>Between</h2>
    <ActionBar :sticky="false" align="between">
      <Button variant="danger" data-action="deleteCustomer">Delete</Button>
      <Button variant="primary" type="submit" data-action="updateCustomer">Save</Button>
    </ActionBar>
  </section>
</template>
