---
name: format
tier: primitive
intent: [format date, format number, relative time, duration, bytes, currency, percent]
uses: []
livewire: false
status: ready
laws: [chunking, postels-law]
---

# format

The formatting helpers every page uses (D20, D34): `formatDateTime`, `formatDate`, `formatTime`,
`formatAge` (relative, "3 minutes ago"), `formatSpan` (durations), `formatBytes`, `formatNumber`,
`formatCurrency`, `formatPercent`. `Intl` for display with the app locale, `date-fns` for
parsing and arithmetic. A single file, `ui/format.ts`; `ui-copy` copies the file.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `base.css`, `format.ts`, `messages.ts`, `theme.ts`, `tokens.css` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `format.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Gotchas

- Always pass the app locale; never format with a hard-coded one in a component.
- `formatAge` takes `now` as a parameter so tests and clock-driven views stay deterministic.
