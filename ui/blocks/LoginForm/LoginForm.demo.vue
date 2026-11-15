<script setup lang="ts">
import { ref } from 'vue'
import LoginForm, { type LoginAnswer, type LoginCredentials, type LoginProvider } from './LoginForm.vue'

const signedIn = ref<string>()
const refused = (code: string): Error => Object.assign(new Error(code), { code })
const providers: LoginProvider[] = [
  { name: 'oidc', label: 'Company SSO', href: '#sso' },
  { name: 'github', label: 'GitHub', href: '#github' },
]

/** The demo's login: ada / secret signs in, bob / secret is asked for 123456 or the backup code abcd-1234, the rest fails. */
async function login(credentials: LoginCredentials): Promise<LoginAnswer | void> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (credentials.identifier === 'bob' && credentials.password === 'secret') {
    if (credentials.code === undefined) return { challenge: 'totp' }
    if (credentials.code !== (credentials.backupCode ? 'abcd-1234' : '123456')) throw refused('invalid_totp_code')
  } else if (credentials.identifier !== 'ada' || credentials.password !== 'secret') {
    throw refused('invalid_credentials')
  }
  signedIn.value = credentials.identifier
}
</script>

<template>
  <section>
    <h2>Password with providers above</h2>
    <p class="note">ada / secret signs in; bob / secret asks for the code 123456 (backup code abcd-1234).</p>
    <p v-if="signedIn" class="note" role="status">Signed in as {{ signedIn }}.</p>
    <LoginForm :login="login" :providers="providers">
      <template #logo><span class="logo">Acme</span></template>
      <template #footer>
        <a href="#forgot">Forgot password?</a>
        <a href="#signup">Create an account</a>
      </template>
    </LoginForm>
  </section>
  <section>
    <h2>SSO first, password behind a link</h2>
    <LoginForm :login="login" :providers="providers.slice(0, 1)" layout="sso" />
  </section>
  <section>
    <h2>Password only</h2>
    <LoginForm :login="login" />
  </section>
</template>

<style scoped>
.note { margin-bottom: var(--ui-space-4); color: var(--ui-muted); font-size: var(--ui-text-sm); }
.logo { font-weight: var(--ui-weight-semibold); font-size: var(--ui-text-lg); color: var(--ui-accent); }
</style>
