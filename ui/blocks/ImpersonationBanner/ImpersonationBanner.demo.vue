<script setup lang="ts">
import { ref } from 'vue'
import ImpersonationBanner from './ImpersonationBanner.vue'
import type { SessionIdentity } from '../../session'

const admin: SessionIdentity = { provider: 'password', subject: 'u-1', name: 'Ada Admin', active: true, roles: ['admin'] }
const bob: SessionIdentity = { provider: 'password', subject: 'u-2', name: 'Bob Member', active: true, roles: [], impersonator: admin }
const inMinutes = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString()

const identity = ref<SessionIdentity | null>({ ...bob, impersonationEndsAt: inMinutes(42) })
const expired = ref(0)

async function stop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  identity.value = admin
}
async function failing(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  throw new Error('Could not stop: the session changed elsewhere.')
}
</script>

<template>
  <section>
    <h2>Default, with the time left (Stop ends it)</h2>
    <ImpersonationBanner :identity="identity" :stop="stop" />
    <p v-if="identity && !identity.impersonator" class="note" role="status">Back as {{ identity.name }}; the banner is gone.</p>
  </section>
  <section>
    <h2>Read-only, end unknown, Stop fails</h2>
    <ImpersonationBanner :identity="bob" :stop="failing" read-only />
  </section>
  <section>
    <h2>Ended (emits expired)</h2>
    <ImpersonationBanner :identity="bob" :stop="stop" :ends-at="inMinutes(-1)" @expired="expired += 1" />
  </section>
  <section>
    <h2>Not impersonating (renders nothing)</h2>
    <ImpersonationBanner :identity="admin" :stop="stop" />
  </section>
</template>

<style scoped>
.note { margin-top: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
