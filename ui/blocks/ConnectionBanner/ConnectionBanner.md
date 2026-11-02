---
name: ConnectionBanner
tier: block
intent: [connection banner, connection lost, offline notice, reconnecting notice, socket status, live status banner]
uses: [Banner, Button]
livewire: true
status: ready
---

# ConnectionBanner

The shell's connection notice (D34) over `useLiveStatus()`: a warning banner while the socket
reconnects, a danger banner with Retry once the connection ended, and nothing while it is open,
connecting for the first time or idle. Put it in `AppShell`'s banner slot.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `connection` | `MaybeRefOrGetter<LiveConnection> \| undefined` | the provided pair's | read once; the default follows a new pair |
| `reconnect` | `(() => void) \| undefined` | none | makes a new pair or reloads; shown as Retry on the ended notice |
| `force` | `LiveStatus \| undefined` | none | shows this status instead of the live one; docs and previews only |

## Slots

None.

## Events

None; Retry calls `reconnect`.

## With livewire

No descriptor: it reads the connection status, from the plugin's pair by default. Statuses:
`open` and `idle` show nothing; `connecting` shows nothing the first time and the warning once
the connection had been open (a going-away close reconnects as `connecting`); `reconnecting`
shows the warning `ui.reconnecting`; `ended` shows the danger notice `ui.offline`.

## Agent

The warning is `role="status"`, the danger notice `role="alert"`; Retry carries
`data-action="reconnect"`.

## Gotchas

- `idle` after having been open is not offline: the socket closed while no read needed it, and
  the next read connects again. Only `ended` (identity gone, `end()`) is offline for good.
- An ended connection never comes back: `reconnect` must make a new pair (`createLivePair`) and
  put it into the plugin's ref, or reload the page.
- Mount it once, in the shell; the lists' own stale notice covers the page.
