---
name: format
tier: primitive
intent: [format date, format number, relative time, duration, bytes, currency, percent]
uses: []
livewire: false
status: ready
---

# format

The formatting helpers every page uses (D20, D34): `formatDateTime`, `formatDate`, `formatTime`,
`formatAge` (relative, "3 minutes ago"), `formatSpan` (durations), `formatBytes`, `formatNumber`,
`formatCurrency`, `formatPercent`. `Intl` for display with the app locale, `date-fns` for
parsing and arithmetic. A single file, `ui/format.ts`; `ui-copy` copies the file.

## Gotchas

- Always pass the app locale; never format with a hard-coded one in a component.
- `formatAge` takes `now` as a parameter so tests and clock-driven views stay deterministic.
