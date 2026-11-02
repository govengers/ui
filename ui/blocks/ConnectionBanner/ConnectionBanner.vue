<script setup lang="ts">
// ConnectionBanner: the shell's connection notice (D34) over useLiveStatus(). Nothing while the
// socket is open, connecting for the first time or idle; a warning while it reconnects (a
// connect after it had been open counts: a going-away close reconnects as 'connecting'); a
// danger notice with Retry once the connection ended.
import { computed, ref, watch, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LiveConnection, LiveStatus } from '@/api/runtime'
import { useLiveStatus } from '@/api/vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'

const props = defineProps<{
  /** The connection to watch; the provided pair's by default. Read once. */
  connection?: MaybeRefOrGetter<LiveConnection> | undefined
  /** Makes a new pair (or reloads); shown as Retry on the offline notice when given. */
  reconnect?: (() => void) | undefined
  /** Shows this status instead of the live one; docs and previews only. */
  force?: LiveStatus | undefined
}>()

const { t } = useI18n()
const live = useLiveStatus(props.connection)
const status = computed(() => props.force ?? live.value)
const wasOpen = ref(false)
watch(status, (value) => {
  if (value === 'open') wasOpen.value = true
}, { immediate: true })
const reconnecting = computed(() => status.value === 'reconnecting' || (status.value === 'connecting' && wasOpen.value))
</script>

<template>
  <Banner v-if="reconnecting" class="ui-connection-banner" variant="warning" icon="refresh">{{ t('ui.reconnecting') }}</Banner>
  <Banner v-else-if="status === 'ended'" class="ui-connection-banner" variant="danger">
    {{ t('ui.offline') }}
    <template v-if="reconnect" #action><Button size="sm" data-action="reconnect" @click="reconnect">{{ t('ui.retry') }}</Button></template>
  </Banner>
</template>
