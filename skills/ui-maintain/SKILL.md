---
name: ui-maintain
description: Add or change a piece in the govengers/ui repository itself (component, block, page recipe, token, preset, message, pattern) following its conventions, then regenerate the index and screenshots and run the gates. Use inside the govengers/ui checkout on "add a component", "new block", "change a token", "add a preset", "ui-maintain".
---

# ui-maintain

How this repository grows without drifting (D10, D41 to D46). Run inside the govengers/ui
checkout.

## Adding a component, block or page recipe

1. Read `AGENTS.md` ("I want to add or change a component here"), `docs/design.md` D37 to D46,
   and the closest existing piece (`ui/Input/` for a control, `ui/Dialog/` for an overlay,
   `ui/blocks/SearchTable/` for a block, `pages/ListPage/` for a recipe). Check `INDEX.md`: if a
   piece answers the intent already, extend it instead.
2. Create the directory: `ui/<Name>/` (primitive, layout), `ui/blocks/<Name>/` (block),
   `pages/<Name>/` (recipe) with `<Name>.vue`, `<Name>.md`, `<Name>.demo.vue`.
   - `.vue`: `<script setup lang="ts">` with a two-line comment saying what it is, typed props
     with `withDefaults`, typed emits, named slots; root class `ui-<name>`, parts
     `ui-<name>__part`, variants `data-variant`, sizes `data-size`; `<style scoped>` with
     `var(--ui-*)` only; native element first; under about 200 lines or split.
   - `.md`: front matter `name`, `tier`, `intent` (words a user would say), `uses` (pieces it
     imports), `livewire`, `status`; body: one-paragraph summary, Props, Slots, Events, Agent,
     Gotchas; blocks add "With livewire" (which descriptor props it takes).
   - `.demo.vue`: `<section>` with an `<h2>` per state; overlays also render a static open
     example; blocks use `demo/src/fake/api.ts`.
3. Strings the user sees: a `ui.*` key in `ui/messages.ts`, added in `en` and `de`. Icons: paste
   the Lucide path into `ui/Icon/icons.ts` (D43). Never a new dependency without a line in
   `docs/design.md`.
4. Gates, in order: `bun run check`, `bun scripts/ui-lint.ts ui pages`, `just contrast` (add a
   pair to `scripts/contrast.ts` when the piece paints a new combination), `just index`,
   `bun scripts/screenshots.ts --only=<Name>` then Read both PNGs and look at them, `bun test`.
5. `README.md`: add the name to the tier table. `docs/design.md`: a new numbered decision when a
   convention changed, never an edit of an old one.

## Changing a token or preset

- Never rename or remove a token: projects copied it. Add the new one, keep the old as an alias
  (`--ui-old: var(--ui-new)`) with a comment and a D-decision.
- A preset changes tokens only (D6). A preset that needs more is a request for a token.
- After a change: `just contrast` must pass in both themes for every preset; `just screenshots`
  for the pieces that use the token.

## Changing a block's livewire wiring

- The runtime in `demo/src/api/` is a byte copy of a livewire release (D40). To move to a newer
  release, re-copy both files, keep the header line with the new version, run the fake engine
  tests (`bun test demo/src`) and every block demo.

## Commit

One piece per commit, message `<Name>: <what it does in one line>`, no attribution footers.
