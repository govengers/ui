<script setup lang="ts">
// LoginForm: user name or email and password, redirect providers (OIDC, GitHub) as buttons, and
// the TOTP step, outside livewire (a pair belongs to an identity, which only exists after the
// login). The page passes `login` (session.login wrapped with the navigation, D57); a thrown
// error with a known govengers/auth `code` shows as its sentence, any other as its message.
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Card from '../../Card/Card.vue'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'

export interface LoginCredentials {
  identifier: string
  password: string
  /** The second step: the TOTP code, or a backup code when `backupCode` is true. */
  code?: string
  backupCode?: boolean
}

/** A login that leaves the page; `href` already carries the sanitised return path. */
export interface LoginProvider {
  name: string
  label: string
  href: string
}

const props = withDefaults(defineProps<{
  login: (credentials: LoginCredentials) => Promise<{ twoFactor?: boolean } | void>
  title?: string | undefined
  providers?: readonly LoginProvider[] | undefined
  /** `sso`: the providers first, the password form behind a link. */
  layout?: 'password' | 'sso' | undefined
}>(), { providers: () => [], layout: 'password' })

defineSlots<{
  /** Above the title: the application's logo. */
  logo?(): unknown
  /** Under the form: links (forgot password, sign up). */
  footer?(): unknown
}>()

// The govengers/auth codes a user can act on; any other refusal shows its message.
const reasons: Record<string, string> = {
  invalid_credentials: 'ui.wrongCredentials',
  invalid_totp_code: 'ui.wrongCode',
  no_pending_login: 'ui.loginExpired',
  totp_setup_required: 'ui.totpSetupRequired',
}

const { t } = useI18n()
const identifier = ref('')
const password = ref('')
const code = ref('')
const backupCode = ref(false)
const step = ref<'credentials' | 'code'>('credentials')
const passwordShown = ref(props.layout === 'password' || props.providers.length === 0)
const loading = ref(false)
const error = ref<string>()
const codeInput = ref<InstanceType<typeof Input>>()
const codeLabel = computed(() => (backupCode.value ? t('ui.backupCode') : t('ui.verificationCode')))

async function submit(): Promise<void> {
  loading.value = true
  error.value = undefined
  try {
    const credentials: LoginCredentials = { identifier: identifier.value, password: password.value }
    if (step.value === 'code') Object.assign(credentials, { code: code.value, backupCode: backupCode.value })
    const answer = await props.login(credentials)
    if (answer?.twoFactor === true && step.value === 'credentials') {
      step.value = 'code'
      await nextTick()
      codeInput.value?.focus()
    }
  } catch (failure) {
    const reason = typeof failure === 'object' && failure !== null && 'code' in failure ? reasons[String(failure.code)] : undefined
    error.value = reason !== undefined ? t(reason) : failure instanceof Error ? failure.message : String(failure)
    if (step.value === 'code' && reason === 'ui.loginExpired') step.value = 'credentials'
  } finally {
    loading.value = false
  }
}

async function switchCode(): Promise<void> {
  backupCode.value = !backupCode.value
  code.value = ''
  await nextTick()
  codeInput.value?.focus()
}
</script>

<template>
  <Card class="ui-login-form" as="section">
    <template #header>
      <div class="ui-login-form__head">
        <slot name="logo" />
        <h2 class="ui-login-form__title">{{ title ?? t('ui.signIn') }}</h2>
      </div>
    </template>
    <div class="ui-login-form__body">
      <Banner v-if="error" variant="danger">{{ error }}</Banner>
      <div v-if="step === 'credentials' && providers.length > 0" class="ui-login-form__providers" :data-layout="layout">
        <Button
          v-for="provider in providers"
          :key="provider.name"
          block
          :variant="layout === 'sso' ? 'primary' : 'secondary'"
          :href="provider.href"
          data-action="loginSso"
          :data-provider="provider.name"
        >{{ t('ui.signInWith', { provider: provider.label }) }}</Button>
        <p v-if="passwordShown" class="ui-login-form__or">{{ t('ui.orSignInWith') }}</p>
        <Button v-else variant="ghost" block @click="passwordShown = true">{{ t('ui.usePassword') }}</Button>
      </div>
      <form v-if="passwordShown || step === 'code'" class="ui-login-form__form" @submit.prevent="submit">
        <template v-if="step === 'credentials'">
          <Field :label="t('ui.identifier')" required>
            <Input v-model="identifier" name="identifier" autocomplete="username" autocapitalize="none" spellcheck="false" />
          </Field>
          <Field :label="t('ui.password')" required>
            <Input v-model="password" type="password" name="password" autocomplete="current-password" />
          </Field>
        </template>
        <template v-else>
          <Field :label="codeLabel" :hint="backupCode ? t('ui.backupCodeHint') : t('ui.verificationCodeHint')" required>
            <Input
              ref="codeInput"
              v-model="code"
              name="code"
              :inputmode="backupCode ? 'text' : 'numeric'"
              :autocomplete="backupCode ? 'off' : 'one-time-code'"
              :pattern="backupCode ? undefined : '[0-9]{6}'"
              :maxlength="backupCode ? 64 : 6"
            />
          </Field>
          <Button variant="ghost" size="sm" @click="switchCode">{{ backupCode ? t('ui.useAuthenticator') : t('ui.useBackupCode') }}</Button>
        </template>
        <Button type="submit" variant="primary" block data-action="login" :loading="loading">{{ t('ui.signIn') }}</Button>
      </form>
      <div v-if="$slots.footer" class="ui-login-form__footer"><slot name="footer" /></div>
    </div>
  </Card>
</template>

<style scoped>
.ui-login-form { width: 100%; max-width: 26rem; }
.ui-login-form__head { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.ui-login-form__title { font-size: var(--ui-text-xl); }
.ui-login-form__body, .ui-login-form__form, .ui-login-form__providers { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.ui-login-form__providers { gap: var(--ui-space-2); }
.ui-login-form__or { text-align: center; color: var(--ui-muted); font-size: var(--ui-text-sm); }
.ui-login-form__footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--ui-space-2); font-size: var(--ui-text-sm); }
</style>
