<script setup lang="ts">
// The shell of a target project (ui-start step 4). Banners, the toast host once, the agent dock.
import { RouterView } from 'vue-router'
import AppShell, { type NavItem } from './ui/AppShell/AppShell.vue'
import Toast from './ui/Toast/Toast.vue'
import ConnectionBanner from './ui/blocks/ConnectionBanner/ConnectionBanner.vue'

const nav: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: { name: 'dashboard' } },
  { label: 'Customers', icon: 'users', to: { name: 'customers.list' } },
  { label: 'Settings', icon: 'settings', to: { name: 'settings' } },
]
</script>

<template>
  <AppShell title="Acme" :nav="nav">
    <template #banners>
      <ConnectionBanner />
    </template>
    <RouterView />
  </AppShell>
  <Toast />
</template>
