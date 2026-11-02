<script setup lang="ts">
import { ref } from 'vue'
import { ApiError } from '@/api/runtime'
import LoginPage from './LoginPage.vue'
import type { LoginCredentials } from '../../ui/blocks/LoginForm/LoginForm.vue'

const signedIn = ref<string>()
const wait = () => new Promise((resolve) => setTimeout(resolve, 400))

/** The demo's login: ada@example.com / secret signs in, bob@example.com / secret is asked for 123456, the rest fails. */
async function login(credentials: LoginCredentials): Promise<{ twoFactor?: boolean } | void> {
  await wait()
  if (credentials.email === 'bob@example.com' && credentials.password === 'secret') {
    if (credentials.code === undefined) return { twoFactor: true }
    if (credentials.code !== '123456') throw new Error('That code is not valid. Try the newest one.')
  } else if (credentials.email !== 'ada@example.com' || credentials.password !== 'secret') {
    throw new Error('Email or password is wrong.')
  }
  signedIn.value = credentials.email
}

/** The demo's change: the current password is "secret"; anything else is refused at its field. */
async function change(passwords: { currentPassword: string; newPassword: string }): Promise<void> {
  await wait()
  if (passwords.currentPassword !== 'secret') {
    throw new ApiError(422, { code: 'invalid_request', message: 'invalid request', fields: { currentPassword: 'This is not your current password.' } })
  }
}

// "Sign in again" stays on this demo page instead of a route the demo does not have.
const here = { hash: '#login' }
</script>

<template>
  <section id="login">
    <h2>Sign in (ada@example.com / secret; bob@example.com / secret asks for 123456)</h2>
    <p v-if="signedIn" class="note" role="status">Signed in as {{ signedIn }}.</p>
    <div class="frame"><LoginPage :login="login" :change="change" :login-route="here" version="1.4.0" /></div>
  </section>
  <section>
    <h2>Logged out</h2>
    <div class="frame"><LoginPage state="loggedOut" :login="login" :change="change" :login-route="here" version="1.4.0" /></div>
  </section>
  <section>
    <h2>Change password (current password: secret)</h2>
    <div class="frame"><LoginPage state="changePassword" :login="login" :change="change" :login-route="here" version="1.4.0" /></div>
  </section>
</template>

<style scoped>
/* DemoPage spaces every demo <section>; a Card rendered as a section inside the page must not get that margin. */
.frame :deep(section) { margin-bottom: 0; }
.frame { border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); overflow: hidden; }
.frame :deep(.ui-app-shell) { min-height: 0; }
.frame :deep(.ui-app-shell__top) { position: static; }
.note { margin-bottom: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
