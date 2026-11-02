---
name: Showing live data
tier: pattern
intent: [live updates, websocket, real-time, subscription, stale data, presence, loading and error states]
uses: [SearchTable, StatusTile, JobProgress, ConnectionBanner, Skeleton, Banner, EmptyState]
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
