---
name: Showing live data
tier: pattern
intent: [live updates, websocket, real-time, subscription, stale data, presence, loading and error states, which loader, optimistic update]
uses: [SearchTable, StatusTile, JobProgress, ConnectionBanner, Skeleton, Banner, EmptyState, Button, FileUpload]
livewire: true
status: ready
---

# Showing live data

Everything read through livewire is live: `useLive` for one record or view, `useLiveList` for a
list. The page never polls and never upserts its own writes; the push renders them.

## The four states, every time

| State | Show |
|-------|------|
| `!error && loading` | `Skeleton` in the shape of the content |
| `error` | `Banner` danger with the message and Retry; branch on `error.code` (`not_found`, `forbidden`), never on an HTTP status, which live errors do not carry |
| `data` empty | `EmptyState` with the next step (create, clear filters) |
| `stale` | the last data stays on screen under a quiet notice (`ui.stale`) |

A screen with several subscriptions exposes one failure and one retry, not one per block.

## Which loader

| Wait | Show |
|------|------|
| first load of a known shape | `Skeleton` in that shape, after `--ui-loading-delay`, so a fast answer flashes nothing |
| a call from a button | that Button's `loading` |
| countable work | `FileUpload` or `JobProgress`: indeterminate until the first report, never a made-up value |
| a refetch (filter, sort, page) | the old rows stay until the new ones arrive |

Past about 1 s show that work runs, past 10 s a percent-done indicator and a way to stop (NN/g,
"Response Times: The 3 Important Limits"). A change shows before the answer only if a refusal
reverts it and the user is told (the runtime's `optimistic` option; Board announces it, pages show
`move-error`). Anything irreversible (a payment, a deletion) keeps its Button `loading` and reports
success only after the answer; the runtime hides a removed row at once and returns it on an error.

## Lists

`useLiveList` holds filter, sort and page. Cursor mode for histories (chat, logs): tile the
history with live pages, each page's `before` cursor following the page above; never mix REST
pages with a live window.

## Clock-dependent values

A view that derives state from now (age, "stalled for 10 min") does not change on a row write.
Keep the old clock and call `retry()` once a minute; data stays on screen while it resubscribes.

## Identity

One `LivePair` per signed-in identity. Login, logout and switch end the pair before the request
that changes the cookie, then build the next one (livewire D66). The shell's
`ConnectionBanner` reads `useLiveStatus()` for the rest.
