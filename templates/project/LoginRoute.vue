<script setup lang="ts">
// The login and signed-out routes (ui-start step 4, D58): LoginPage wired to the session, and in
// development builds DevLogin under the form. Goes to src/LoginRoute.vue. `import.meta.env.DEV`
// is the constant false in `vite build`, so the DevLogin chunk never reaches a production bundle.
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import LoginPage from './pages/LoginPage/LoginPage.vue'
import { devLogin, loginProps } from './router'
import { session } from './session'

defineProps<{ state?: 'login' | 'loggedOut' | undefined }>()

const DevLogin = import.meta.env.DEV ? defineAsyncComponent(() => import('./ui/blocks/DevLogin/DevLogin.vue')) : undefined
const route = useRoute()
const redirect = computed(() => route.query['redirect'])
const page = computed(() => loginProps(redirect.value))
</script>

<template>
  <LoginPage :state="state ?? 'login'" v-bind="page">
    <template v-if="DevLogin" #after>
      <component :is="DevLogin" :users="session.devUsers" :login="(id: string) => devLogin(id, redirect)" />
    </template>
  </LoginPage>
</template>
