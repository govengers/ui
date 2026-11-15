<script setup lang="ts">
// DevLogin: the development users of govengers/auth's dev login provider, one click each signs in
// (D58). Development only: the page imports it behind `import.meta.env.DEV` so production bundles
// never carry it, and it renders nothing when the server has no dev login (no users).
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Avatar from '../../Avatar/Avatar.vue'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Card from '../../Card/Card.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import type { DevUser } from '../../session'

const props = defineProps<{
  /** session.devUsers: GET /auth/dev/users, [] without a dev login. */
  users: () => Promise<DevUser[]>
  /** session.devLogin plus the navigation. */
  login: (id: string) => Promise<void>
}>()

const { t } = useI18n()
const list = ref<DevUser[]>()
const signingIn = ref<string>()
const error = ref<string>()

async function load(): Promise<void> {
  error.value = undefined
  try {
    list.value = await props.users()
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : String(failure)
  }
}

async function pick(user: DevUser): Promise<void> {
  signingIn.value = user.id
  error.value = undefined
  try {
    await props.login(user.id)
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : String(failure)
  } finally {
    signingIn.value = undefined
  }
}

onMounted(load)
</script>

<template>
  <Card v-if="list === undefined || list.length > 0 || error" class="ui-dev-login" as="section" :title="t('ui.devLogin')">
    <div class="ui-dev-login__body">
      <p class="ui-dev-login__hint">{{ t('ui.devLoginHint') }}</p>
      <Banner v-if="error" variant="danger">
        {{ error }}
        <template v-if="list === undefined" #action><Button size="sm" @click="load">{{ t('ui.retry') }}</Button></template>
      </Banner>
      <Skeleton v-if="list === undefined && !error" :lines="3" />
      <ul v-else-if="list" class="ui-dev-login__list">
        <li v-for="user in list" :key="user.id">
          <button
            type="button"
            class="ui-dev-login__user"
            data-action="devLogin"
            :data-user="user.id"
            :disabled="signingIn !== undefined"
            :aria-busy="signingIn === user.id || undefined"
            :aria-label="t('ui.signInAs', { name: user.name })"
            @click="pick(user)"
          >
            <Avatar :name="user.name" size="sm" />
            <span class="ui-dev-login__who">
              <span class="ui-dev-login__name">{{ user.name }}</span>
              <span v-if="user.email" class="ui-dev-login__email">{{ user.email }}</span>
            </span>
            <span class="ui-dev-login__roles">
              <Badge v-for="role in user.roles ?? []" :key="role" size="sm">{{ role }}</Badge>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </Card>
</template>

<style scoped>
.ui-dev-login { width: 100%; max-width: 26rem; }
.ui-dev-login__body { display: grid; gap: var(--ui-space-3); }
.ui-dev-login__hint { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.ui-dev-login__list { display: grid; gap: var(--ui-space-1); width: 100%; margin: 0; padding: 0; list-style: none; }
.ui-dev-login__user {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  width: 100%;
  min-height: var(--ui-control-h);
  padding: var(--ui-space-2) var(--ui-space-3);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-control);
  background: var(--ui-surface);
  color: var(--ui-ink);
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.ui-dev-login__user:hover:not(:disabled) { background: var(--ui-surface-2); }
.ui-dev-login__user:disabled { cursor: progress; opacity: var(--ui-disabled-opacity); }
.ui-dev-login__user[aria-busy='true'] { border-color: var(--ui-accent); }
.ui-dev-login__who { display: grid; flex: 1; min-width: 0; }
.ui-dev-login__name { font-weight: var(--ui-weight-medium); }
.ui-dev-login__email { color: var(--ui-muted); font-size: var(--ui-text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-dev-login__roles { display: flex; flex-wrap: wrap; gap: var(--ui-space-1); }
</style>
