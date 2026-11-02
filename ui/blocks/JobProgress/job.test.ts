import { describe, expect, test } from 'bun:test'
import { finishedNow, type JobLike } from './job'

const job = (status: JobLike['status'], id = 'job-1'): JobLike => ({ id, kind: 'export', status, progress: 0 })

describe('job', () => {
  test('finishedNow: succeeded and failed finish, queued and running do not', () => {
    expect(finishedNow(job('succeeded'), undefined)).toBe(true)
    expect(finishedNow(job('failed'), undefined)).toBe(true)
    expect(finishedNow(job('queued'), undefined)).toBe(false)
    expect(finishedNow(job('running'), undefined)).toBe(false)
    expect(finishedNow(undefined, undefined)).toBe(false)
  })

  test('finishedNow: once per job id, again for the next job', () => {
    expect(finishedNow(job('succeeded'), 'job-1')).toBe(false)
    expect(finishedNow(job('failed', 'job-2'), 'job-1')).toBe(true)
  })
})
