---
name: WhatsNew
tier: block
intent: [whats new, release notes, changelog dialog, announcement, new version, onboarding notice, show changes once]
uses: [Button, Dialog, changelog]
livewire: false
status: ready
laws: [jakobs-law, paradox-of-the-active-user, peak-end-rule]
---

# WhatsNew

The release notes dialog of the running minor line, once per user (D56). On mount it reads the
line the user saw last, asks `changelog`'s `decideWhatsNew`, stores a first visit silently and
opens only for a newer minor line with features; it stores the line when it closes, however it
closes (Got it, X, Escape, backdrop). The notes are the line's groups merged over its patches.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `WhatsNew.vue`, `whatsNew.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Dialog`, `changelog` | when their props show up here | what the composed pieces do; the file format and the decision |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `WhatsNew.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `version` | `string` | required | the running build, `import.meta.env.VITE_APP_VERSION`; a dev build (`development`) never opens |
| `releases` | `readonly ReleaseLine[]` | required | `parseChangelogs(files).lines` (changelog card) |
| `readSeen` | `() => string \| null \| undefined \| Promise<...>` | `localStorage[storageKey]` | the line the user saw last; a user setting makes it once per user, the default once per browser |
| `writeSeen` | `(line: string) => void \| Promise<void>` | `localStorage[storageKey]` | stores the line; a failure shows the notes once more |
| `storageKey` | `string` | `ui.whatsNew` | the default storage's key |
| `title` | `string` | `ui.whatsNewIn` with the line | the line's title is the description under it |
| `to` | `RouteLocationRaw` | none | the changelog page, shown as "All changes" |
| `limit` | `number` | `6` | items per group; the rest is counted (`ui.andMore`) |
| `force` | `boolean` | `false` | opens the running line (the newest on a dev build) whatever is stored: a "What's new" menu entry |
| `inline` | `boolean` | `false` | in the page flow through Dialog's `inline`; decides and stores nothing; docs and previews only |

`whatsNew.ts` exports the default storage: `readSeen(key?)`, `writeSeen(line, key?)` and
`resetWhatsNew(key?)`, which makes the next mount a first visit (silent).

## Slots

| Slot | Props | Content |
|------|-------|---------|
| default | `{ line, groups }` | replaces the rendered notes (intro, one `h3` and list per group) |
| `actions` | `{ close }` | the footer buttons; default "All changes" (with `to`) and a primary `ui.gotIt` |

## Events

| Event | Payload | When |
|-------|---------|------|
| `close` | none | the dialog closed and the line was handed to `writeSeen` |

## Per user

```ts
// The seen line lives in a user setting the app reads over livewire.
const readSeen = async () => (await pair.value.client.read(reads.mySettings, {})).whatsNewSeen
const writeSeen = (line: string) => pair.value.connection.call(calls.updateMySettings, {}, { whatsNewSeen: line })
```
```vue
<WhatsNew :version="version" :releases="releases" :read-seen="readSeen" :write-seen="writeSeen" :to="{ name: 'changelog' }" />
```

## Agent

A dialog named by its title. It mutates nothing on the page, so no `data-action`. A drive plan
meets it on the first load after a new minor line: close it with Got it (Escape works too).

## Messages

`ui.whatsNewIn`, `ui.groupFeatures`, `ui.groupFixes`, `ui.groupChanges`, `ui.groupSecurity`,
`ui.andMore`, `ui.allChanges`, `ui.gotIt`, `ui.close` (through Dialog).

## Gotchas

- Mount it once, in the shell, after login: it decides on mount, so mounting it on a page shows
  it there, and before login there is no user to remember it for.
- Only the running line is shown. A user who skipped 2.3 and opens 2.4 sees 2.4; the "All
  changes" link covers the rest.
- A patch never opens it, by design: cut an announcement as a minor with a Features bullet.
- A failed or blocked read counts as unknown and stays silent; it never opens on every load.
