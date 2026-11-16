<script setup lang="ts">
import { ref } from 'vue'
import { useLiveConnection, useLiveList } from '@/api/vue'
import { calls, live } from '@/fake/api'
import JobProgress from './JobProgress.vue'
import type { JobLike } from './job'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'

const connection = useLiveConnection()
const started = ref<string[]>([])
const starting = ref(false)
const finished = ref<string[]>([])

async function start() {
  starting.value = true
  try {
    const job = await connection.value.call(calls.startJob, {}, { kind: 'report' })
    started.value = [job.id, ...started.value]
  } finally {
    starting.value = false
  }
}

const { items: jobs } = useLiveList(live.jobs, { limit: 6 })

const samples: JobLike[] = [
  { id: 'sample-queued', kind: 'export', status: 'queued', progress: null },
  { id: 'sample-claimed', kind: 'import', status: 'running', progress: null },
  { id: 'sample-running', kind: 'import', status: 'running', progress: 45, progressMessage: 'row 214 of 476' },
  { id: 'sample-cancelling', kind: 'export', status: 'running', progress: 70, cancelRequested: true },
  { id: 'sample-succeeded', kind: 'report', status: 'succeeded', progress: 100, result: { fileId: 'fil-3' } },
  { id: 'sample-failed', kind: 'import', status: 'failed', progress: 60, error: 'row 214: the customer cus-981 does not exist', errorClass: 'permanent' },
  { id: 'sample-lost', kind: 'export', status: 'failed', progress: null, error: '', errorClass: 'lease_expired' },
  { id: 'sample-cancelled', kind: 'export', status: 'cancelled', progress: null },
]

/** The demo's result is `{ fileId }`: open the files page. */
const resultRoute = (result: unknown) => (typeof result === 'object' && result !== null && 'fileId' in result ? '/files' : undefined)
</script>

<template>
  <section>
    <h2>Start a job, follow it live</h2>
    <div class="row">
      <Button variant="primary" data-action="startJob" :loading="starting" @click="start">
        <template #icon><Icon name="play" /></template>
        Start report
      </Button>
      <span class="muted">done: {{ finished.length === 0 ? 'none yet' : finished.join(', ') }}</span>
    </div>
    <div class="stack">
      <JobProgress
        v-for="id in started"
        :key="id"
        :target="live['jobs.item']"
        :id="id"
        title="Monthly revenue report"
        :cancel="calls.cancelJob"
        :retry="calls.retryJob"
        :result-route="resultRoute"
        @done="(job) => finished.push(`${job.id.slice(-4)} ${job.status}`)"
      />
    </div>
  </section>

  <section>
    <h2>Every status (a job the page already holds)</h2>
    <div class="grid">
      <JobProgress v-for="job in samples" :key="job.id" :job="job" :result-route="resultRoute" />
    </div>
  </section>

  <section>
    <h2>Inline: rows of the live jobs list, Cancel and Retry, the result read from the item</h2>
    <ul class="rows">
      <li v-for="job in jobs" :key="job.id">
        <JobProgress :job="job" variant="inline" :target="live['jobs.item']" :cancel="calls.cancelJob" :retry="calls.retryJob" :result-route="resultRoute" />
      </li>
    </ul>
  </section>

  <section>
    <h2>Unknown job: the read's refusal with a retry</h2>
    <JobProgress :target="live['jobs.item']" id="job-404" />
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); margin-bottom: var(--ui-space-4); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.stack { display: flex; flex-direction: column; gap: var(--ui-space-3); max-width: 36rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: var(--ui-space-4); }
.rows { margin: 0; padding: 0; list-style: none; max-width: 48rem; }
.rows > li + li { border-top: var(--ui-border-width) solid var(--ui-divider); }
</style>
