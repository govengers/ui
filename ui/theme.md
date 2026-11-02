---
name: theme
tier: primitive
intent: [dark mode, light mode, theme toggle, color scheme]
uses: []
livewire: false
status: ready
---

# theme

`useTheme()` (D35, D37): `light | dark | auto`, `auto` by default, applied as `data-theme` on
`<html>`, kept in `localStorage`, optionally mirrored to a user setting through `persist`. A
single file, `ui/theme.ts`; `ui-copy` copies the file. The toggle lives in the shell's user menu.
