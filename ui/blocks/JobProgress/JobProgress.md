---
name: JobProgress
tier: block
intent: [job progress, background job, long running task, export progress, import status, progress bar, async result, cancel job, retry job]
uses: [Badge, Banner, Button, Skeleton, format]
livewire: true
status: ready
laws: [doherty-threshold, goal-gradient-effect, peak-end-rule, teslers-law, zeigarnik-effect]
---

# JobProgress

One background job (D29) as govengers/jobs answers it (its `postgresadapter.View`): what it does,
its status badge, a progress bar while it runs (indeterminate until the job reports), the
handler's last progress message, why it failed and what the failure's class means, Cancel and
Retry when the page passes the jobs mutations, and "Open result" once it succeeded with a result
the page can route to. Follows the job live by id, or shows a job the page already reads; a
compact `inline` variant fits a list row.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `JobProgress.vue`, `job.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Badge`, `Banner`, `Button`, `Skeleton`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `JobProgress.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `target` | `LiveTarget<{ id }, JobLike>` | none | the job item read, `live['jobs.item']`; with `job` it is read once for a succeeded job's result |
| `id` | `string` | none | the job to follow |
| `job` | `JobLike` | none | a job the page already holds (a row of `live.jobs`): shown as is, no subscription; wins over `target` |
| `title` | `string` | the job's `kind` | what the job does, in words |
| `resultRoute` | `(result, job) => RouteLocationRaw \| undefined` | none | where a succeeded job's result is shown; `undefined` (or no result) hides "Open result" |
| `resultLabel` | `string` | `ui.openResult` | the result button |
| `cancel` | `MutationTarget<{ id }, undefined, JobLike>` | none | `calls.cancelJob`; shows Cancel while queued or running |
| `retry` | `MutationTarget<{ id }, undefined, JobLike>` | none | `calls.retryJob`; shows Retry for a failed (dead) job |
| `variant` | `default \| inline` | `default` | `default` a bordered panel, `inline` one row without a frame |

`JobLike` (`job.ts`) is the part of govengers/jobs' view the block reads: `{ id, kind, status:
queued | running | succeeded | failed | cancelled, progress: number | null (percent, null until
reported), progressMessage?, result?, error?, errorClass?: transient | permanent | lease_expired |
null, cancelRequested? }`. The view carries more (queue, attempt, times); pass it as it is.

## Slots

| Slot | Props | Content |
|------|-------|---------|
| `result` | `{ result, job }` | under a succeeded job with a result: a summary ("1,240 rows"), a download link |

## Events

| Event | Payload | When |
|-------|---------|------|
| `done` | `JobLike` | the job is `succeeded`, `failed` or `cancelled`: once per job id, also when the first push already shows it finished |

## With livewire

govengers/jobs' `livewireadapter.Declarations` declares the `jobs` resource (`live.jobs`,
`live['jobs.item']`) and, with a `Write` check, `cancelJob` and `retryJob` (`POST
/jobs/{id}/cancel`, `/retry`, answering the view with an `upserts` effect on `jobs`). Pass the
descriptors and the id the start call answered:

```ts
const job = await connection.value.call(calls.startJob, {}, { kind: 'export' })
const resultRoute = (result: unknown) => ({ name: 'files.detail', params: { id: (result as { fileId: string }).fileId } })
```
```vue
<JobProgress :target="live['jobs.item']" :id="job.id" title="Customer export"
  :cancel="calls.cancelJob" :retry="calls.retryJob" :result-route="resultRoute" @done="onDone" />
```

For a list, read `live.jobs` once with `useLiveList` and give each row `:job="row"
variant="inline"`: one subscription for the list instead of one per row. The list leaves the
result out (`null` in its items), so give the rows `:target="live['jobs.item']"` too when they
offer the result: a row that succeeded without a result reads its item once
(`connection.query`), a finished job does not change. A `job` that carries its result uses it.

Cancel and Retry run over the socket; the answer upserts the job into every live read of `jobs`,
so the badge changes at once. A running job's cancel is a request (`cancelRequested`, badge
"Cancelling") that its worker honours on the next heartbeat. A refusal shows under the job: 409
(the job finished or was retried meanwhile) as `ui.jobChanged`, anything else with its message.

## Agent

"Open result" is a link (`to` = `resultRoute(result, job)`) with `data-action="openResult"`.
Cancel and Retry carry `data-action` = the mutation's name (`cancelJob`, `retryJob`). The bar is a
native `<progress>` (role `progressbar`, its value while running and reported, indeterminate
otherwise), named by the title. Status changes are announced (`aria-live="polite"` on the title
row), progress steps are not.

## Messages

`ui.queued`, `ui.running`, `ui.succeeded`, `ui.failed`, `ui.cancelled`, `ui.cancelling`,
`ui.cancelJob`, `ui.retryJob`, `ui.jobPermanent`, `ui.jobLeaseExpired`, `ui.jobChanged`,
`ui.openResult`, `ui.retry`.

## Gotchas

- The source is fixed at mount: switching between `job` and `target`, or to another `target`,
  needs a `:key`. A new `id` resubscribes by itself.
- A failed read (an unknown id, a forbidden job) shows its message with Retry instead of the
  job; a job that failed shows its `error`, or only the badge when it has none.
- `done` fires for finished rows of a list too; listen on the one you started.
- The result is the handler's JSON (`jobs.SetResult`, at most 64 KiB): a reference and a summary.
  `resultRoute` reads it; the block never shows it raw. The retention deletes finished jobs (7
  days by default), and with them the result: an unreadable item shows no result.
- `progress` is `null` until the attempt's first report and again after a claim: the bar is
  indeterminate then, never 0 %. A failed job keeps the progress of its last attempt.
- Copies before D75 read `resultRoute` from the job row and `progress` as a number: a re-copy
  needs the page's `resultRoute` function instead.
