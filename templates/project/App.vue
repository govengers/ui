<script setup lang="ts">
// The shell of a target project (ui-start step 4). Public routes (login, signed out) bring their
// own bare shell; every other route gets the app shell with banners, the top-bar actions and
// Toast once. Each product piece below is one marked block (import, state, tag): delete the block
// to drop it, or keep it and declare its server side (start-project stage 02, D74).
import { computed, onScopeDispose, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute } from 'vue-router'
import { calls, live } from './api/api'
import { releases } from './changelog'
import AppShell, { type NavItem } from './ui/AppShell/AppShell.vue'
import Button from './ui/Button/Button.vue'
import Icon from './ui/Icon/Icon.vue'
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
import { logout, signOutState } from './router'
import { session } from './session'

const { t } = useI18n()
const route = useRoute()
// Phones (AppShell's bottom-bar width): the top-bar buttons show their icon alone, named by `label`.
// Their word leaves the slot rather than being hidden by CSS, so Button treats them as icon-only.
const narrow = matchMedia('(max-width: 48rem)')
const phone = ref(narrow.matches)
const followNarrow = (event: MediaQueryListEvent): void => {
  phone.value = event.matches
}
narrow.addEventListener('change', followNarrow)
onScopeDispose(() => narrow.removeEventListener('change', followNarrow))
// The logout request is out (router.ts): the screen says so, never "signed out" before it is true,
// and offers a reload once it has had no answer for 10 s (the reload drops it and asks the server).
const signingOut = computed(() => signOutState.value === 'ending' || signOutState.value === 'slow')
const reload = (): void => location.reload()
const nav: NavItem[] = [
  { label: 'Home', icon: 'home', to: { name: 'home' } },
]
/** The build's version (VITE_APP_VERSION at build time); `development` in `vite dev`. */
const version: string = import.meta.env.VITE_APP_VERSION ?? 'development'

// UpdateHint: the server's version from an endpoint answering { version } (or `:latest` from a live read).
const checkVersion = async (): Promise<string | undefined> => ((await (await fetch('/version', { cache: 'no-store' })).json()) as { version?: string }).version

// FeedbackCapture: needs `calls.createFeedback` and installFeedbackBuffer() in main.ts.
const feedbackOpen = ref(false)

// CommandPalette (Cmd/Ctrl+K, or the Search button): the page's bound actions, plus a search group per searchable list read:
// searchGroup({ key: 'tasks', label: 'Tasks', target: live.tasks, result: (task) => ({ id: task.id, label: task.title }) })
const paletteGroups: PaletteGroup[] = []
const paletteOpen = ref(false)
/** The shortcut as the keyboard labels it: the command sign on Apple platforms, else Ctrl in the locale's word. */
const apple = /Mac|iPhone|iPad/.test(navigator.userAgent)
const paletteKey = computed(() => (apple ? '⌘ K' : `${t('ui.keyCtrl')} K`))
</script>

<template>
  <div v-if="signingOut" class="app-signing-out">
    <p role="status"><Icon name="loader" class="app-signing-out__icon" />{{ signOutState === 'slow' ? t('ui.signOutSlow') : t('ui.signingOut') }}</p>
    <Button v-if="signOutState === 'slow'" @click="reload">{{ t('ui.reload') }}</Button>
  </div>
  <RouterView v-else-if="route.meta.public" />
  <AppShell v-else title="Acme" :nav="nav">
    <template #banners>
      <ConnectionBanner />
      <ImpersonationBanner :identity="session.identity.value" :stop="session.stopImpersonating" @expired="session.resume()" />
      <UpdateHint :version="version" :check="checkVersion" />
    </template>
    <template #actions>
      <!-- CommandPalette's opener: the shortcut is named for assistive technology and shown where a keyboard is likely. -->
      <Button variant="ghost" :label="t('ui.paletteOpen')" aria-keyshortcuts="Control+K Meta+K" @click="paletteOpen = true">
        <template #icon><Icon name="search" /></template>
        <template v-if="!phone" #default>{{ t('ui.paletteOpen') }}<kbd class="app-palette-key" aria-hidden="true">{{ paletteKey }}</kbd></template>
      </Button>
      <!-- NotificationInbox: needs live.notifications, live.notificationCount and the two mark calls. -->
      <NotificationInbox :target="live.notifications" :count="live.notificationCount"
        :mark-read="calls.markNotificationRead" :mark-all-read="calls.markAllNotificationsRead" />
      <!-- FeedbackCapture's trigger. -->
      <Button variant="ghost" :label="t('ui.feedback')" data-action="openFeedback" @click="feedbackOpen = true">
        <template #icon><Icon name="message-square" /></template>
        <template v-if="!phone" #default>{{ t('ui.feedback') }}</template>
      </Button>
      <Button variant="ghost" :label="t('ui.signOut')" data-action="logout" @click="logout(t)">
        <template #icon><Icon name="log-out" /></template>
        <template v-if="!phone" #default>{{ t('ui.signOut') }}</template>
      </Button>
    </template>
    <RouterView />
    <!-- <template #dock><AgentDock ... /></template> once the in-app agent exists (patterns/adding-the-in-app-agent.md) -->
  </AppShell>
  <template v-if="!route.meta.public">
    <!-- WhatsNew: the release notes of changelog/<major>.<minor>.md, once per minor line. -->
    <WhatsNew :version="version" :releases="releases" />
    <FeedbackCapture v-model="feedbackOpen" :send="calls.createFeedback" :version="version"
      @sent="toast({ message: 'Thanks, your feedback was sent.', variant: 'success' })" />
    <CommandPalette v-model:open="paletteOpen" :groups="paletteGroups" />
  </template>
  <Toast />
</template>

<style scoped>
.app-palette-key { margin-inline-start: var(--ui-space-2); }
@media (pointer: coarse) {
  .app-palette-key { display: none; }
}
/* Shows after --ui-loading-delay like every placeholder, so a quick sign-out shows nothing. */
.app-signing-out {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-4);
  min-height: 100dvh;
  padding: var(--ui-space-4);
  color: var(--ui-muted);
  text-align: center;
  animation: app-appear 0s var(--ui-loading-delay) backwards;
}
.app-signing-out p { display: flex; align-items: center; gap: var(--ui-space-2); }
@keyframes app-appear { from { opacity: 0; } }
@media (prefers-reduced-motion: no-preference) {
  .app-signing-out__icon { animation: app-spin 1s linear infinite; }
}
@keyframes app-spin { to { transform: rotate(360deg); } }
</style>
