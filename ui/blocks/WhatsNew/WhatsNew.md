---
name: WhatsNew
tier: block
intent: [whats new, release notes, changelog dialog, announcement, new version, onboarding notice]
uses: [Button, Dialog]
livewire: false
status: ready
laws: []
---

# WhatsNew

The release notes dialog, shown once per version: it opens on mount while the version stored in
`localStorage` differs, and stores the version when it closes, however it closes (Got it, X,
Escape, backdrop).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `WhatsNew.vue`, `whatsNew.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Dialog` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `WhatsNew.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `version` | `string` | required | the app's version; put it in `title` to show it |
| `title` | `string` | `ui.whatsNew` | |
| `storageKey` | `string` | `ui.whatsNew` | the `localStorage` key |
| `force` | `boolean` | `false` | opens whatever is stored (a "What's new" menu entry) |
| `inline` | `boolean` | `false` | in the page flow through Dialog's `inline`; stores nothing; docs and previews only |

`whatsNew.ts` exports `resetWhatsNew(storageKey?)`, which forgets the version so the next mount
opens the notes again, and `unseen(version, storageKey?)`.

## Slots

| Slot | Props | Content |
|------|-------|---------|
| default | | the notes: `h3` headings and lists |
| `actions` | `{ close }` | the footer buttons; default a primary `ui.gotIt` |

## Events

| Event | Payload | When |
|-------|---------|------|
| `close` | none | the dialog closed and the version was stored |

## Agent

A dialog named by its title. It mutates nothing, so no `data-action`. A drive plan meets it on
the first load after an update: close it with Got it (Escape works too).

## Messages

`ui.whatsNew`, `ui.gotIt`, `ui.close` (through Dialog).

## Gotchas

- Mount it once, in the shell, after login: it opens on mount, so mounting it on a page shows
  it there.
- A missing or blocked `localStorage` counts as seen: the notes never open on every load.
- Notes are short. A long changelog is a page; link it from the notes.
