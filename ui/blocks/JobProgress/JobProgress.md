---
name: JobProgress
tier: block
intent: [job progress, background job, long running task, export progress, import status, progress bar, async result]
uses: [Badge, Banner, Button, Skeleton, format]
livewire: true
status: ready
laws: [doherty-threshold, goal-gradient-effect, peak-end-rule, teslers-law, zeigarnik-effect]
---

# JobProgress

One background job (D29): what it does, its status badge, a progress bar while it runs, why it
failed, and an "Open result" button once it succeeded with a result route. Follows the job live
by id, or shows a job the page already reads; a compact `inline` variant fits a list row.

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
| `target` | `LiveTarget<{ id }, JobLike>` | none | the job item read, e.g. `live['jobs.item']` |
| `id` | `string` | none | the job to follow |
| `job` | `JobLike` | none | a job the page already holds (a row of `live.jobs`): shown as is, no subscription; wins over `target` |
| `title` | `string` | the job's `kind` | what the job does, in words |
| `resultLabel` | `string` | `ui.openResult` | the result button |
| `variant` | `default \| inline` | `default` | `default` a bordered panel, `inline` one row without a frame |

`JobLike` (`job.ts`): `{ id, kind, status: queued | running | succeeded | failed, progress (0-100),
resultRoute?, error? }`. A project's job row may carry more.

## Events

| Event | Payload | When |
|-------|---------|------|
| `done` | `JobLike` | the job is `succeeded` or `failed`: once per job id, also when the first push already shows it finished |

## With livewire

Pass the descriptor and the id the start call answered:

```ts
const job = await connection.value.call(calls.startJob, {}, { kind: 'export' })
```
```vue
<JobProgress :target="live['jobs.item']" :id="job.id" title="Customer export" @done="onDone" />
```

For a list, read `live.jobs` once with `useLiveList` and give each row `:job="row" variant="inline"`:
one subscription for the list instead of one per row.

## Agent

"Open result" is a link (`to` = the job's `resultRoute`) with `data-action="openResult"`. The bar
is a native `<progress>` (role `progressbar`, its value while running, indeterminate while
queued), named by the title. Status changes are announced (`aria-live="polite"` on the title
row), progress steps are not.

## Messages

`ui.queued`, `ui.running`, `ui.succeeded`, `ui.failed`, `ui.openResult`, `ui.retry`.

## Gotchas

- The source is fixed at mount: switching between `job` and `target`, or to another `target`,
  needs a `:key`. A new `id` resubscribes by itself.
- A failed read (an unknown id, a forbidden job) shows its message with Retry instead of the
  job; a job that failed shows its `error`, or only the badge when it has none.
- `done` fires for finished rows of a list too; listen on the one you started.
