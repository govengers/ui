<script setup lang="ts">
// LoginForm: email, password and "remember me" in a Card, outside livewire (a pair belongs to an
// identity, which only exists after the login). The page passes `login`; its error's message
// shows in a Banner. When it answers `{ twoFactor: true }`, a second step asks for the code and
// calls `login` again with it. Native validation first (required, type=email), then the server.
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Card from '../../Card/Card.vue'
import Checkbox from '../../Checkbox/Checkbox.vue'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'

export interface LoginCredentials {
  email: string
  password: string
  remember: boolean
  /** The one-time code of the second step. */
  code?: string
}

const props = defineProps<{
  login: (credentials: LoginCredentials) => Promise<{ twoFactor?: boolean } | void>
  title?: string | undefined
}>()

defineSlots<{
  /** Above the title: the application's logo. */
  logo?(): unknown
  /** Above the fields: a "Continue with SSO" Button. */
  sso?(): unknown
  /** Under the form: links (forgot password, sign up). */
  footer?(): unknown
}>()

const { t } = useI18n()
const email = ref('')
const password = ref('')
const remember = ref(false)
const code = ref('')
const step = ref<'credentials' | 'code'>('credentials')
const loading = ref(false)
const error = ref<string>()
const codeInput = ref<InstanceType<typeof Input>>()

async function submit(): Promise<void> {
  loading.value = true
  error.value = undefined
  try {
    const credentials: LoginCredentials = { email: email.value, password: password.value, remember: remember.value }
    if (step.value === 'code') credentials.code = code.value
    const answer = await props.login(credentials)
    if (answer?.twoFactor === true && step.value === 'credentials') {
      step.value = 'code'
      await nextTick()
      codeInput.value?.focus()
    }
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : String(failure)
  } finally {
    loading.value = false
  }
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
      <slot v-if="step === 'credentials'" name="sso" />
      <form class="ui-login-form__form" @submit.prevent="submit">
        <Banner v-if="error" variant="danger">{{ error }}</Banner>
        <template v-if="step === 'credentials'">
          <Field :label="t('ui.email')" required>
            <Input v-model="email" type="email" name="email" autocomplete="username" />
          </Field>
          <Field :label="t('ui.password')" required>
            <Input v-model="password" type="password" name="password" autocomplete="current-password" />
          </Field>
          <Checkbox v-model="remember" name="remember" :label="t('ui.rememberMe')" />
        </template>
        <Field v-else :label="t('ui.verificationCode')" :hint="t('ui.verificationCodeHint')" required>
          <Input ref="codeInput" v-model="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" />
        </Field>
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
.ui-login-form__body, .ui-login-form__form { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.ui-login-form__footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--ui-space-2); font-size: var(--ui-text-sm); }
</style>
