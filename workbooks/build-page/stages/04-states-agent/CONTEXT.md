# Stage 04: states and agent surface

## Input
The composed page; `patterns/showing-live-data.md`; `ui/agent/agent.md`.

## Process
1. States: loading is `!error && loading` (skeleton); `error` is a `Banner` with the code-aware
   sentence and Retry (`error.code`, never an HTTP status); empty is an `EmptyState` with the
   next step; `stale` keeps the data under the quiet notice. Several subscriptions: one failure,
   one retry. Own writes: no local upsert.
2. Agent surface (D23): every mutating `Button` carries `data-action="<call name>"` (submit and
   danger buttons are what `ui-lint` checks), every form field `name`, the page root `data-page`.
3. `actions.ts` in the page folder exports the page's `AgentAction[]` (name = call name,
   description, params, page, mutating); the page binds each with `useAgentAction(action, run)`.
   A read-only page exports an empty array with a comment.
4. Drive-mode pauses: an action that may run unattended is listed in `DESIGN.md` rule 6; the
   default is a pause on every mutating submit (D27, D52).

## Output
```
states: loading, error, empty, stale: <ok|which missing>
agent: data-page <value>, actions <names>, fields named: <yes|no>
```

## Completion
Proceed to `05-verify`.
