<script setup lang="ts">
// ImpersonationBanner: the shell's notice while an admin acts as another user (D59): who is acted
// as, by whom, the time left when the end is known, read-only when the app says so, and Stop.
// Nothing while the identity has no impersonator. Emits `expired` once the end passed, so the app
// resumes the session (govengers/auth ends it on the next request).
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import { formatSpan } from '../../format'
import type { SessionIdentity } from '../../session'

const props = defineProps<{
  /** session.identity.value */
  identity: SessionIdentity | null
  /** session.stopImpersonating */
  stop: () => Promise<void>
  /** When the impersonation ends; identity.impersonationEndsAt by default. */
  endsAt?: string | Date | undefined
  /** The app forbids writes while impersonating; shows a Read-only badge. */
  readOnly?: boolean | undefined
}>()

const emit = defineEmits<{ expired: [] }>()
const { t } = useI18n()
const now = ref(Date.now())
const stopping = ref(false)
const error = ref<string>()

const nameOf = (identity: SessionIdentity): string => identity.name ?? identity.username ?? identity.email ?? identity.subject
const actor = computed(() => props.identity?.impersonator)
const end = computed(() => {
  const value = props.endsAt ?? props.identity?.impersonationEndsAt
  return value === undefined ? undefined : new Date(value).getTime()
})
const left = computed(() => (end.value === undefined ? undefined : Math.max(0, (end.value - now.value) / 1000)))

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(timer))

watch(left, (seconds, before) => {
  if (seconds === 0 && before !== 0 && actor.value !== undefined) emit('expired')
}, { immediate: true })

async function run(): Promise<void> {
  stopping.value = true
  error.value = undefined
  try {
    await props.stop()
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : String(failure)
  } finally {
    stopping.value = false
  }
}
</script>

<template>
  <Banner v-if="identity && actor" class="ui-impersonation-banner" variant="warning" icon="user">
    <span class="ui-impersonation-banner__text">
      <span>{{ t('ui.impersonating', { target: nameOf(identity), actor: nameOf(actor) }) }}</span>
      <Badge v-if="readOnly" size="sm">{{ t('ui.readOnly') }}</Badge>
      <!-- The ticking countdown is not announced every second; its end is. -->
      <span v-if="left !== undefined" class="ui-impersonation-banner__left" :aria-live="left > 0 ? 'off' : undefined">
        {{ left > 0 ? t('ui.timeLeft', { time: formatSpan(left) }) : t('ui.impersonationEnded') }}
      </span>
      <span v-if="error" class="ui-impersonation-banner__error" role="alert">{{ error }}</span>
    </span>
    <template #action>
      <Button size="sm" data-action="stopImpersonation" :loading="stopping" @click="run">
        {{ t('ui.stopImpersonating', { target: nameOf(identity) }) }}
      </Button>
    </template>
  </Banner>
</template>

<style scoped>
.ui-impersonation-banner__text { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-1) var(--ui-space-3); }
.ui-impersonation-banner__left { font-variant-numeric: tabular-nums; }
.ui-impersonation-banner__error { font-weight: var(--ui-weight-semibold); }
</style>
