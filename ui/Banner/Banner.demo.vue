<script setup lang="ts">
import Banner from './Banner.vue'
import Button from '../Button/Button.vue'
</script>

<template>
  <section class="stack">
    <Banner variant="warning">Connection lost, showing the last known data.<template #action><Button size="sm">Retry</Button></template></Banner>
    <Banner variant="info" dismissible>Maintenance tonight 22:00 to 23:00 CET.</Banner>
    <Banner variant="danger">You are acting as ada@example.com.<template #action><Button size="sm" variant="danger" data-action="stopImpersonation">Stop</Button></template></Banner>
    <Banner variant="success">Export finished.</Banner>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-3); }
</style>
