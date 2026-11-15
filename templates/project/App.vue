<script setup lang="ts">
// The shell of a target project (ui-start step 4). Public routes (login, signed out) bring their
// own bare shell; every other route gets the app shell with banners, the user menu and Toast once.
import { RouterView, useRoute } from 'vue-router'
import AppShell, { type NavItem } from './ui/AppShell/AppShell.vue'
import Button from './ui/Button/Button.vue'
import Toast from './ui/Toast/Toast.vue'
import ConnectionBanner from './ui/blocks/ConnectionBanner/ConnectionBanner.vue'
import ImpersonationBanner from './ui/blocks/ImpersonationBanner/ImpersonationBanner.vue'
import { logout } from './router'
import { session } from './session'

const route = useRoute()
const nav: NavItem[] = [
  { label: 'Home', icon: 'home', to: { name: 'home' } },
]
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <AppShell v-else title="Acme" :nav="nav">
    <template #banners>
      <ConnectionBanner />
      <ImpersonationBanner :identity="session.identity.value" :stop="session.stopImpersonating" @expired="session.resume()" />
    </template>
    <template #actions>
      <Button variant="ghost" data-action="logout" @click="logout">Sign out</Button>
    </template>
    <RouterView />
    <!-- <template #dock><AgentDock ... /></template> once the in-app agent exists (patterns/adding-the-in-app-agent.md) -->
  </AppShell>
  <Toast />
</template>
