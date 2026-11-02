<script setup lang="ts">
import { ref } from 'vue'
import LoginForm, { type LoginCredentials } from './LoginForm.vue'
import Button from '../../Button/Button.vue'

const signedIn = ref<string>()

/** The demo's login: ada@example.com / secret signs in, bob@example.com is asked for 123456, the rest fails. */
async function login(credentials: LoginCredentials): Promise<{ twoFactor?: boolean } | void> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (credentials.email === 'bob@example.com' && credentials.password === 'secret') {
    if (credentials.code === undefined) return { twoFactor: true }
    if (credentials.code !== '123456') throw new Error('That code is not valid. Try the newest one.')
  } else if (credentials.email !== 'ada@example.com' || credentials.password !== 'secret') {
    throw new Error('Email or password is wrong.')
  }
  signedIn.value = credentials.email
}
</script>

<template>
  <section>
    <h2>Email and password, SSO above, links below</h2>
    <p class="note">ada@example.com / secret signs in; bob@example.com / secret asks for the code 123456.</p>
    <p v-if="signedIn" class="note" role="status">Signed in as {{ signedIn }}.</p>
    <LoginForm :login="login">
      <template #logo><span class="logo">Acme</span></template>
      <template #sso><Button block>Continue with SSO</Button></template>
      <template #footer>
        <a href="#forgot">Forgot password?</a>
        <a href="#signup">Create an account</a>
      </template>
    </LoginForm>
  </section>
</template>

<style scoped>
.note { margin-bottom: var(--ui-space-4); color: var(--ui-muted); font-size: var(--ui-text-sm); }
.logo { font-weight: var(--ui-weight-semibold); font-size: var(--ui-text-lg); color: var(--ui-accent); }
</style>
