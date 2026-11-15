<script setup lang="ts">
import { ref } from 'vue'
import DevLogin from './DevLogin.vue'
import type { DevUser } from '../../session'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const people: DevUser[] = [
  { id: 'u-1', name: 'Ada Admin', description: 'admin' },
  { id: 'u-2', name: 'Bob Member', description: 'member, no projects' },
  { id: 'u-3', name: 'Build Agent' },
]
const signedIn = ref<string>()

async function users(): Promise<DevUser[]> {
  await wait(300)
  return people
}

async function login(id: string): Promise<void> {
  await wait(500)
  signedIn.value = people.find((person) => person.id === id)?.name
}

const never = (): Promise<DevUser[]> => new Promise(() => undefined)
const failing = async (): Promise<DevUser[]> => { throw new Error('GET /auth/dev/users answered 500') }
const none = async (): Promise<DevUser[]> => []
</script>

<template>
  <section>
    <h2>Default</h2>
    <p v-if="signedIn" class="note" role="status">Signed in as {{ signedIn }}.</p>
    <DevLogin :users="users" :login="login" />
  </section>
  <section>
    <h2>Loading</h2>
    <DevLogin :users="never" :login="login" />
  </section>
  <section>
    <h2>Error</h2>
    <DevLogin :users="failing" :login="login" />
  </section>
  <section>
    <h2>No dev login on the server (renders nothing)</h2>
    <DevLogin :users="none" :login="login" />
  </section>
</template>

<style scoped>
.note { margin-bottom: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
