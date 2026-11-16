<script setup lang="ts">
// The shell of a target project (ui-start step 4). Public routes (login, signed out) bring their
// own bare shell; every other route gets the app shell with banners, the top-bar actions and
// Toast once. Each product piece below is one marked block (import, state, tag): delete the block
// to drop it, or keep it and declare its server side (start-project stage 02, D74).
import { ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { calls, live } from './api/api'
import { releases } from './changelog'
import AppShell, { type NavItem } from './ui/AppShell/AppShell.vue'
import Button from './ui/Button/Button.vue'
import Toast from './ui/Toast/Toast.vue'
import { toast } from './ui/Toast/toast'
import CommandPalette from './ui/blocks/CommandPalette/CommandPalette.vue'
import type { PaletteGroup } from './ui/blocks/CommandPalette/palette'
import ConnectionBanner from './ui/blocks/ConnectionBanner/ConnectionBanner.vue'
import FeedbackCapture from './ui/blocks/FeedbackCapture/FeedbackCapture.vue'
import ImpersonationBanner from './ui/blocks/ImpersonationBanner/ImpersonationBanner.vue'
import NotificationInbox from './ui/blocks/NotificationInbox/NotificationInbox.vue'
import UpdateHint from './ui/blocks/UpdateHint/UpdateHint.vue'
import WhatsNew from './ui/blocks/WhatsNew/WhatsNew.vue'
import { logout } from './router'
import { session } from './session'

const route = useRoute()
const nav: NavItem[] = [
  { label: 'Home', icon: 'home', to: { name: 'home' } },
]
/** The build's version (VITE_APP_VERSION at build time); `development` in `vite dev`. */
const version: string = import.meta.env.VITE_APP_VERSION ?? 'development'

// UpdateHint: the server's version from an endpoint answering { version } (or `:latest` from a live read).
const checkVersion = async (): Promise<string | undefined> => ((await (await fetch('/version', { cache: 'no-store' })).json()) as { version?: string }).version

// FeedbackCapture: needs `calls.createFeedback` and installFeedbackBuffer() in main.ts.
const feedbackOpen = ref(false)

// CommandPalette (Cmd/Ctrl+K): the page's bound actions, plus a search group per searchable list read:
// searchGroup({ key: 'tasks', label: 'Tasks', target: live.tasks, result: (task) => ({ id: task.id, label: task.title }) })
const paletteGroups: PaletteGroup[] = []
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <AppShell v-else title="Acme" :nav="nav">
    <template #banners>
      <ConnectionBanner />
      <ImpersonationBanner :identity="session.identity.value" :stop="session.stopImpersonating" @expired="session.resume()" />
      <UpdateHint :version="version" :check="checkVersion" />
    </template>
    <template #actions>
      <!-- NotificationInbox: needs live.notifications, live.notificationCount and the two mark calls. -->
      <NotificationInbox :target="live.notifications" :count="live.notificationCount"
        :mark-read="calls.markNotificationRead" :mark-all-read="calls.markAllNotificationsRead" />
      <!-- FeedbackCapture's trigger. -->
      <Button variant="ghost" data-action="openFeedback" @click="feedbackOpen = true">Feedback</Button>
      <Button variant="ghost" data-action="logout" @click="logout">Sign out</Button>
    </template>
    <RouterView />
    <!-- <template #dock><AgentDock ... /></template> once the in-app agent exists (patterns/adding-the-in-app-agent.md) -->
  </AppShell>
  <template v-if="!route.meta.public">
    <!-- WhatsNew: the release notes of changelog/<major>.<minor>.md, once per minor line. -->
    <WhatsNew :version="version" :releases="releases" />
    <FeedbackCapture v-model="feedbackOpen" :send="calls.createFeedback" :version="version"
      @sent="toast({ message: 'Thanks, your feedback was sent.', variant: 'success' })" />
    <CommandPalette :groups="paletteGroups" />
  </template>
  <Toast />
</template>
