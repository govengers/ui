// JobProgress's job shape: the view govengers/jobs answers (postgresadapter.View, J55), and what
// the block shows of it: when a job counts as done, which actions it offers, its progress.

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

/** What kind of error the last failed attempt had (govengers/jobs ErrorClass). */
export type JobErrorClass = 'transient' | 'permanent' | 'lease_expired'

/** What JobProgress reads of a job; govengers/jobs' view carries these fields and more. */
export interface JobLike {
  id: string
  kind: string
  status: JobStatus
  /** Percent, 0 to 100; null while the attempt reported none, 100 once succeeded. */
  progress: number | null
  /** What the handler said with its last report, "row 214 of 500". */
  progressMessage?: string | undefined
  /** What the handler left with SetResult. Null in the items of the list read: read the item. */
  result?: unknown
  /** The last failed attempt's error, "" without one; kept when a retry succeeded. */
  error?: string | null | undefined
  errorClass?: JobErrorClass | null | undefined
  /** A cancel reached the running job; it stops at its next heartbeat. */
  cancelRequested?: boolean | undefined
}

/** A job that ended: succeeded, failed (dead) or cancelled. */
export const finished = (job: JobLike): boolean => job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled'

/** Whether the job finished and was not reported yet: `done` fires once per job id. */
export function finishedNow(job: JobLike | undefined, reported: string | undefined): job is JobLike {
  return job !== undefined && finished(job) && job.id !== reported
}

/** The actions the job allows: cancel while queued or running and no cancel is on its way, retry once dead. */
export function actionsOf(job: JobLike): { cancel: boolean; retry: boolean } {
  return {
    cancel: (job.status === 'queued' || job.status === 'running') && job.cancelRequested !== true,
    retry: job.status === 'failed',
  }
}

/** The bar's value: the percent while running and reported, else none (an indeterminate bar). */
export function barValue(job: JobLike): number | undefined {
  return job.status === 'running' && typeof job.progress === 'number' ? Math.min(100, Math.max(0, job.progress)) : undefined
}

/** The ui.* key that says what a failed job's error class means; none for a transient error. */
export function errorClassKey(job: JobLike): 'ui.jobPermanent' | 'ui.jobLeaseExpired' | undefined {
  if (job.status !== 'failed') return undefined
  if (job.errorClass === 'permanent') return 'ui.jobPermanent'
  if (job.errorClass === 'lease_expired') return 'ui.jobLeaseExpired'
  return undefined
}
