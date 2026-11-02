<script setup lang="ts">
// JobProgress: the background-mode block (D29). Follows one job live (`target` + `id`), or shows
// a job the page already holds (`job`, a row of a live jobs list): its status, its progress, why
// it failed, and the way to its result. Emits `done` once when the job finished.
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LiveTarget } from '@/api/runtime'
import { useLive } from '@/api/vue'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import { formatPercent } from '../../format'
import { finishedNow, type JobLike, type JobStatus } from './job'

const props = withDefaults(defineProps<{
  /** The job item read, e.g. live['jobs.item']. */
  target?: LiveTarget<{ id: string }, JobLike> | undefined
  id?: string | undefined
  /** A job the page already reads: shown as it is, no subscription. Wins over target. */
  job?: JobLike | undefined
  /** What the job does, in words; the job's kind by default. */
  title?: string | undefined
  resultLabel?: string | undefined
  /** `inline`: one compact row, for a list. */
  variant?: 'default' | 'inline'
}>(), { variant: 'default' })

const emit = defineEmits<{ done: [job: JobLike] }>()
const { t, locale } = useI18n()

// ponytail: the source is fixed at mount; a page that switches between `job` and `target` keys the block.
const live = props.job === undefined && props.target !== undefined ? useLive(props.target, () => ({ id: props.id ?? '' })) : undefined
const current = computed(() => props.job ?? live?.data.value)
const active = computed(() => current.value?.status === 'queued' || current.value?.status === 'running')

const badges: Record<JobStatus, { variant: 'neutral' | 'accent' | 'success' | 'danger'; label: string }> = {
  queued: { variant: 'neutral', label: 'ui.queued' },
  running: { variant: 'accent', label: 'ui.running' },
  succeeded: { variant: 'success', label: 'ui.succeeded' },
  failed: { variant: 'danger', label: 'ui.failed' },
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
        <Badge :variant="badges[current.status].variant" dot>{{ t(badges[current.status].label) }}</Badge>
      </div>
      <div v-if="active" class="ui-job-progress__bar">
        <progress
          class="ui-job-progress__progress"
          max="100"
          :value="current.status === 'running' ? current.progress : undefined"
          :aria-label="title ?? current.kind"
        />
        <span v-if="current.status === 'running'" class="ui-job-progress__percent">{{ formatPercent(current.progress / 100, locale) }}</span>
      </div>
      <p v-if="current.status === 'failed' && current.error" class="ui-job-progress__error">{{ current.error }}</p>
      <div v-if="current.status === 'succeeded' && current.resultRoute" class="ui-job-progress__result">
        <Button variant="primary" :size="variant === 'inline' ? 'sm' : 'md'" :to="current.resultRoute" data-action="openResult">
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

.ui-job-progress__error { font-size: var(--ui-text-sm); color: var(--ui-on-danger-soft); }
.ui-job-progress[data-variant="inline"] .ui-job-progress__error { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-job-progress__result { display: flex; }
.ui-job-progress[data-variant="inline"] .ui-job-progress__result { margin-inline-start: auto; }
</style>
