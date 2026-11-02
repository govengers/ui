<script setup lang="ts">
// LoginPage recipe (login-and-session): the three auth screens on a bare AppShell, outside
// livewire. `login` and `change` come from the app's auth module (they end and rebuild the pair,
// then navigate); the page shows their errors. One file, `state` picks the screen.
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { ApiError } from '@/api/runtime'
import AppShell from '../../ui/AppShell/AppShell.vue'
import Badge from '../../ui/Badge/Badge.vue'
import Banner from '../../ui/Banner/Banner.vue'
import Button from '../../ui/Button/Button.vue'
import Card from '../../ui/Card/Card.vue'
import Field from '../../ui/Field/Field.vue'
import Input from '../../ui/Input/Input.vue'
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import LoginForm, { type LoginCredentials } from '../../ui/blocks/LoginForm/LoginForm.vue'
import { messages } from './messages'

const props = withDefaults(defineProps<{
  state?: 'login' | 'loggedOut' | 'changePassword' | undefined
  /** Signs in (see LoginForm): answers { twoFactor: true } for the code step, throws an Error whose message is shown. */
  login: (credentials: LoginCredentials) => Promise<{ twoFactor?: boolean } | void>
  /** Changes the password: throws an ApiError with fields (shown at the Fields) or an Error. */
  change: (passwords: { currentPassword: string; newPassword: string }) => Promise<void>
  /** Where "Sign in again" goes. */
  loginRoute?: RouteLocationRaw | undefined
  /** The app's version, shown in the corner. */
  version?: string | undefined
}>(), { state: 'login', loginRoute: () => ({ name: 'auth.login' }) })

defineSlots<{
  /** The app's logo in the top bar; the app name by default. */
  logo?(): unknown
}>()

const { t } = useI18n({ useScope: 'global', messages })

const page = computed(() => ({ login: 'auth.login', loggedOut: 'auth.loggedOut', changePassword: 'auth.changePassword' })[props.state])
const heading = computed(() => ({
  login: t('auth.login.heading', { app: t('auth.app') }),
  loggedOut: t('auth.loggedOut.heading'),
  changePassword: t('auth.changePassword.heading'),
})[props.state])

// Change password: never prefilled; the repeat is checked here, the rest by the server.
const passwords = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errors = ref<Record<string, string>>({})
const failure = ref<string>()
const changing = ref(false)
const changed = ref(false)

async function submitChange(): Promise<void> {
  errors.value = {}
  failure.value = undefined
  changed.value = false
  if (passwords.newPassword !== passwords.confirmPassword) {
    errors.value = { confirmPassword: t('auth.changePassword.mismatch') }
    return
  }
  changing.value = true
  try {
    await props.change({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
    Object.assign(passwords, { currentPassword: '', newPassword: '', confirmPassword: '' })
    changed.value = true
  } catch (error) {
    if (error instanceof ApiError && Object.keys(error.fields).length > 0) errors.value = { ...error.fields }
    else failure.value = error instanceof Error ? error.message : String(error)
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <AppShell bare :title="t('auth.app')" :nav="[]">
    <Page :data-page="page" width="content">
      <!-- The h1 for assistive technology; the card's title says the same on screen. -->
      <PageHeader :title="heading" class="ui-visually-hidden" />
      <div class="login-page__column">
        <LoginForm v-if="state === 'login'" :login="login">
          <template #sso>
            <Button block href="/auth/sso/start" data-action="loginSso">{{ t('auth.login.sso') }}</Button>
          </template>
          <template #footer>
            <a href="/auth/forgot">{{ t('auth.login.forgot') }}</a>
          </template>
        </LoginForm>

        <Card v-else-if="state === 'loggedOut'" :title="t('auth.loggedOut.title')" as="section">
          <div class="login-page__stack">
            <p>{{ t('auth.loggedOut.text') }}</p>
            <Button variant="primary" block :to="loginRoute">{{ t('auth.loggedOut.again') }}</Button>
          </div>
        </Card>

        <form v-else @submit.prevent="submitChange">
          <Card :title="t('auth.changePassword.title')" as="section">
            <div class="login-page__stack">
              <Banner v-if="failure" variant="danger">{{ failure }}</Banner>
              <Banner v-if="changed" variant="success">{{ t('auth.changePassword.changed') }}</Banner>
              <Field :label="t('auth.changePassword.currentPassword')" :error="errors.currentPassword" required>
                <Input v-model="passwords.currentPassword" type="password" name="currentPassword" autocomplete="current-password" />
              </Field>
              <Field :label="t('auth.changePassword.newPassword')" :hint="t('auth.changePassword.newPasswordHint')" :error="errors.newPassword" required>
                <Input v-model="passwords.newPassword" type="password" name="newPassword" autocomplete="new-password" minlength="12" />
              </Field>
              <Field :label="t('auth.changePassword.confirmPassword')" :error="errors.confirmPassword" required>
                <Input v-model="passwords.confirmPassword" type="password" name="confirmPassword" autocomplete="new-password" />
              </Field>
              <Button type="submit" variant="primary" block data-action="changePassword" :loading="changing">{{ t('auth.changePassword.submit') }}</Button>
            </div>
          </Card>
        </form>

        <footer class="login-page__footer">
          <a href="/imprint">{{ t('auth.imprint') }}</a>
          <Badge v-if="version" size="sm">{{ t('auth.version', { version }) }}</Badge>
        </footer>
      </div>
    </Page>
    <!-- After the Page: ui-lint reads the template up to the first nested </template>. -->
    <template v-if="$slots.logo" #brand><slot name="logo" /></template>
  </AppShell>
</template>

<style scoped>
.login-page__column { display: grid; grid-template-columns: minmax(0, 26rem); justify-content: center; gap: var(--ui-space-4); }
.login-page__stack { display: grid; gap: var(--ui-space-4); }
.login-page__footer { display: grid; grid-auto-flow: column; justify-content: space-between; align-items: center; gap: var(--ui-space-4); }
</style>
