# Stage 02: foundation

## Input
The block from `01-preflight`.

## Process
1. Dependencies: `vue`, `vue-router`, `vue-i18n`, `date-fns` present (`bun add` the missing).
   Nothing else (D3).
2. Copy into `src/ui/`: `ui/tokens.css`, `ui/base.css`, `ui/presets/neutral.css` (full mode:
   the preset the direction picks, later), `ui/messages.ts`, `ui/format.ts`, `ui/theme.ts`,
   `ui/agent/` (D11, D48). Header line on every file.
3. The shell closure through `workbooks/copy-piece/` (stages 01-03, one run): `AppShell`,
   `Page`, `PageHeader`, `Banner`, `Button`, `Icon`, `Menu`, `Popover`, `Toast`, `Dialog`,
   `Field`, `Input`, `ConnectionBanner` (when a livewire client exists).
4. `src/main.ts` after `templates/project/main.ts` (tokens, base, preset, messages, router,
   `livePlugin(pair)` when a client exists); `src/App.vue` after `templates/project/App.vue`
   (`AppShell`, banners, `Toast` once, the dock slot commented for later).

## Output
```
copied: <n> files from <source> @ <commit>
shell: <pieces>
main.ts: wired (livewire: yes|no)
```

## Completion
Full mode: run `workbooks/design-direction/` now, then proceed to `03-contract` with its
outcome. Quick mode: proceed to `03-contract`.
