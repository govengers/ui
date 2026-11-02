---
name: EmptyState
tier: primitive
intent: [empty state, no results, empty list, not found, nothing here yet, zero state]
uses: [Icon]
livewire: false
status: ready
laws: [cognitive-load, paradox-of-the-active-user]
---

# EmptyState

The centred message where a list has nothing to show, a filter matches nothing or a thing was not
found: an icon, a title, an optional description and an optional action.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `EmptyState.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `EmptyState.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | `ui.noResults` | |
| `description` | `string` | none | one or two sentences: why it is empty and what to do |
| `icon` | `IconName` | `search` | `users`, `file`, `folder`, `bell` ... for an empty list of that thing |

## Slots

| Slot | Content |
|------|---------|
| default | replaces `description` (text with a link) |
| `action` | one Button: create the first one, clear the filters |

## Agent

The title is plain text, so the agent reads "No results" from the accessibility tree like any
other text. The action Button carries `data-action` when it mutates (D23); "clear filters" does
not.

## Gotchas

- Distinguish the two cases in the words: a filtered list says "No results" and offers clearing
  the filters; a list that is empty says "No customers yet" and offers creating the first.
- Not for errors. A failed load shows the error and a retry, never an empty state (one failure
  and one retry per screen).
- The title is a `p`, not a heading: an empty state sits inside a region that has its heading.
