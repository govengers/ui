---
name: CommandPalette
tier: block
intent: [command palette, cmd k, ctrl k, quick search, jump to, global search, spotlight search, quick actions, run a command, recent items]
uses: [Icon, agent]
livewire: true
status: ready
laws: [hicks-law, jakobs-law, paradox-of-the-active-user, serial-position-effect]
---

# CommandPalette

The Cmd/Ctrl+K dialog: empty, it offers the recent picks and the quick actions of the agent
action registry; typing searches every group (one livewire list query each, the newest answer
wins) and filters the actions, listed under the results. Arrows, Home, End, Enter and Escape run it; the result list is a
listbox the input points into with `aria-activedescendant`. The typed words are marked in every
label; a text nothing matches stays in the input with a hint what to try.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `CommandPalette.vue`, `palette.ts` | to use it: skim; to change it: read | the dialog and its model |
| the cards of `Icon`, `agent` | when their props show up here | icons, the action registry |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `CommandPalette.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `groups` | `PaletteGroup[]` | required | built with `searchGroup` (below); shown in this order; while a text is typed above the actions |
| `v-model:open` | `boolean` | `false` | the hotkey and Escape drive it too |
| `hotkey` | `string` | `'k'` | Cmd or Ctrl plus this key toggles the palette; `''` for none |
| `storageKey` | `string` | `'ui.palette.recent'` | localStorage key prefix of the last 6 picks; the pair's identity is appended (`ui.palette.recent:<identity>`), so a pick never shows to the next account on the browser; removed when the identity's connection ends; `''` keeps none |
| `placeholder` | `string \| undefined` | `ui.paletteSearch` | |
| `inline` | `boolean` | `false` | open in the page flow without `showModal()`; docs and previews only |

`highlight(label, query)` (in `palette.ts`) splits a label into `{ text, match }` runs, `match`
on every case-insensitive occurrence of each typed word; the palette renders a match as
`<mark class="ui-command-palette__match">` (heavier weight, no background, the option's colour).

`searchGroup({ key, label, target, result, where?, limit? })` (in `palette.ts`) turns a list
read whose resource has a searchable field into a group: each search is
`connection.query(target, { filter: { where, search: text }, limit })` (default 5 results) and
`result(item)` gives `{ id, label, hint? }`.

## Events

| Event | Payload | When |
|-------|---------|------|
| `select` | `{ group, id, label, hint? }` | a search result or a recent pick was chosen; the page navigates |

## With livewire

Searches go over the provided pair's connection as one-shot queries, not subscriptions: 150 ms
after the last key, all groups at once; a newer text aborts the older reads and only the newest
answers count. A group that fails says "Search failed" in its heading and the others still show.

Quick actions are `boundActions()` from `ui/agent/registry.ts` without params: what the open page
bound with `useAgentAction`. Choosing one closes the palette and calls its `run({})`; actions
that need params belong to the agent, not to the palette.

## Agent

The input is `name="palette"`; options of actions carry `data-action` = the action name; search
results are `role="option"` with their label as text.

## Gotchas

- Nothing is active on an empty query (Enter does nothing until an arrow key); typing or pasting
  makes the first option active once its group and every group above it answered, and the
  results come before the actions, so Enter opens the top hit. Until then Enter does nothing
  (unless an arrow key chose an option): an answer above would push the top down. A slower group
  below does not hold it back. The active option
  is kept by id, so an answer never moves the highlight. A text no result matches leaves the
  matching actions first; a mutating action (`mutating: true`) is never made active by itself,
  so Enter runs it only after an arrow key or the pointer chose it.
- The end of the connection (logout, 4401) or a new pair (account switch) clears the text and the
  results and aborts the searches; the end also removes that identity's recent picks from storage
  (as the runtime removes its snapshots, livewire D66), a new pair loads its own. A pair without an
  identity, or `storageKey` `''`, keeps none, not even in memory. The palette removes them only
  while it is mounted: mount it in the shell. A storage that is blocked or full keeps the picks
  for the page only, until the end or a new identity.
- One keydown handler on the dialog; it stops the keys it handles, so page hotkeys do not fire
  under it. Composition (IME) keys are ignored.
- Home and End move the active option only while the input is empty; otherwise they move the
  caret.
- Mount it once, in the shell: two palettes would both answer the hotkey.
- A shortcut alone is invisible: put a visible opener in the shell's `actions`, a ghost `Button`
  with the `search` icon and `ui.paletteOpen`, bound to `v-model:open`, with
  `aria-keyshortcuts="Control+K Meta+K"`, `label` set to the same word, and a `<kbd>` hint
  (`Ctrl K` with `ui.keyCtrl`, the command sign on Apple platforms) hidden under `(pointer: coarse)`. On a phone
  (under 48rem) the word and the hint leave the default slot (`<template v-if="!phone" #default>`
  on a `matchMedia` ref, not CSS), so Button sees an icon-only button that `label` names; the
  starter does the same for its other top-bar buttons, so the bar keeps room for its title. The
  starter's `App.vue` has it.
- Labels and hints are text, never HTML: a result label holding markup shows the markup as
  characters. Under "No results" the palette says `ui.paletteNoResultsHint`.
