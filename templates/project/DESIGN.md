# Design contract

The one look of this product. Every page is built against this file; `ui-lint` enforces the
mechanical part. Changing it is a decision, recorded below with a date.

## Direction

- Product: <one sentence: what it is and for whom>
- Tone: <one sentence: how it should feel to use>
- Three adjectives: <calm, dense, precise>
- The user must never feel: <lost, rushed, unsure whether it saved>

## Preset and tokens

- Preset: `neutral` (from govengers/ui @ <commit>), file `src/ui/presets/neutral.css`
- Themes: light and dark, following the system (`useTheme`, toggle in the user menu)
- Density: comfortable (compact on the monitor pages, if any)
- Token overrides (in the preset file, tokens only): none
- Fonts: system stack (`--ui-font-sans`); self-hosted font: none

## Page recipes in use

| Recipe | Pages |
|--------|-------|
| ListPage | <customers.list, orders.list> |
| DetailPage | <customers.detail> |
| SettingsPage | <settings.general> |
| LoginPage | auth.login |
| Dashboard | home.dashboard |

## Rules

1. A new page picks a recipe above or gets an exception below before it is built.
2. No component outside `src/ui/`. Need one: `ui-copy` from govengers/ui first; otherwise write
   it in `src/ui/<Name>/` in the same style and add it to `src/ui/INDEX.md`.
3. No colour, length or font that is not a token. `just ui-lint` runs in CI.
4. One primary action per page, in the `PageHeader`. `danger` only for destructive actions.
5. Every page root carries `data-page`, every mutating button `data-action`, every field `name`.
6. Agent drive mode: submits of <none> may run unattended; everything else pauses on the submit.

## Exceptions

| Page | Closest recipe | Why | Date |
|------|----------------|-----|------|

## Decisions

| Date | What changed | Why |
|------|--------------|-----|
| <today> | created by ui-start (--quick) | |
