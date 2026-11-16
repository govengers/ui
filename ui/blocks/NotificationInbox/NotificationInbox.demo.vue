<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { uuidv7 } from '@/api/runtime'
import { calls, live } from '@/fake/api'
import { engine } from '@/fake/live'
import Button from '../../Button/Button.vue'
import NotificationInbox from './NotificationInbox.vue'

const titles = ['Order SO-10412 was paid', 'Ada Lovelace assigned a customer to you', 'The weekly report is ready', 'An import finished with 3 warnings']
let next = 0
function arrive(): void {
  const title = titles[next++ % titles.length] ?? 'New notification'
  engine.store.insert('notifications', { id: uuidv7(), title, body: null, route: '/orders', createdAt: new Date().toISOString(), readAt: null })
}

// Opened on load so the screenshot shows the list.
const preview = ref<{ open: () => void } | null>(null)
onMounted(() => setTimeout(() => preview.value?.open(), 300))
</script>

<template>
  <section>
    <h2>Live: the count comes from the server's count read; a push adds a row</h2>
    <div class="toolbar">
      <Button @click="arrive">A notification arrives</Button>
      <NotificationInbox
        ref="preview"
        :target="live.notifications"
        :count="live.notificationCount"
        :mark-read="calls.markNotificationRead"
        :mark-all-read="calls.markAllNotificationsRead"
        :to="{ hash: '#all' }"
      />
    </div>
  </section>

  <section>
    <h2>Without a count read: the bell counts the loaded rows (3 here, so "3+")</h2>
    <div class="toolbar">
      <span class="muted">limit 3</span>
      <NotificationInbox :target="live.notifications" :limit="3" :mark-read="calls.markNotificationRead" :mark-all-read="calls.markAllNotificationsRead" />
    </div>
  </section>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--ui-space-3); max-width: 40rem; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
section:first-of-type { min-height: 34rem; }
</style>
