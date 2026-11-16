import { describe, expect, test } from 'bun:test'
import { actionsOf, barValue, errorClassKey, finishedNow, type JobLike } from './job'

const job = (status: JobLike['status'], patch: Partial<JobLike> = {}): JobLike => ({ id: 'job-1', kind: 'export', status, progress: null, ...patch })

describe('job', () => {
  test('finishedNow: succeeded, failed and cancelled finish, queued and running do not', () => {
    for (const status of ['succeeded', 'failed', 'cancelled'] as const) expect(finishedNow(job(status), undefined)).toBe(true)
    expect(finishedNow(job('queued'), undefined)).toBe(false)
    expect(finishedNow(job('running'), undefined)).toBe(false)
    expect(finishedNow(undefined, undefined)).toBe(false)
  })

  test('finishedNow: once per job id, again for the next job', () => {
    expect(finishedNow(job('succeeded'), 'job-1')).toBe(false)
    expect(finishedNow(job('failed', { id: 'job-2' }), 'job-1')).toBe(true)
  })

  test('actionsOf: cancel while queued or running without a cancel on its way, retry only when dead', () => {
    expect(actionsOf(job('queued'))).toEqual({ cancel: true, retry: false })
    expect(actionsOf(job('running'))).toEqual({ cancel: true, retry: false })
    expect(actionsOf(job('running', { cancelRequested: true }))).toEqual({ cancel: false, retry: false })
    expect(actionsOf(job('failed'))).toEqual({ cancel: false, retry: true })
    expect(actionsOf(job('succeeded'))).toEqual({ cancel: false, retry: false })
    expect(actionsOf(job('cancelled'))).toEqual({ cancel: false, retry: false })
  })

  test('barValue: the reported percent while running, clamped; none before a report or while queued', () => {
    expect(barValue(job('running', { progress: 45.5 }))).toBe(45.5)
    expect(barValue(job('running', { progress: 140 }))).toBe(100)
    expect(barValue(job('running'))).toBeUndefined()
    expect(barValue(job('queued', { progress: 30 }))).toBeUndefined()
  })

  test('errorClassKey: a sentence for permanent and lease_expired failures only', () => {
    expect(errorClassKey(job('failed', { errorClass: 'permanent' }))).toBe('ui.jobPermanent')
    expect(errorClassKey(job('failed', { errorClass: 'lease_expired' }))).toBe('ui.jobLeaseExpired')
    expect(errorClassKey(job('failed', { errorClass: 'transient' }))).toBeUndefined()
    expect(errorClassKey(job('failed', { errorClass: null }))).toBeUndefined()
    expect(errorClassKey(job('succeeded', { errorClass: 'permanent' }))).toBeUndefined()
  })
})
