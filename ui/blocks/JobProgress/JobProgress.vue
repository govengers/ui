<script setup lang="ts">
// JobProgress: the background-mode block (D29) over govengers/jobs' job view. Follows one job
// live (`target` + `id`), or shows a job the page already holds (`job`, a row of the live jobs
// list): its status, its progress, why it failed, Cancel and Retry when the page passes the
// mutations, and the way to its result, which comes from the item read. Emits `done` once.
import { computed, shallowRef, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { ApiError, type LiveTarget, type MutationTarget } from '@/api/runtime'
import { useLive, useLiveConnection } from '@/api/vue'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import { formatPercent } from '../../format'
import { actionsOf, barValue, errorClassKey, finishedNow, type JobLike, type JobStatus } from './job'

const props = withDefaults(defineProps<{
  /** The job item read, e.g. live['jobs.item']; with `job` it is read once for the result. */
  target?: LiveTarget<{ id: string }, JobLike> | undefined
  id?: string | undefined
  /** A job the page already reads: shown as it is, no subscription. Wins over target. */
  job?: JobLike | undefined
  /** What the job does, in words; the job's kind by default. */
  title?: string | undefined
  /** Where a succeeded job's result is shown, from its result; none hides "Open result". */
  resultRoute?: ((result: unknown, job: JobLike) => RouteLocationRaw | undefined) | undefined
  resultLabel?: string | undefined
  /** The cancel mutation, e.g. calls.cancelJob; none hides Cancel. */
  cancel?: MutationTarget<{ id: string }, undefined, JobLike> | undefined
  /** The retry mutation, e.g. calls.retryJob; none hides Retry. */
  retry?: MutationTarget<{ id: string }, undefined, JobLike> | undefined
  /** `inline`: one compact row, for a list. */
  variant?: 'default' | 'inline'
}>(), { variant: 'default' })

const emit = defineEmits<{ done: [job: JobLike] }>()
const slots = defineSlots<{ result?: (props: { result: unknown; job: JobLike }) => unknown }>()
const { t, locale } = useI18n()
const connection = useLiveConnection()

// ponytail: the source is fixed at mount; a page that switches between `job` and `target` keys the block.
const live = props.job === undefined && props.target !== undefined ? useLive(props.target, () => ({ id: props.id ?? '' })) : undefined
const current = computed(() => props.job ?? live?.data.value)
const actions = computed(() => (current.value === undefined ? { cancel: false, retry: false } : actionsOf(current.value)))
const bar = computed(() => current.value?.status === 'queued' || current.value?.status === 'running')

const badges: Record<JobStatus, { variant: 'neutral' | 'accent' | 'success' | 'danger'; label: string }> = {
  queued: { variant: 'neutral', label: 'ui.queued' },
  running: { variant: 'accent', label: 'ui.running' },
  succeeded: { variant: 'success', label: 'ui.succeeded' },
  failed: { variant: 'danger', label: 'ui.failed' },
  cancelled: { variant: 'neutral', label: 'ui.cancelled' },
}
const badge = computed(() => (current.value?.status === 'running' && current.value.cancelRequested === true
  ? { variant: 'neutral' as const, label: 'ui.cancelling' }
  : badges[current.value?.status ?? 'queued']))

// A list row carries no result (govengers/jobs leaves it out of the list): a succeeded row
// without one is read once through the item read. A finished job never changes.
const fetched = shallowRef<{ id: string; connection: unknown; result: unknown }>()
const wantsResult = props.resultRoute !== undefined || slots.result !== undefined
watch([() => (props.job?.status === 'succeeded' && props.job.result == null ? props.job.id : undefined), connection], async ([id, socket]) => {
  if (id === undefined || props.target === undefined || !wantsResult || (fetched.value?.id === id && fetched.value.connection === socket)) return
  try {
    const item = await socket.query(props.target, { id })
    if (props.job?.id === id && connection.value === socket) fetched.value = { id, connection: socket, result: item.result }
  } catch {
    // shortcut: an unreadable result (a job past its retention) shows no result; a refusal message may be wanted later.
  }
}, { immediate: true })
const result = computed(() => {
  const job = current.value
  if (job?.status !== 'succeeded') return undefined
  if (props.job === undefined || job.result != null) return job.result ?? undefined
  return fetched.value?.id === job.id && fetched.value.connection === connection.value ? fetched.value.result ?? undefined : undefined
})
const route = computed(() => (result.value === undefined || current.value === undefined ? undefined : props.resultRoute?.(result.value, current.value)))

// Cancel and Retry run over the socket; the answer upserts the job into the live reads.
const running = shallowRef<'cancel' | 'retry'>()
const failure = shallowRef<{ connection: unknown; message: string }>()
const actionError = computed(() => (failure.value?.connection === connection.value ? failure.value.message : undefined))
async function act(action: 'cancel' | 'retry'): Promise<void> {
  const mutation = action === 'cancel' ? props.cancel : props.retry
  const job = current.value
  if (mutation === undefined || job === undefined) return
  const socket = connection.value
  running.value = action
  failure.value = undefined
  try {
    await socket.call(mutation, { id: job.id }, undefined)
  } catch (error) {
    const message = error instanceof ApiError && error.code === 'conflict' ? t('ui.jobChanged') : error instanceof Error ? error.message : String(error)
    failure.value = { connection: socket, message }
  } finally {
    running.value = undefined
  }
}

let reported: string | undefined
watch(current, (job) => {
  if (!finishedNow(job, reported)) return
  reported = job.id
  emit('done', job)
}, { immediate: true })
</script>

<template>
  <div class="ui-job-progress" :data-variant="variant" :data-state="live?.error.value ? 'error' : undefined" :aria-busy="live?.loading.value || undefined">
    <Banner v-if="live?.error.value" variant="danger">
      {{ live.error.value.message }}
      <template #action><Button size="sm" @click="live.retry()">{{ t('ui.retry') }}</Button></template>
    </Banner>
    <Skeleton v-else-if="!current" :lines="2" />
    <template v-else>
      <div class="ui-job-progress__head" aria-live="polite">
        <span class="ui-job-progress__title">{{ title ?? current.kind }}</span>
        <Badge :variant="badge.variant" dot>{{ t(badge.label) }}</Badge>
      </div>
      <div v-if="bar" class="ui-job-progress__bar">
        <progress class="ui-job-progress__progress" max="100" :value="barValue(current)" :aria-label="title ?? current.kind" />
        <span v-if="barValue(current) !== undefined" class="ui-job-progress__percent">{{ formatPercent((barValue(current) ?? 0) / 100, locale) }}</span>
      </div>
      <p v-if="bar && current.progressMessage" class="ui-job-progress__message">{{ current.progressMessage }}</p>
      <p v-if="current.status === 'failed' && (current.error || errorClassKey(current))" class="ui-job-progress__error">
        <span v-if="errorClassKey(current)" class="ui-job-progress__class">{{ t(errorClassKey(current) ?? '') }}</span>
        {{ current.error }}
      </p>
      <slot v-if="result !== undefined" name="result" :result="result" :job="current" />
      <p v-if="actionError" class="ui-job-progress__error" role="alert">{{ actionError }}</p>
      <div v-if="route || (cancel && actions.cancel) || (retry && actions.retry)" class="ui-job-progress__actions">
        <Button v-if="cancel && actions.cancel" variant="ghost" :size="variant === 'inline' ? 'sm' : 'md'" :data-action="cancel.name" :loading="running === 'cancel'" @click="act('cancel')">
          {{ t('ui.cancelJob') }}
        </Button>
        <Button v-if="retry && actions.retry" :size="variant === 'inline' ? 'sm' : 'md'" :data-action="retry.name" :loading="running === 'retry'" @click="act('retry')">
          {{ t('ui.retryJob') }}
        </Button>
        <Button v-if="route" variant="primary" :size="variant === 'inline' ? 'sm' : 'md'" :to="route" data-action="openResult">
          {{ resultLabel ?? t('ui.openResult') }}
        </Button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ui-job-progress {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-3);
  padding: var(--ui-card-p);
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
}
.ui-job-progress[data-variant="inline"] {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ui-space-2) var(--ui-space-4);
  padding: var(--ui-row-py) 0;
  background: none;
  border: 0;
  border-radius: 0;
}
/* A failed read is the Banner alone, without the panel around it. */
.ui-job-progress[data-state="error"] { padding: 0; border: 0; background: none; }
.ui-job-progress__head { display: flex; align-items: center; gap: var(--ui-space-3); min-width: 0; }
.ui-job-progress__title { font-weight: var(--ui-weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-job-progress[data-variant="default"] .ui-job-progress__title { flex: 1; }

.ui-job-progress__bar { display: flex; align-items: center; gap: var(--ui-space-3); }
.ui-job-progress[data-variant="inline"] .ui-job-progress__bar { flex: 1; min-width: 8rem; }
.ui-job-progress__progress {
  flex: 1;
  height: var(--ui-space-2);
  appearance: none;
  border: 0;
  border-radius: var(--ui-radius-pill);
  background: var(--ui-border);
  color: var(--ui-accent);
  overflow: hidden;
}
.ui-job-progress__progress::-webkit-progress-bar { background: var(--ui-border); }
.ui-job-progress__progress::-webkit-progress-value { background: var(--ui-accent); border-radius: var(--ui-radius-pill); transition: width var(--ui-duration) var(--ui-ease); }
.ui-job-progress__progress::-moz-progress-bar { background: var(--ui-accent); border-radius: var(--ui-radius-pill); }
.ui-job-progress__percent { min-width: 3rem; text-align: end; font-size: var(--ui-text-sm); color: var(--ui-muted); }

.ui-job-progress__message { font-size: var(--ui-text-sm); color: var(--ui-muted); }
.ui-job-progress__error { font-size: var(--ui-text-sm); color: var(--ui-on-danger-soft); }
.ui-job-progress__class { display: block; font-weight: var(--ui-weight-medium); }
.ui-job-progress[data-variant="inline"] .ui-job-progress__error { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-job-progress__actions { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); }
.ui-job-progress[data-variant="inline"] .ui-job-progress__actions { margin-inline-start: auto; }
</style>
