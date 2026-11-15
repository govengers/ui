<script setup lang="ts" generic="Query extends ListQuery">
// NotificationInbox (D58): the bell with the unread count and a popover with the newest
// notifications, live. Opening one marks it read and follows its route; each unread row has its
// own mark-read button, the header marks all read. One list subscription plus an optional count
// read; mark read shows at once (optimistic upsert), mark all at once for the rows shown.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { ListResponse, LiveTarget, MutationTarget, NoParameters } from '@/api/runtime'
import { useLive, useLiveConnection, useLiveList } from '@/api/vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import EmptyState from '../../EmptyState/EmptyState.vue'
import Icon from '../../Icon/Icon.vue'
import Popover from '../../Popover/Popover.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import { formatAge } from '../../format'
import { isUnread, unreadCount, useMarkAll, type ListQuery, type NotificationLike } from './inbox'

const props = withDefaults(defineProps<{
  /** The user's notifications, newest first by the read's default sort, e.g. live.notifications. */
  target: LiveTarget<Query, ListResponse<NotificationLike>>
  /** The server's unread count, e.g. live.notificationCount; without it the bell counts the loaded rows. */
  count?: LiveTarget<NoParameters, { unread: number }> | undefined
  /** Marks one read; an Upserts effect on the list's target shows it at once. */
  markRead: MutationTarget<{ id: string }, undefined, NotificationLike>
  markAllRead: MutationTarget<NoParameters, undefined, unknown>
  /** Rows in the popover. */
  limit?: number
  /** The full notifications page, shown as "All notifications". */
  to?: RouteLocationRaw | undefined
}>(), { limit: 20 })

const { t, locale } = useI18n()
const connection = useLiveConnection()
const list = useLiveList(props.target, { limit: props.limit })
const counted = props.count ? useLive(props.count) : undefined
const markAll = useMarkAll(connection, (current) => current.call(props.markAllRead, {}, undefined))
const failure = ref<string>()
watch(connection, () => { failure.value = undefined })

const items = computed(() => list.items.value)
const count = computed(() => unreadCount(items.value, {
  server: counted?.data.value?.unread,
  total: list.total.value,
  covered: markAll.covered.value,
  markingAll: markAll.marking.value,
}))
const unread = (item: NotificationLike): boolean => isUnread(item, markAll.covered.value)

async function read(item: NotificationLike): Promise<void> {
  if (!unread(item)) return
  const mine = connection.value
  failure.value = undefined
  try {
    await mine.call(props.markRead, { id: item.id }, undefined, { optimistic: { ...item, readAt: new Date().toISOString() } })
  } catch (error) {
    if (connection.value === mine) failure.value = (error as Error).message
  }
}

async function readAll(): Promise<void> {
  failure.value = undefined
  try {
    await markAll.run(items.value) // rethrows only for the current connection
  } catch (error) {
    failure.value = (error as Error).message
  }
}

const popover = ref<InstanceType<typeof Popover> | null>(null)
defineExpose({ open: () => popover.value?.open(), close: () => popover.value?.close() })

function follow(item: NotificationLike, close: () => void): void {
  void read(item)
  close()
}
</script>

<template>
  <Popover ref="popover" class="ui-notification-inbox" align="end" :label="t('ui.notifications')">
    <template #trigger="{ toggle, expanded }">
      <span class="ui-notification-inbox__trigger">
        <Button
          variant="ghost"
          :label="count.n > 0 ? t('ui.notificationsUnread', { n: count.label }) : t('ui.notifications')"
          v-bind="expanded"
          @click="toggle"
        >
          <template #icon><Icon name="bell" /></template>
        </Button>
        <span v-if="count.n > 0" class="ui-notification-inbox__count" aria-hidden="true">{{ count.label }}</span>
      </span>
    </template>
    <template #default="{ close }">
      <div class="ui-notification-inbox__panel">
        <header class="ui-notification-inbox__head">
          <h2 class="ui-notification-inbox__heading">{{ t('ui.notifications') }}</h2>
          <Button variant="ghost" size="sm" :disabled="count.n === 0 && count.exact" :loading="markAll.marking.value" :data-action="markAllRead.name" @click="readAll">
            {{ t('ui.markAllRead') }}
          </Button>
        </header>
        <Banner v-if="failure" variant="danger">{{ failure }}</Banner>
        <Banner v-if="list.error.value" variant="danger">
          {{ list.error.value.message }}
          <template #action><Button size="sm" @click="list.retry()">{{ t('ui.retry') }}</Button></template>
        </Banner>
        <Skeleton v-else-if="list.loading.value" :lines="3" />
        <EmptyState v-else-if="items.length === 0" icon="bell" :title="t('ui.noNotifications')" :description="t('ui.noNotificationsHint')" />
        <ul v-else class="ui-notification-inbox__list">
          <li v-for="item in items" :key="item.id" class="ui-notification-inbox__item" :data-state="unread(item) ? 'unread' : 'read'">
            <span class="ui-notification-inbox__dot" aria-hidden="true" />
            <RouterLink v-if="item.route" :to="item.route" class="ui-notification-inbox__body" @click="follow(item, close)">
              <span class="ui-notification-inbox__title">{{ item.title }}<span v-if="unread(item)" class="ui-visually-hidden">, {{ t('ui.unread') }}</span></span>
              <span v-if="item.body" class="ui-notification-inbox__text">{{ item.body }}</span>
              <time class="ui-notification-inbox__time" :datetime="item.createdAt">{{ formatAge(item.createdAt, locale) }}</time>
            </RouterLink>
            <div v-else class="ui-notification-inbox__body">
              <span class="ui-notification-inbox__title">{{ item.title }}<span v-if="unread(item)" class="ui-visually-hidden">, {{ t('ui.unread') }}</span></span>
              <span v-if="item.body" class="ui-notification-inbox__text">{{ item.body }}</span>
              <time class="ui-notification-inbox__time" :datetime="item.createdAt">{{ formatAge(item.createdAt, locale) }}</time>
            </div>
            <Button v-if="unread(item)" variant="ghost" size="sm" :label="t('ui.markRead')" :data-action="markRead.name" @click="read(item)">
              <template #icon><Icon name="check" /></template>
            </Button>
          </li>
        </ul>
        <footer v-if="to" class="ui-notification-inbox__foot">
          <Button variant="ghost" size="sm" :to="to" @click="close">{{ t('ui.allNotifications') }}</Button>
        </footer>
      </div>
    </template>
  </Popover>
</template>

<style scoped>
.ui-notification-inbox__trigger { position: relative; display: inline-flex; }
.ui-notification-inbox__count {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  min-width: 1.25rem;
  padding: 0 var(--ui-space-1);
  border-radius: var(--ui-radius-pill);
  background: var(--ui-danger);
  color: var(--ui-on-danger);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-semibold);
  line-height: 1.25rem;
  text-align: center;
  pointer-events: none;
}
.ui-notification-inbox__panel { display: flex; flex-direction: column; gap: var(--ui-space-2); width: min(24rem, 90vw); max-height: min(32rem, 70vh); padding: var(--ui-space-3); }
.ui-notification-inbox__head { display: flex; align-items: center; justify-content: space-between; gap: var(--ui-space-3); }
.ui-notification-inbox__heading { font-size: var(--ui-text-md); }
.ui-notification-inbox__list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; overflow-y: auto; }
.ui-notification-inbox__item { display: flex; align-items: flex-start; gap: var(--ui-space-2); padding: var(--ui-space-2) 0; }
.ui-notification-inbox__item + .ui-notification-inbox__item { border-top: var(--ui-border-width) solid var(--ui-border); }
.ui-notification-inbox__dot { flex: none; width: var(--ui-space-2); height: var(--ui-space-2); margin-top: var(--ui-space-2); border-radius: var(--ui-radius-pill); }
.ui-notification-inbox__item[data-state="unread"] .ui-notification-inbox__dot { background: var(--ui-accent); }
.ui-notification-inbox__body { display: flex; flex: 1; flex-direction: column; gap: var(--ui-space-1); min-width: 0; color: inherit; text-decoration: none; border-radius: var(--ui-radius-sm); }
a.ui-notification-inbox__body:hover .ui-notification-inbox__title { text-decoration: underline; }
.ui-notification-inbox__title { color: var(--ui-ink-2); }
.ui-notification-inbox__item[data-state="unread"] .ui-notification-inbox__title { color: var(--ui-ink); font-weight: var(--ui-weight-medium); }
.ui-notification-inbox__text { color: var(--ui-muted); font-size: var(--ui-text-sm); overflow-wrap: anywhere; }
.ui-notification-inbox__time { color: var(--ui-muted); font-size: var(--ui-text-xs); }
.ui-notification-inbox__foot { display: flex; justify-content: center; border-top: var(--ui-border-width) solid var(--ui-border); padding-top: var(--ui-space-2); }
</style>
