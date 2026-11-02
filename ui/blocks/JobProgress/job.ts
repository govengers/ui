// JobProgress's job shape (D29) and when a job counts as done.

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

/** What JobProgress reads of a job; a project's job row (govengers/jobs) carries at least these fields. */
export interface JobLike {
  id: string
  kind: string
  status: JobStatus
  /** 0 to 100. */
  progress: number
  /** The route the result is shown on once the job succeeded (D29). */
  resultRoute?: string | null | undefined
  /** Why the job failed, shown under a failed job. */
  error?: string | null | undefined
}

/** Whether the job finished and was not reported yet: `done` fires once per job id. */
export function finishedNow(job: JobLike | undefined, reported: string | undefined): job is JobLike {
  return job !== undefined && (job.status === 'succeeded' || job.status === 'failed') && job.id !== reported
}
