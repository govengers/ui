---
name: ui-start
description: Set up govengers/ui in a Vue 3 project before the first page. Copies tokens, base styles, a preset, the shell closure, messages, format and theme helpers, writes DESIGN.md (the design contract), the CLAUDE.md UI section, ui-lint and the project-side skills. Use at project start, when a project has no DESIGN.md, or on "set up the UI", "start the frontend", "ui-start". Args - `--quick` (defaults, one step) or `--full` (brief, direction, custom preset).
---

# ui-start

Sets a Vue 3 project up so every page after this one follows one design contract (D1, D12, D19).

## Inputs

- Mode: `--quick` (default when the user wants to get going) or `--full`.
- Source: the govengers/ui checkout. Use `$GOVENGERS_UI` if set, else `~/github.com/govengers/ui`,
  else `git clone --depth 1 https://github.com/govengers/ui` into a temporary directory. Record
  its commit: `git -C <source> rev-parse --short HEAD`.
- Target: the project root (has `package.json`, `src/`, Vite with `@` resolving to `src`). If the
  project has no frontend yet, scaffold it first (`bun create vite ui --template vue-ts`) and treat
  that directory as the target.

## Steps

1. **Read before writing.** `<source>/AGENTS.md`, `<source>/docs/design.md` (D1 to D13 at least),
   `<source>/templates/project/README.md`. Check the target for an existing `DESIGN.md` or
   `src/ui/`: if present, stop and tell the user the project is already set up (use `ui-copy`).
2. **Dependencies.** Ensure `vue`, `vue-router`, `vue-i18n`, `date-fns` are in `package.json`
   (`bun add` the missing ones). Nothing else: no Quasar, no Tailwind, no icon package (D3).
3. **Copy the foundation** into `src/ui/`: `tokens.css`, `base.css`, `presets/<preset>.css`
   (quick: `neutral`), `messages.ts`, `format.ts`, `theme.ts`. Then the shell closure through the
   `ui-copy` skill (or its manual steps): `AppShell`, `Page`, `PageHeader`, `Banner`, `Button`,
   `Icon`, `Menu`, `Toast`, `Dialog`, `Field`, `Input`. Every copied file gets the header line.
4. **Wire `main.ts`** after `templates/project/main.ts`: import `./ui/tokens.css`, `./ui/base.css`,
   `./ui/presets/<preset>.css`; create i18n with `messages` from `./ui/messages` merged with the
   app's; install the router; install `livePlugin(pair)` from the generated client when the
   project has one (see livewire's `examples/todo/web/src/live.ts`). Mount `Toast` once in the
   shell after `templates/project/App.vue`.
5. **Write `DESIGN.md`** from `templates/project/DESIGN.md`.
   - `--quick`: fill the defaults (preset `neutral`, light and dark, shipped recipes, no
     overrides, no exceptions) and stop here. Ten lines, done.
   - `--full`: interview the user with the brief in the template (product, audience, one
     sentence of tone, three adjectives, what the user must never feel), propose a preset or a
     custom one (a copy of the closest preset with token overrides, written under
     `src/ui/presets/<name>.css`; tokens only, D6), measure it with `<source>/scripts/contrast.ts`
     pointed at the project (`bun <source>/scripts/contrast.ts` reads `ui/` of its cwd: run it
     from a temp dir holding `ui/tokens.css` and `ui/presets/<name>.css`), record the direction
     in `DESIGN.md`. If the `impeccable` skill is installed and the user wants it, run its
     direction step first and transcribe the outcome; never depend on it.
6. **Mechanical rules.** Copy `<source>/scripts/ui-lint.ts` to `scripts/ui-lint.ts`, add the
   recipes from `templates/project/justfile` (`ui-lint`, `ui-screens`), and the CI step from
   `templates/project/ci-ui.yml`.
7. **Agent rules.** Append `templates/project/CLAUDE.md` to the project's `CLAUDE.md` (create it
   if missing). Copy `ui-copy`, `ui-page`, `ui-review` from `<source>/skills/` into
   `.claude/skills/`. Create `src/ui/INDEX.md` listing every copied piece (name, tier, source
   commit, one line of intent).
8. **Verify.** `bun run build` (or `vue-tsc --noEmit`) and `just ui-lint` are clean; start the dev
   server and screenshot the empty shell light and dark (Playwright or the `run` skill) and look
   at it.
9. **Report** in one message: what was copied (count and commit), the preset, where `DESIGN.md`
   is, and the one rule the user must know: a new page picks a recipe or gets an exception in
   `DESIGN.md`.

## Do not

- Do not copy cards (`*.md`), demos (`*.demo.vue`) or tests into the project.
- Do not edit the source checkout. Improvements go back as a separate task there.
- Do not add a CSS framework, an icon package or a component library "to speed things up".
