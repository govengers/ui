# AGENTS.md

What a coding agent reads before touching this repository or copying from it. By task.

## I want to use a component, block or page in a project

1. Read the project's `DESIGN.md` and `src/ui/INDEX.md` first. If the project has no `DESIGN.md`,
   run the `ui-start` skill before anything else.
2. Open [INDEX.md](INDEX.md) here, find the piece by intent, read its card (`<Name>.md`), look at
   `screenshots/<Name>.light.png`.
3. Copy with the `ui-copy` skill: it copies the directory and its `uses` closure into
   `src/ui/<Name>/` (blocks into `src/ui/blocks/`, pages into `src/pages/`), drops the card and
   the demo, and stamps the header line. Copy by hand only if the skill is unavailable, then do
   the same four things.
4. Never adapt the copy here; adapt it in the project. If the change is general, bring it back
   here as a separate task.

## I want to build a new page in a project

Use the `ui-page` skill: pick a recipe from [pages/](pages/), read its card, compose blocks, set
`data-page`, name every mutating action with `data-action`, write the page's `messages.ts`, run
`ui-lint`. A page that fits no recipe gets a written exception in the project's `DESIGN.md`.

## I want to add or change a component here

Use the `ui-maintain` skill. The rules it enforces:

- one directory per piece: `<Name>.vue`, `<Name>.md` (card with front matter), `<Name>.demo.vue`
- `<script setup lang="ts">`, typed props with `withDefaults`, typed emits, named slots
- root class `ui-<name>`, parts `ui-<name>__part`, variants as `data-variant`, sizes as
  `data-size`, never a computed class name (D41)
- `<style scoped>` with `var(--ui-*)` only: no hex, no px except `1px` borders, no font-family
- strings the user sees come from `ui.*` keys in `ui/messages.ts` or from props
- native elements first; keyboard, focus ring, labels and 44 px targets are not optional
- every mutating control passes `data-action` through to its root
- primitives import nothing from `@/api`; blocks import nothing outside `@/api/runtime` and
  `@/api/vue` (types, composables, `ApiError`, `prepareCall`) and take descriptors as props
- after the change: `just check`, `just index`, `just contrast`, `just screenshots --only=<Name>`

## I want to review UI work in a project

Use the `ui-review` skill. It checks the design contract, the mechanical rules of `ui-lint`, the
accessibility floor, measured contrast, and the livewire gotchas (`!error && loading`, live errors
without HTTP status, one failure and one retry per screen).

## Where things are

| Path | What |
|------|------|
| `ui/tokens.css`, `ui/base.css`, `ui/presets/` | tokens, base styles, presets |
| `ui/<Name>/` | primitives and layout pieces |
| `ui/blocks/<Name>/` | livewire-wired blocks |
| `pages/<Name>/` | page recipes |
| `patterns/` | intent guides |
| `skills/` | the five skills |
| `templates/` | files copied into a target project |
| `demo/` | the demonstrator (`just demo`) |
| `scripts/` | index, contrast, screenshots, ui-lint |
| `docs/design.md` | every decision, numbered |
