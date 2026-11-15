<script setup lang="ts">
// UpdateHint (D57): tells the user a newer build was deployed and offers a reload. Compares the
// bundle's version with the server's: a value pushed over livewire (`latest`), or a `check` it
// runs every `interval`, when the tab is shown again and when the socket reconnects (a deploy
// restarts the server), at most once a minute (or per interval when shorter). Never reloads by itself: the user may be typing.
import { computed, onBeforeUnmount, onMounted, ref, watch, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LiveConnection } from '@/api/runtime'
import { useLiveStatus } from '@/api/vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import { createVersionCheck, outdated } from './updateHint'

const props = withDefaults(defineProps<{
  /** The bundle's version, import.meta.env.VITE_APP_VERSION. */
  version: string
  /** The server's version as a live read pushes it (e.g. a field of the me object). */
  latest?: string | null | undefined
  /** Asks the server for its version: a version endpoint or a livewire read. */
  check?: (() => Promise<string | null | undefined>) | undefined
  /** How often `check` runs while the tab is visible, in ms. */
  interval?: number
  reload?: (() => void) | undefined
  /** The connection whose reconnects trigger a check; the provided pair's by default. */
  connection?: MaybeRefOrGetter<LiveConnection> | undefined
  /** Shows the hint as if the server ran this version; docs and previews only. */
  force?: string | undefined
}>(), { interval: 15 * 60_000 })

const { t } = useI18n()
const server = ref<string>()
const dismissed = ref<string>()
const current = computed(() => props.force ?? server.value)
const shown = computed(() => outdated(props.version, current.value) && current.value !== dismissed.value)

watch(() => props.latest, (value) => { if (value) server.value = value }, { immediate: true })

const versions = props.check ? createVersionCheck(props.check, Math.min(60_000, props.interval)) : undefined
async function run(): Promise<void> {
  const version = await versions?.run()
  if (version) server.value = version
}

// A socket that opens again after it had been open: the server may have been redeployed.
const status = useLiveStatus(props.connection)
let wasOpen = status.value === 'open'
watch(status, (value) => {
  if (value === 'open' && wasOpen) void run()
  if (value === 'open') wasOpen = true
})

function onVisibility(): void {
  if (document.visibilityState === 'visible') void run()
}
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (!versions) return
  timer = setInterval(() => { if (document.visibilityState === 'visible') void run() }, props.interval)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibility)
})

function doReload(): void {
  if (props.reload) props.reload()
  else window.location.reload()
}
</script>

<template>
  <Banner v-if="shown" class="ui-update-hint" variant="info" icon="refresh" dismissible @dismiss="dismissed = current">
    {{ t('ui.updateAvailable') }}
    <template #action><Button size="sm" variant="primary" data-action="reload" @click="doReload">{{ t('ui.reload') }}</Button></template>
  </Banner>
</template>
