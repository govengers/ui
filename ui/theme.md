---
name: theme
tier: primitive
intent: [dark mode, light mode, theme toggle, color scheme]
uses: []
livewire: false
status: ready
laws: []
---

# theme

`useTheme()` (D35, D37): `light | dark | auto`, `auto` by default, applied as `data-theme` on
`<html>`, kept in `localStorage`, optionally mirrored to a user setting through `persist`. A
single file, `ui/theme.ts`; `ui-copy` copies the file. The toggle lives in the shell's user menu.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `base.css`, `format.ts`, `messages.ts`, `theme.ts`, `tokens.css` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `theme.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

