<script setup lang="ts">
import SettingsPage from './SettingsPage.vue'
import Toast from '../../ui/Toast/Toast.vue'
</script>

<template>
  <!-- The demo stands in for the app shell: the toast host is mounted once, here. -->
  <Toast />
  <section>
    <h2>The page, framed; the tabs set ?tab= (General shown first)</h2>
    <div class="frame"><SettingsPage /></div>
  </section>
  <section>
    <h2>Danger zone (tab pinned)</h2>
    <div class="frame"><SettingsPage tab="danger" /></div>
  </section>
</template>

<style scoped>
/* DemoPage spaces every demo <section>; a Card rendered as a section inside the page must not get that margin. */
.frame :deep(section) { margin-bottom: 0; }
.frame { background: var(--ui-bg); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
</style>
