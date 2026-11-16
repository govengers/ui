// JobProgress mounted (D69): Cancel and Retry call the jobs mutations; a list row's result comes
// from the item read.
import { afterEach, expect, test } from 'bun:test'
import { defineComponent, h, ref, type Component } from 'vue'
import { useLive } from '../../../demo/src/api/vue'
import { calls, live, type Job } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import JobProgress from './JobProgress.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

const button = (action: string) => view?.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`) ?? null
const resultRoute = () => '/files'

test('a list row that succeeded reads its result from the item and offers it', async () => {
  const row: Job = { ...{ id: 'job-1', queue: 'default', kind: 'export', status: 'succeeded', attempt: 1, maximumAttempts: 10, progress: 100, progressMessage: '' },
    result: null, error: '', errorClass: null, cancelRequested: false, createdAt: '2026-11-01T00:00:00Z', finishedAt: '2026-11-01T00:00:00Z' }
  view = mount(JobProgress as Component, () => ({ job: row, target: live['jobs.item'], resultRoute }))
  expect(button('openResult')).toBeNull()
  await settle()
  expect(button('openResult')).not.toBeNull()
})

test('without the item read a list row offers no result', async () => {
  view = mount(JobProgress as Component, () => ({ job: { id: 'job-1', kind: 'export', status: 'succeeded', progress: 100, result: null }, resultRoute }))
  await settle()
  expect(button('openResult')).toBeNull()
})

test('Retry runs a dead job again; Cancel then stops it; done fires for each run', async () => {
  const done: string[] = []
  view = mount(JobProgress as Component, () => ({ target: live['jobs.item'], id: 'job-2', cancel: calls.cancelJob, retry: calls.retryJob, onDone: (job: Job) => done.push(job.status) }))
  await settle()
  expect(view.root.textContent).toContain('Running it again fails the same way')
  expect(button('cancelJob')).toBeNull()
  button('retryJob')?.click()
  await settle()
  expect(['queued', 'running']).toContain(view.engine.store.tables.jobs.find((job) => job.id === 'job-2')?.status ?? '')
  expect(button('retryJob')).toBeNull()
  button('cancelJob')?.click()
  await settle(8)
  expect(view.engine.store.tables.jobs.find((job) => job.id === 'job-2')?.status).toBe('cancelled')
  expect(view.root.textContent).toContain('Cancelled')
  expect(button('cancelJob')).toBeNull()
  expect(done).toEqual(['failed', 'cancelled'])
})

test('a refused call says so beside the job', async () => {
  view = mount(JobProgress as Component, () => ({ target: live['jobs.item'], id: 'job-3', cancel: calls.cancelJob }))
  await settle()
  view.engine.store.update('jobs', 'job-3', { status: 'succeeded', progress: 100 })
  button('cancelJob')?.click()
  await settle()
  expect(view.root.querySelector('[role="alert"]')?.textContent).toContain('The job changed meanwhile')
})

test('a refusal belongs to its job: another id shows none', async () => {
  const id = ref('job-3')
  view = mount(JobProgress as Component, () => ({ target: live['jobs.item'], id: id.value, cancel: calls.cancelJob }))
  await settle()
  view.engine.store.update('jobs', 'job-3', { status: 'succeeded', progress: 100 })
  button('cancelJob')?.click()
  await settle()
  expect(view.root.querySelector('[role="alert"]')).not.toBeNull()
  id.value = 'job-1'
  await settle()
  expect(view.root.textContent).toContain('export')
  expect(view.root.querySelector('[role="alert"]')).toBeNull()
})

test('a list row whose result read lost its socket reads it again once the socket is back', async () => {
  const row = ref<Job | undefined>()
  // The page's own live read keeps the connection needed, as live.jobs does under a list.
  const Page = defineComponent(() => {
    useLive(live['jobs.item'], { id: 'job-1' })
    return () => (row.value === undefined ? null : h(JobProgress, { job: row.value, target: live['jobs.item'], resultRoute }))
  })
  view = mount(Page as Component)
  await settle()
  const succeeded = view.engine.store.tables.jobs.find((job) => job.id === 'job-1')
  if (succeeded === undefined) throw new Error('job-1 is seeded')
  row.value = { ...succeeded, status: 'succeeded', result: null }
  await settle(0)
  await Promise.resolve()
  view.engine.store.dropSockets() // the item read is on its way and is lost with the socket
  await settle(8)
  expect(button('openResult')).not.toBeNull()
})
